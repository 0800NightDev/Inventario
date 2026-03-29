# Guía de Exportación a Android (APK) vía Capacitor 📱

El proyecto ha sido envuelto exitosamente utilizando **Capacitor** para que la aplicación web funcione como un entorno Android Nativo (capaz de acceder cómodamente a la cámara y al gestor de archivos del teléfono). 

Al tratar de compilar directamente desde esta terminal, el proceso se interrumpió (probablemente por la falta de un entorno CLI de Gradle instalado). Sin embargo, la carpeta `android_export` ya está lista. Sigue estos pasos para compilar tu **APK**:

### Paso 1: Levantar tu URL Segura con Cloudflare Tunnel
Dado que Capacitor compila hacia Android pero internamente requiere de una URL (`https`) para despachar el contenido moderno y autorizar el uso de cámara:
1. Asegúrate de tener tu servidor Flask corriendo (`python app.py` devolviendo `http://localhost:8000`).
2. En otra terminal, corre el binario que te hemos provisto:
   ```bash
   ./cloudflared-linux-amd64 tunnel --url http://localhost:8000
   ```
3. Copia el link que te devolverá terminando en `.trycloudflare.com`. *(Ejem: `https://tu-enlace.trycloudflare.com`)*.

### Paso 2: Configurar Capacitor 
Como Cloudflare genera un enlace gratuito nuevo cada vez que reinicias la terminal, debes actualizar tu proyecto Capacitor para que Android sepa apuntar a él hoy.
1. Abre el archivo `android_export/capacitor.config.json`.
2. Ubica la propiedad `server.url` y coloca tu **NUEVA** URL de cloudflare.
3. Lo mismo para el archivo opcional de recarga `android_export/www/index.html` (Cambia la URL en la respectiva etiqueta `<meta refresh>`).

### Paso 3: Sincronizar el Código
En la terminal ubícate dentro del exportador y sincroniza a Android:
```bash
cd android_export
npx cap sync android
```

### Paso 4: Compilar en Android Studio
Si ya tienes Android Studio instalado para exportarlo gráficamente:
1. Siempre dentro del directorio `android_export/`, ejecuta:
   ```bash
   npx cap open android
   ```
   *(Esto abrirá el IDE de Android Studio).*
2. Deja que Gradle cargue la barrita inferior completando su sincronización inicial (suele tardar un minuto).
3. En el panel superior ve a **Build** > **Build Bundle / APK(s)** > **Build APK(s)**.
4. Android Studio compilará la aplicación y en la esquina inferior derecha te saldrá un aviso de "Build Successful" con un botón de **Locate** (Ubicar).
5. Haz clic, allí estará tu archivo `app-debug.apk` listo para pasar por cable a tu teléfono e instalar. 🚀

> **Importante:** Tu celular requerirá obligatoriamente internet para operar el programa, y tu computadora host debe mantener el servidor de Flask (`app.py`) y el túnel (`cloudflared`) corriendo al mismo momento. Si apagas tu PC, la aplicación del celular dejará de cargar.
