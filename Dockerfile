# Dockerfile para Hugging Face Spaces
FROM python:3.11-slim

# Evitar que Python genere archivos .pyc
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema para psycopg2
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar y e instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto de la aplicación
COPY . .

# Asegurar permisos para la carpeta de imágenes
RUN mkdir -p static/uploads && chmod -R 777 static/uploads

# Exponer el puerto que Hugging Face espera (7860 por defecto)
ENV PORT=7860
EXPOSE 7860

# Comando para iniciar la aplicación con Gunicorn
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:7860", "--timeout", "120"]
