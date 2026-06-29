const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno de .env
const dotenvPath = path.join(__dirname, '../.env');
if (fs.existsSync(dotenvPath)) {
  const envContent = fs.readFileSync(dotenvPath, 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const index = trimmed.indexOf('=');
    if (index > 0) {
      const key = trimmed.substring(0, index).trim();
      let val = trimmed.substring(index + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  });
}

async function seed() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.error('Error: Faltan variables SUPABASE_URL o SUPABASE_SERVICE_KEY en .env');
    return;
  }

  const supabase = createClient(url, key);

  console.log('Comprobando usuarios en la base de datos...');
  
  const defaultUsers = [
    { username: 'admin', password: 'admin123', role: 'superusuario' },
    { username: 'administrador', password: 'admin123', role: 'administrador' },
    { username: 'trabajador', password: 'trabajador123', role: 'trabajador' }
  ];

  for (const defaultUser of defaultUsers) {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', defaultUser.username)
      .maybeSingle();

    if (existingUser) {
      console.log(`Usuario @${defaultUser.username} ya existe con id ${existingUser.id}`);
    } else {
      console.log(`Creando usuario @${defaultUser.username}...`);
      const password_hash = await bcrypt.hash(defaultUser.password, 10);
      
      const { data, error } = await supabase
        .from('users')
        .insert({
          username: defaultUser.username,
          password_hash,
          role: defaultUser.role,
          status: 'activo'
        })
        .select();

      if (error) {
        console.error(`Error al crear @${defaultUser.username}:`, error.message);
      } else {
        console.log(`Usuario @${defaultUser.username} creado exitosamente con id ${data[0].id}`);
      }
    }
  }
}

seed().catch(console.error);
