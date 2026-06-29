-- ═══════════════════════════════════════════════════════════════
-- Inventario Radiografía — Schema SQL para Supabase
-- Ejecutar este script en el SQL Editor de Supabase Dashboard
-- ═══════════════════════════════════════════════════════════════

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'trabajador',
  status VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  whatsapp_number VARCHAR(30),
  foto_carnet VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de inventario
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  tamano_placa VARCHAR(50) NOT NULL,
  formato VARCHAR(20) NOT NULL,
  fecha_vencimiento VARCHAR(10),
  cantidad_cajas INTEGER NOT NULL DEFAULT 0
);

-- Tabla de transacciones
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(20) NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  tamano_placa VARCHAR(50) NOT NULL,
  formato VARCHAR(20) NOT NULL,
  fecha_vencimiento VARCHAR(10),
  cantidad_cajas INTEGER NOT NULL,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  imagen_path VARCHAR(255),
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_transactions_estado ON transactions(estado);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_fecha ON transactions(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_formato ON inventory(formato);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Habilitar Row Level Security (RLS) — las Netlify Functions usan service_key que bypasea RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Política: service_role tiene acceso total (las funciones serverless usan este rol)
CREATE POLICY "Service role full access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON transactions FOR ALL USING (true) WITH CHECK (true);
