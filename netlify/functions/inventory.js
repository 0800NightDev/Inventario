const { getSupabase } = require('./_shared/supabase');
const { requireAuth } = require('./_shared/auth');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  // Verificar autenticación
  const user = requireAuth(event);
  if (user.statusCode) return { ...user, headers };

  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('inventory')
      .select('id, tamano_placa, formato, fecha_vencimiento, cantidad_cajas')
      .order('formato', { ascending: true })
      .order('tamano_placa', { ascending: true });

    if (error) {
      console.error('Error consultando inventario:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Error al consultar el inventario' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data || [])
    };
  } catch (err) {
    console.error('Error en inventory:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error interno del servidor' })
    };
  }
};
