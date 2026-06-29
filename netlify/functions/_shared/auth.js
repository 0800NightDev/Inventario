const jwt = require('jsonwebtoken');

function verifyAuth(event) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  try {
    const token = authHeader.split(' ')[1];
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

function requireAuth(event) {
  const user = verifyAuth(event);
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'No autorizado' }) };
  }
  return user;
}

function requireRole(event, roles) {
  const result = requireAuth(event);
  if (result.statusCode) return result; // Es una respuesta de error
  if (!roles.includes(result.role)) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Acceso denegado' }) };
  }
  return result;
}

module.exports = { verifyAuth, requireAuth, requireRole };
