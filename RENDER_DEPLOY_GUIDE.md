# Guía Rápida de Despliegue en Render.com

Esta guía te ayudará a poner el **Sistema de Inventario** en línea usando [Render.com](https://render.com/), con una base de datos segura y de forma automática. Todo está pre-configurado para ti.

## Paso 1: Sube tus cambios a GitHub (o GitLab)
1. Abre tu terminal o línea de comandos.
2. Añade los nuevos archivos generados y haz commit:
   ```bash
   git add .
   git commit -m "Optimización para despliegue en Render con PostgreSQL"
   git push origin main
   ```

## Paso 2: Conecta Render y Despliega
1. Inicia sesión o regístrate en [Render.com](https://dashboard.render.com).
2. Haz clic en el botón de **"New +"** en la esquina superior derecha y selecciona **"Blueprint"**.
3. Conecta tu cuenta de GitHub/GitLab si no lo has hecho.
4. Busca y selecciona el repositorio de tu proyecto.
5. Selecciona la rama (ej. `main`) y dale a **Apply**.

### ¿Qué hace el Blueprint?
Render leerá el archivo `render.yaml` que hemos creado e instantáneamente configurará:
1. Una **Base de Datos PostgreSQL** (`inventario-db`) para que tus datos de inventario y personal no se pierdan al reiniciarse la app. **Nota: La base de datos es gratis por 90 días en la capa Free.**
2. El **Servicio Web** (`inventario-web`) ejecutando la aplicación protegida en Internet que se conectará automáticamente a la base de datos de manera segura y sin requerir tu intervención.

## Paso 3: Disfruta y Comparte
Una vez que en el panel (Dashboard) de Render, el progreso muestre "Live" y esté verde, haz clic en el enlace URL público que Render te proveerá (ej. `https://inventario-web-xxxx.onrender.com`).

Ya puedes entrar y usar la aplicación con las credenciales por defecto (`admin` / `admin123`).

---

**⚠️ AVISO DEL TIER GRATUITO DE RENDER:**  
Con el plan gratuito de Web Service de Render, el "disco duro" virtual de la máquina no es persistente. Esto significa que **las imágenes y fotos** subidas de carnet o de los comprobantes de lotes **se borrarán** si dejas de usar la aplicación por varios minutos (cuando se auto-suspende) o la vuelves a desplegar. Sin embargo, tu **información, inventario, stock y usuarios** estarán blindados y a salvo gracias a PostgreSQL.
