# Guía de Despliegue en Hugging Face Spaces (Gratis)

Esta guía te ayudará a poner el **Sistema de Inventario** en línea usando [Hugging Face Spaces](https://huggingface.co/spaces), una plataforma **100% gratuita** para hosting de aplicaciones Python.

## Paso 1: Sube tus cambios a GitHub
Asegúrate de que el nuevo `Dockerfile` esté en tu repositorio:
```bash
git add .
git commit -m "Preparación para Hugging Face Spaces (Docker)"
git push origin main
```

## Paso 2: Crear el Space en Hugging Face
1. Inicia sesión en [Hugging Face](https://huggingface.co/).
2. Haz clic en **"New"** -> **"Space"**.
3. Ponle un nombre a tu proyecto.
4. **IMPORTANTE:** En **"SDK"**, selecciona **"Docker"**.
5. En **"Docker template"**, selecciona **"Blank"** (usaremos nuestro propio `Dockerfile`).
6. Elige **"Public"** o **"Private"** (puedes cambiarlo luego).
7. Dale a **"Create Space"**.

## Paso 3: Cargar el código (2 Opciones)

Hugging Face ha actualizado su interfaz. Elige la que te parezca más fácil:

### Opción A: "Espejo" (Mirroring) - Sincroniza desde GitHub automáticamente
1. En tu Space, ve a la pestaña **Settings**.
2. Busca la sección **"Repository mirroring"**.
3. En **"Git repository URL"**, pega el enlace de tu repo (ej: `https://github.com/tu-usuario/tu-repo.git`).
4. Haz clic en el botón de guardar. Esto hará que cada vez que subas algo a GitHub, Hugging Face lo detecte y actualice el sitio.

### Opción B: Empujar directamente (Git Push) - La más fiable
Si no quieres configurar espejos, puedes subirlo desde tu terminal de esta manera:
1. En tu terminal (dentro de la carpeta del proyecto), busca el enlace de clonación de tu Space (está en la página principal del Space, botón "Clone").
2. Agrega Hugging Face como un nuevo "destino" remoto:
   ```bash
   git remote add hf https://huggingface.co/spaces/TU_USUARIO/TU_SPACE_NAME
   ```
3. Sube el código:
   ```bash
   git push hf main --force
   ```
   *(Te pedirá tu usuario de Hugging Face y tu Token de acceso como contraseña).*

---

## Paso 4: ¿Dónde ver el progreso?
Ve a la pestaña **"App"** o **"Logs"** de tu Space. Verás cómo Hugging Face lee el `Dockerfile`, instala las librerías y levanta el sistema. ¡Una vez termine aparecerá el botón "View App"!

## Paso 4: Variables de Entorno (Opcional pero Recomendado)
Si quieres persistencia permanente de datos (PostgreSQL):
1. Ve a **"Settings"** -> **"Variables and secrets"**.
2. Añade un **Secret** llamado `DATABASE_URL` con el enlace de tu base de datos (Ej: Neon.tech o Supabase).
3. Si no añades nada, usará SQLite (pero se borrará si el Space se reinicia por inactividad).

---

**Nota sobre Hugging Face:**  
El Space se "dormirá" tras unos minutos de inactividad para ahorrar recursos, pero al entrar de nuevo a la URL se despertará solo en unos segundos. ¡Es totalmente gratis!
