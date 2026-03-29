# 🖥️ Guía de Compatibilidad y Exportación a Windows

Para usar tu sistema de inventario en tu otra PC con Windows, primero debemos respaldar tu código actual en **GitHub** desde tu máquina Linux, y luego descargar y configurar el entorno en **Windows**.

---

## 🚀 PASO 1: Subir el Proyecto a GitHub (Desde Linux)

He creado automáticamente un archivo `.gitignore` en tu proyecto para evitar que subas la base de datos (`instance/`), la carpeta del entorno virtual (`venv/`) y otros archivos pesados de compilación (`build/`, `dist/`). Esto mantendrá tu repositorio limpio.

1. Ve a [GitHub](https://github.com/) e inicia sesión (o crea una cuenta).
2. Crea un **Nuevo Repositorio** (New Repository), nómbralo (por ejemplo, `Inventario-Radiografia`) y déjalo **público o privado** según prefieras. **NO** marques la opción de inicializar con un "README".
3. Abre una terminal en tu proyecto (`/home/night/Documentos/Proyecto_Inventario/`) y ejecuta estos comandos:

```bash
# Inicializa git si no lo has hecho aún
git init

# Agrega todos los archivos válidos al seguimiento (respetando el .gitignore)
git add .

# Crea el primer "guardado" o commit
git commit -m "Primera versión estable del sistema de inventario"

# Cambia la rama a main
git branch -M main

# Conecta tu carpeta local con GitHub (🔴 CAMBIA LA URL por la tuya)
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git

# Sube el código a GitHub
git push -u origin main
```

> **NOTA SOBRE LA BASE DE DATOS**: El archivo `.gitignore` ignora la carpeta `instance/` donde está tu base de datos SQLite con los datos y contraseñas. Esto es por seguridad. Para tener tus datos en la otra PC, puedes enviarte la carpeta `instance/` completa a ti mismo (vía Google Drive, un pendrive, Telegram, etc.) y pegarla dentro de la carpeta del proyecto en Windows.

---

## 🪟 PASO 2: Descargar y Preparar en Windows

Ve a tu PC con Windows y sigue estos pasos:

### 1. Requisitos Previos:
- Descarga e instala **Python** (desde [python.org/downloads](https://www.python.org/downloads/)). 
  > **🚨 MUY IMPORTANTE:** Al lanzar el instalador en Windows, asegúrate de marcar la casilla **"Add Python to PATH"** en la primera pantalla antes de darle a instalar.
- Descarga e instala **Git for Windows** (desde [git-scm.com/download/win](https://git-scm.com/download/win)).

### 2. Clonar el Repositorio:
- Abre la terminal (Símbolo de sistema o PowerShell) o la terminal de VS Code.
- Ve a la carpeta donde quieras guardar el proyecto, por ejemplo en Documentos:
  ```cmd
  cd Documentos
  ```
- Descarga tu código y entra en él:
  ```cmd
  git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
  cd TU_REPOSITORIO
  ```
  *(Reemplaza la URL por la tuya)*

### 3. Crear el Entorno e Instalar Dependencias:
- Estando en la carpeta del proyecto en Windows, ejecuta:
  ```cmd
  python -m venv venv
  venv\Scripts\activate
  pip install -r requirements.txt
  ```

### 4. Restaurar la Base de Datos (Opcional):
- Si quieres tener el mismo inventario y usuarios que en Linux, pega la carpeta `instance` (con el archivo `.sqlite` o `.db` dentro) que copiaste previamente, directamente dentro de la carpeta raíz de tu proyecto en Windows.
- Si no la copias, simplemente la aplicación iniciará en blanco desde cero al momento de sembrar información inicial.

---

## ▶️ PASO 3: Ejecutar la Aplicación en Windows

A partir de ahora, cuando quieras encender el sistema, solo tienes que activar el entorno en Windows (`venv\Scripts\activate`) y tienes dos formas de usarlo:

### Opción A: Modo Navegador Web
Ejecuta tu archivo base:
```cmd
python app.py
```
Y luego abre tu navegador en `http://localhost:5000`

### Opción B: Modo Aplicación de Escritorio
Si quieres que se abra en una ventana independiente (al igual que lo usas en Linux con PyWebView):
```cmd
python desktop_app.py
```

---

## 📦 PASO 4 (Opcional): Generar un ".exe" Autoejecutable en Windows

Si una vez que verifiques que funciona perfectamente, deseas crear un archivo `.exe` para no tener que abrir la consola nunca más:

1. Asegúrate de tener tu entorno activado (`venv\Scripts\activate`).
2. Tienes un archivo `Inventario.spec` en tu repositorio. Puedes probar compilar directamente usando este archivo:
   ```cmd
   pip install pyinstaller
   pyinstaller Inventario.spec
   ```
3. Si el comando anterior compila con éxito, tu archivo `.exe` se encontrará en la nueva carpeta `dist`. Si recibes un error relacionado con rutas de Linux, puedes generar un `.exe` con una nueva configuración nativa en Windows corriendo:
   ```cmd
   pyinstaller -i NONE -F -w -n "Inventario App" --add-data "templates;templates" --add-data "static;static" --hidden-import="flask" --hidden-import="flask_sqlalchemy" --hidden-import="werkzeug" app.py
   ```
