const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getSupabase } = require('./_shared/supabase');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  // Preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { username, password } = body;

    if (!username || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Usuario y contraseña son requeridos' })
      };
    }

    const supabase = getSupabase();

    // Buscar usuario por username
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Usuario o contraseña incorrectos' })
      };
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Usuario o contraseña incorrectos' })
      };
    }

    // Verificar que la cuenta esté activa
    if (user.status !== 'activo') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Tu cuenta está pendiente de aprobación' })
      };
    }

    // Generar JWT con expiración de 24h
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        token,
        user: { id: user.id, username: user.username, role: user.role }
      })
    };
  } catch (err) {
    console.error('Error en auth-login:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error interno del servidor' })
    };
  }
};
