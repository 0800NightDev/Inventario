const bcrypt = require('bcryptjs');
const { getSupabase } = require('./_shared/supabase');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// Extensiones de imagen permitidas
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif'];

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { username, password, whatsapp_number, foto_carnet } = body;

    // Validar campos requeridos
    if (!username || !password || !whatsapp_number || !foto_carnet) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Todos los campos son requeridos: username, password, whatsapp_number, foto_carnet' })
      };
    }

    // Validar que foto_carnet tenga la estructura esperada
    if (!foto_carnet.name || !foto_carnet.type || !foto_carnet.data) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'foto_carnet debe incluir name, type y data (base64)' })
      };
    }

    // Validar tipo de archivo
    const ext = foto_carnet.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: `Tipo de archivo no permitido. Formatos válidos: ${ALLOWED_EXTENSIONS.join(', ')}` })
      };
    }

    const supabase = getSupabase();

    // Verificar que el username no esté tomado
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existing) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'El nombre de usuario ya está en uso' })
      };
    }

    // Subir foto a Supabase Storage
    const fileName = `carnet_${username}_${Date.now()}.${ext}`;
    const fileBuffer = Buffer.from(foto_carnet.data, 'base64');

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(fileName, fileBuffer, {
        contentType: foto_carnet.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Error subiendo foto:', uploadError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Error al subir la foto del carnet' })
      };
    }

    // Hash de la contraseña
    const password_hash = await bcrypt.hash(password, 10);

    // Insertar usuario con rol trabajador y estado pendiente
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        username,
        password_hash,
        role: 'trabajador',
        status: 'pendiente',
        whatsapp_number,
        foto_carnet: fileName
      });

    if (insertError) {
      console.error('Error creando usuario:', insertError);
      // Intentar limpiar la foto subida
      await supabase.storage.from('uploads').remove([fileName]);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Error al crear el usuario' })
      };
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ message: 'Registro exitoso. Tu cuenta está pendiente de aprobación por un administrador.' })
    };
  } catch (err) {
    console.error('Error en auth-register:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error interno del servidor' })
    };
  }
};
