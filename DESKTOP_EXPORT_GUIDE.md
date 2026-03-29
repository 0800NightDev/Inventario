# Guía de Ejecución y Exportación a Escritorio 💻

Tu sistema de inventario ha sido empacado como una aplicación de Escritorio Nativa. El componente usa `pywebview` integrando Chromium/WebKit para levantar tu aplicación dentro de una ventana elegante (¡no más pestañas en el navegador perdido!).

También se **ha regenerado exitosamente la base de datos** (`inventario.db`) con usuarios fijos (`admin` / `admin123`,  `trabajador` / `trabajador123`), ~45 transacciones históricas realistas del último mes y saldos funcionales pre-inyectados para que pruebes las gráficas dinámicas y paneles libremente al instante.

## 🐧 Uso en Linux (Ya Preparado)
Acabo de generar un binario unificado para tu máquina local. Dentro de este directorio ahora existe una carpeta llamada `dist/`.
1. Simplemente navega a `dist/` en tu gestor de archivos.
2. Haz doble clic en el archivo llamado `Inventario` (o ejecuta `./dist/Inventario` en tu terminal).
   *Esto lanzará instantáneamente tu interfaz administrativa sin depender de consolas o navegadores.*

## 🪟 Despliegue en Windows (.exe)
Puesto que estamos alojados en un entorno de Linux, no es posible generar el archivo `.exe` mágicamente desde aquí (ya que sus bibliotecas internas son diferentes). Pero dejarlo hecho en Windows es extremadamente simple:

1. Levanta este código fuente en tu máquina **Windows**.
2. Corre en la CMD el instalador de dependencias:
   ```cmd
   pip install -r requirements.txt
   ```
3. Ejecuta el empaquetador mágico exactamente con la siguiente instrucción:
   ```cmd
   pyinstaller --name "Inventario" --onefile --windowed --add-data "templates;templates" --add-data "static;static" desktop_app.py
   ```
   *(Nota cómo en Windows se separan las rutas de los data anexos con `;` en lugar de `:` como en Linux).*

4. ¡Listo! Abre la carpeta `dist/`, ahí tendrás tu programa brillante `Inventario.exe` empacado como una sola aplicación funcional lista para producción.
