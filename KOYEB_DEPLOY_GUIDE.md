# Guía de Despliegue en Koyeb.com

Esta guía te ayudará a poner el **Sistema de Inventario** en línea usando [Koyeb](https://www.koyeb.com/), una excelente alternativa gratuita para aplicaciones Flask.

## Paso 1: Sube tus cambios a GitHub
Si aún no lo has hecho, asegúrate de que tu código esté actualizado en tu repositorio:
```bash
git add .
git commit -m "Preparación para despliegue en Koyeb"
git push origin main
```

## Paso 2: Crear el Servicio en Koyeb
1. Regístrate o inicia sesión en [Koyeb.com](https://app.koyeb.com/).
2. Haz clic en **"Create Service"**.
3. Selecciona **GitHub** como despliegue.
4. Conecta tu repositorio de Inventario.
5. Selecciona la rama (ej. `main`).

## Paso 3: Configuración del Servicio
En la pantalla de configuración, asegúrate de lo siguiente:

### 1. Build & Run settings
- **Build Command:** `./build.sh` (Koyeb lo detectará automáticamente si usas Web Service).
- **Run Command:** `gunicorn app:app -b 0.0.0.0:8000`
- **Port:** 8000 (O el que prefieras, pero asegúrate de que coincida con el comando de ejecución).

### 2. Variables de Entorno (Environment Variables)
Haz clic en **"Add Variable"** para añadir las siguientes:
- `PORT`: `8000`
- `DATABASE_URL`: (Aquí debes pegar la URL de tu base de datos externa de PostgreSQL, por ejemplo de **Supabase** o **Neon.tech** si quieres persistencia gratuita permanente, o puedes usar la base de datos interna de Koyeb si está disponible en tu región).
  - *Si no pones nada, el sistema usará SQLite local, pero recuerda que los datos se borrarán al reiniciar la app.*

## Paso 4: Desplegar
Haz clic en **"Deploy"**. Koyeb comenzará a compilar tu aplicación usando el script `build.sh` que preparamos. Una vez termine, te dará una URL pública (ej. `https://xxx.koyeb.app`).

---

**Nota sobre la Base de Datos:**  
Para una persistencia real y gratuita, te recomiendo crear una base de datos en [Neon.tech](https://neon.tech/) o [Supabase](https://supabase.com/) y poner ese enlace en la variable `DATABASE_URL`. De lo contrario, Koyeb usará SQLite y los datos se perderán cada vez que la aplicación se actualice o se detenga por inactividad.
