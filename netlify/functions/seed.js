const { getSupabase } = require('./_shared/supabase');
const { requireRole } = require('./_shared/auth');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// Datos para generación aleatoria
const TAMANOS = ['14x14', '14x17', '10x14 (26x36)', '10x12'];
const FORMATOS = ['CR', 'DR'];

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  // Solo superusuario
  const user = requireRole(event, ['superusuario']);
  if (user.statusCode) return { ...user, headers };

  try {
    const body = JSON.parse(event.body || '{}');
    const { action } = body;

    if (!action || !['generate', 'delete_all'].includes(action)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'action debe ser "generate" o "delete_all"' })
      };
    }

    const supabase = getSupabase();

    if (action === 'delete_all') {
      return await handleDeleteAll(supabase);
    } else {
      return await handleGenerate(supabase, user);
    }
  } catch (err) {
    console.error('Error en seed:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error interno del servidor' })
    };
  }
};

// ── Eliminar todos los datos de prueba ───────────────────────
async function handleDeleteAll(supabase) {
  // Eliminar todas las transacciones
  const { error: txErr } = await supabase
    .from('transactions')
    .delete()
    .neq('id', 0); // Eliminar todo (neq(id, 0) == where id != 0, o sea todos)

  if (txErr) throw txErr;

  // Eliminar todo el inventario
  const { error: invErr } = await supabase
    .from('inventory')
    .delete()
    .neq('id', 0);

  if (invErr) throw invErr;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: 'Todos los datos de transacciones e inventario han sido eliminados' })
  };
}

// ── Generar datos de prueba ──────────────────────────────────
async function handleGenerate(supabase, user) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const transactions = [];

  for (let i = 0; i < 25; i++) {
    // 70% ingreso, 30% egreso
    const tipo = Math.random() < 0.7 ? 'ingreso' : 'egreso';
    const tamano = TAMANOS[Math.floor(Math.random() * TAMANOS.length)];
    const formato = FORMATOS[Math.floor(Math.random() * FORMATOS.length)];
    const cantidad = Math.floor(Math.random() * 36) + 5; // 5 a 40

    // Fecha aleatoria dentro del mes actual
    const dia = Math.floor(Math.random() * daysInMonth) + 1;
    const hora = Math.floor(Math.random() * 24);
    const minuto = Math.floor(Math.random() * 60);
    const fecha = new Date(year, month, dia, hora, minuto);

    transactions.push({
      tipo,
      user_id: user.id,
      admin_id: user.id,
      tamano_placa: tamano,
      formato,
      fecha_vencimiento: null,
      cantidad_cajas: cantidad,
      fecha: fecha.toISOString(),
      imagen_path: null,
      estado: 'aprobada'
    });
  }

  // Insertar todas las transacciones
  const { error: txErr } = await supabase
    .from('transactions')
    .insert(transactions);

  if (txErr) throw txErr;

  // Calcular impacto en inventario agrupando por tamano + formato
  const inventoryMap = {};

  for (const tx of transactions) {
    const key = `${tx.tamano_placa}|${tx.formato}`;
    if (!inventoryMap[key]) {
      inventoryMap[key] = {
        tamano_placa: tx.tamano_placa,
        formato: tx.formato,
        cantidad: 0
      };
    }

    if (tx.tipo === 'ingreso') {
      inventoryMap[key].cantidad += tx.cantidad_cajas;
    } else {
      inventoryMap[key].cantidad -= tx.cantidad_cajas;
    }
  }

  // Actualizar inventario para cada combinación
  for (const key of Object.keys(inventoryMap)) {
    const item = inventoryMap[key];

    // Buscar registro existente
    const { data: existing } = await supabase
      .from('inventory')
      .select('id, cantidad_cajas')
      .eq('tamano_placa', item.tamano_placa)
      .eq('formato', item.formato)
      .is('fecha_vencimiento', null)
      .maybeSingle();

    if (existing) {
      const nuevaCantidad = Math.max(0, existing.cantidad_cajas + item.cantidad);
      await supabase
        .from('inventory')
        .update({ cantidad_cajas: nuevaCantidad })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('inventory')
        .insert({
          tamano_placa: item.tamano_placa,
          formato: item.formato,
          fecha_vencimiento: null,
          cantidad_cajas: Math.max(0, item.cantidad)
        });
    }
  }

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({
      message: `Se generaron 25 transacciones de prueba y se actualizó el inventario`,
      count: 25
    })
  };
}
