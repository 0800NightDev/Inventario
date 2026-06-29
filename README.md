# 🏥 Sistema de Mando: Inventario Radiología (SPA + Netlify + Supabase)

Este proyecto es una aplicación Single Page Application (SPA) para la gestión y control de inventarios de placas radiográficas, migrado de una arquitectura Flask/Python a un stack serverless ultraligero y escalable en **Netlify** y **Supabase**.

---

## 🚀 Características
- **Arquitectura Serverless**: Despliegue estático del frontend en Netlify con backend ejecutado en Netlify Functions (Node.js).
- **Base de Datos Cloud**: Persistencia de datos SQL relacionales y almacenamiento de archivos (fotos de carnet/comprobantes) utilizando **Supabase**.
- **Ajustes Estéticos Modernos**: Interfaz limpia con soporte de modo oscuro/claro y efecto glassmorphic **LiquidGL (Preset Pulse)** sobre las tarjetas de inventario y el panel de acceso.
- **Roles y Permisos**:
  - `superusuario`: Control total (limpieza, datos de prueba).
  - `administrador`: Asignación de tareas, aprobación de lotes, filtros avanzados, exportación Excel.
  - `trabajador`: Registro libre de stock y confirmaciones fotográficas de despachos asignados.

---

## 🛠️ Requisitos Previos
1. **Node.js** (v18 o superior).
2. Una cuenta en [Supabase](https://supabase.com) (Gratuita).
3. Una cuenta en [Netlify](https://netlify.com) (Gratuita).

---

## ⚙️ Configuración Paso a Paso

### 1. Preparar la Base de Datos (Supabase)
1. Crea un nuevo proyecto en tu panel de Supabase.
2. Abre la sección de **SQL Editor** en Supabase, copia el contenido de `schema.sql` de este repositorio, pégalo y presiona **Run**. Esto creará:
   - Las tablas `users`, `inventory` y `transactions` con sus índices.
   - Las políticas de seguridad.
   - Los usuarios de prueba por defecto.
3. Ve a **Storage** en Supabase, y crea un nuevo bucket público llamado `uploads`. Este bucket almacenará los comprobantes y fotos de carnet.

### 2. Configurar Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:
```bash
cp .env.example .env
```
Completa las variables con tus credenciales de Supabase:
- `SUPABASE_URL`: URL del proyecto (encontrada en Settings -> API).
- `SUPABASE_ANON_KEY`: Clave anon/public (encontrada en Settings -> API).
- `SUPABASE_SERVICE_KEY`: Clave de servicio/service_role (encontrada en Settings -> API - **Mantener privada**).
- `JWT_SECRET`: Una cadena de texto aleatoria para firmar las sesiones.

---

## 💻 Desarrollo y Pruebas Locales

Para ejecutar el proyecto localmente, ejecuta el script de inicio:
```bash
./iniciar.sh
```

El script instalará las dependencias necesarias y lanzará el servidor de desarrollo local usando Netlify CLI:
- **Frontend SPA**: `http://localhost:8888`
- **Netlify Functions**: `http://localhost:8888/.netlify/functions/...`

### 🔑 Credenciales de Prueba (Por Defecto)
* **Superusuario**: Usuario `admin` / Contraseña `admin123`
* **Administrador**: Usuario `administrador` / Contraseña `admin123`
* **Trabajador**: Usuario `trabajador` / Contraseña `trabajador123`

---

## 📦 Despliegue en Producción (Netlify)

1. Sube este proyecto clonado a tu cuenta de GitHub/GitLab.
2. Crea un nuevo sitio en Netlify importándolo desde tu repositorio de Git.
3. En la configuración de Despliegue de Netlify, agrega las variables de entorno configuradas en tu `.env`:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `JWT_SECRET`
4. Netlify detectará automáticamente el archivo `netlify.toml` y configurará el build del frontend estático y las funciones serverless de forma automática.
5. ¡Listo! Tendrás un deploy estable y utilizable.
