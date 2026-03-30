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

## Paso 3: Conectar con GitHub
1. Una vez creado el Space, ve a la pestaña **"Settings"**.
2. Baja hasta **"Github Network"** o simplemente ve a la pestaña principal y sigue las instrucciones para subir el código.
3. **Recomendación:** La forma más fácil es ir a **"Settings"** -> **"Variables and secrets"** e ignorar el repo por ahora, o simplemente subir tus archivos directamente a la interfaz de Hugging Face.
4. **Para sincronización automática:** Ve a **"Settings"** -> **"Repository Settings"** y busca la opción para conectar tu repo de GitHub.

## Paso 4: Variables de Entorno (Opcional pero Recomendado)
Si quieres persistencia permanente de datos (PostgreSQL):
1. Ve a **"Settings"** -> **"Variables and secrets"**.
2. Añade un **Secret** llamado `DATABASE_URL` con el enlace de tu base de datos (Ej: Neon.tech o Supabase).
3. Si no añades nada, usará SQLite (pero se borrará si el Space se reinicia por inactividad).

---

**Nota sobre Hugging Face:**  
El Space se "dormirá" tras unos minutos de inactividad para ahorrar recursos, pero al entrar de nuevo a la URL se despertará solo en unos segundos. ¡Es totalmente gratis!
