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

async function check() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  const supabase = createClient(url, key);

  console.log('--- TABLE users (plural) ---');
  const { data: usersPlural, error: errP } = await supabase.from('users').select('*');
  if (errP) console.error(errP.message);
  else console.log(usersPlural);

  console.log('--- TABLE user (singular) ---');
  const { data: usersSingular, error: errS } = await supabase.from('user').select('*');
  if (errS) console.error(errS.message);
  else console.log(usersSingular);
}

check().catch(console.error);
