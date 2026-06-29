// ═══════════════════════════════════════════════════════════════
//  Inventario Radiografía — Servidor de Desarrollo Local Custom
//  (Compatible con Node v26 y sin dependencias externas)
// ═══════════════════════════════════════════════════════════════

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// 1. Cargar variables de entorno de .env manualmente
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
      // Remover comillas alrededor del valor si existen
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  });
  console.log('✅ Variables de entorno cargadas desde .env');
} else {
  console.log('⚠️  No se encontró archivo .env local. Recuerda crearlo usando .env.example.');
}

const PORT = 8888;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // 2. Ruta de API (Netlify Functions redirigidas)
  if (pathname.startsWith('/api/') || pathname.startsWith('/.netlify/functions/')) {
    const functionName = pathname.startsWith('/api/') 
      ? pathname.substring(5) 
      : pathname.substring(20);

    const functionPath = path.join(__dirname, '../netlify/functions', `${functionName}.js`);

    if (!fs.existsSync(functionPath)) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: `Function ${functionName} not found` }));
      return;
    }

    // Leer cuerpo de la petición
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', async () => {
      try {
        // Limpiar caché de Node para desarrollo en vivo
        delete require.cache[require.resolve(functionPath)];
        delete require.cache[require.resolve('../netlify/functions/_shared/auth.js')];
        delete require.cache[require.resolve('../netlify/functions/_shared/supabase.js')];

        const netlifyFunction = require(functionPath);

        // Construir mock de evento Netlify
        const event = {
          httpMethod: req.method,
          headers: req.headers,
          queryStringParameters: parsedUrl.query,
          body: body
        };

        const context = {};

        console.log(`🌐 [API] ${req.method} ${pathname}`);
        const result = await netlifyFunction.handler(event, context);

        // Enviar respuesta
        res.statusCode = result.statusCode || 200;
        if (result.headers) {
          Object.entries(result.headers).forEach(([k, v]) => {
            res.setHeader(k, v);
          });
        }
        
        if (result.isBase64Encoded) {
          res.end(Buffer.from(result.body, 'base64'));
        } else {
          res.end(result.body || '');
        }
      } catch (err) {
        console.error(`❌ Error en function ${functionName}:`, err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal Server Error', details: err.message }));
      }
    });
    return;
  }

  // 3. Servir archivos estáticos del frontend
  let filePath = path.join(__dirname, '../', pathname === '/' ? 'index.html' : pathname);
  
  // Seguridad: Evitar Directory Traversal
  if (!filePath.startsWith(path.join(__dirname, '../'))) {
    res.statusCode = 403;
    res.end('Access Denied');
    return;
  }

  fs.exists(filePath, (exists) => {
    if (!exists) {
      // Si el archivo no existe, redirigir a index.html (SPA routing support)
      filePath = path.join(__dirname, '../index.html');
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.statusCode = 500;
        res.end(`Error reading file: ${err.message}`);
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      res.setHeader('Content-Type', MIME_TYPES[ext] || 'text/plain');
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  console.log(`\n🏥 Servidor local de Inventario Radiografía ejecutándose en:`);
  console.log(`   👉 http://localhost:${PORT}\n`);
});
