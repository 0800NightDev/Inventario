const bcrypt = require('bcryptjs');
const { getSupabase } = require('./_shared/supabase');
const { requireRole } = require('./_shared/auth');

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

  // Solo admin o superusuario
  const user = requireRole(event, ['administrador', 'superusuario']);
  if (user.statusCode) return { ...user, headers };

  try {
    switch (event.httpMethod) {
      case 'GET':
        return await handleGet(user);
      case 'PUT':
        return await handlePut(event, user);
      case 'DELETE':
        return await handleDeleteUser(event, user);
      default:
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) };
    }
  } catch (err) {
    console.error('Error en users:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error interno del servidor' })
    };
  }
};

// ── GET — listar usuarios (excluir superusuarios) ───────────
async function handleGet(currentUser) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('users')
    .select('id, username, role, status, whatsapp_number, foto_carnet')
    .neq('role', 'superusuario')
    .order('username', { ascending: true });

  if (error) throw error;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(data || [])
  };
}

// ── PUT — acciones sobre usuarios ───────────────────────────
async function handlePut(event, currentUser) {
  const body = JSON.parse(event.body || '{}');
  const { user_id, accion, value } = body;

  if (!user_id || !accion) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'user_id y accion son requeridos' })
    };
  }

  const supabase = getSupabase();

  switch (accion) {
    case 'aprobar': {
      const { error } = await supabase
        .from('users')
        .update({ status: 'activo' })
        .eq('id', user_id);

      if (error) throw error;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Usuario aprobado exitosamente' })
      };
    }

    case 'eliminar': {
      // Buscar el usuario para obtener la foto
      const { data: targetUser } = await supabase
        .from('users')
        .select('foto_carnet')
        .eq('id', user_id)
        .single();

      // Eliminar foto del storage si existe
      if (targetUser && targetUser.foto_carnet) {
        await supabase.storage.from('uploads').remove([targetUser.foto_carnet]);
      }

      // Eliminar el usuario
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user_id);

      if (error) throw error;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Usuario eliminado exitosamente' })
      };
    }

    case 'reset_password': {
      if (!value) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Se requiere el valor de la nueva contraseña' })
        };
      }

      const password_hash = await bcrypt.hash(value, 10);
      const { error } = await supabase
        .from('users')
        .update({ password_hash })
        .eq('id', user_id);

      if (error) throw error;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Contraseña actualizada exitosamente' })
      };
    }

    case 'update_whatsapp': {
      if (!value && value !== '') {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Se requiere el valor del número de WhatsApp' })
        };
      }

      const { error } = await supabase
        .from('users')
        .update({ whatsapp_number: value })
        .eq('id', user_id);

      if (error) throw error;
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Número de WhatsApp actualizado' })
      };
    }

    default:
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Acción no válida: ${accion}` })
      };
  }
}

// ── DELETE — eliminar usuario ────────────────────────────────
async function handleDeleteUser(event, currentUser) {
  const params = event.queryStringParameters || {};
  const userId = params.user_id;

  if (!userId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'user_id es requerido' }) };
  }

  const supabase = getSupabase();

  // Buscar usuario para foto
  const { data: targetUser } = await supabase
    .from('users')
    .select('foto_carnet')
    .eq('id', userId)
    .single();

  if (targetUser && targetUser.foto_carnet) {
    await supabase.storage.from('uploads').remove([targetUser.foto_carnet]);
  }

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) throw error;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: 'Usuario eliminado exitosamente' })
  };
}
