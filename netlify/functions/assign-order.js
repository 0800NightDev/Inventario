const { getSupabase } = require('./_shared/supabase');
const { requireRole } = require('./_shared/auth');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// Mapeo de etiquetas de tamaño
const TAMANO_MAP = {
  '14x14': '14x14',
  '14x17': '14x17',
  '10x14': '10x14 (26x36)',
  '10x12': '10x12'
};

function mapTamano(label) {
  return TAMANO_MAP[label] || label;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  // Solo admin o superusuario pueden asignar pedidos
  const user = requireRole(event, ['administrador', 'superusuario']);
  if (user.statusCode) return { ...user, headers };

  try {
    const body = JSON.parse(event.body || '{}');
    const { trabajador_id, items } = body;

    if (!trabajador_id || !items || !Array.isArray(items) || items.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'trabajador_id e items son requeridos' })
      };
    }

    const supabase = getSupabase();

    // Verificar que el trabajador existe
    const { data: worker, error: workerErr } = await supabase
      .from('users')
      .select('id, username, whatsapp_number')
      .eq('id', trabajador_id)
      .single();

    if (workerErr || !worker) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Trabajador no encontrado' })
      };
    }

    const createdCount = [];

    for (const item of items) {
      const totalCajas = parseInt(item.cantidad_cajas) || 0;
      if (totalCajas <= 0) continue;

      const tamano = mapTamano(item.tamano_placa);
      const formato = item.formato;
      const fechaVenc = item.fecha_vencimiento || null;

      // Crear transacción de egreso con estado asignado
      const { data: tx, error: txErr } = await supabase
        .from('transactions')
        .insert({
          tipo: 'egreso',
          user_id: trabajador_id,
          admin_id: user.id,
          tamano_placa: tamano,
          formato,
          fecha_vencimiento: fechaVenc,
          cantidad_cajas: totalCajas,
          fecha: new Date().toISOString(),
          imagen_path: null,
          estado: 'asignado'
        })
        .select()
        .single();

      if (txErr) throw txErr;
      createdCount.push(tx);
    }

    // Construir URL de WhatsApp para notificación
    let whatsappUrl = null;
    if (worker.whatsapp_number) {
      const mensaje = encodeURIComponent(
        `Hola ${worker.username}, se te han asignado ${createdCount.length} ítem(s) para entrega. Por favor revisa la app para confirmar.`
      );
      const numero = worker.whatsapp_number.replace(/[^0-9]/g, '');
      whatsappUrl = `https://wa.me/${numero}?text=${mensaje}`;
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: `Se asignaron ${createdCount.length} ítem(s) a ${worker.username}`,
        count: createdCount.length,
        whatsapp_url: whatsappUrl
      })
    };
  } catch (err) {
    console.error('Error en assign-order:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error interno del servidor' })
    };
  }
};
