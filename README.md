---
title: Sistema de Inventario
emoji: 📦
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# Sistema de Inventario Radiografía

Este es un sistema de gestión de inventario profesional basado en Flask, optimizado para ejecutarse en Hugging Face Spaces usando Docker.

## Características
- Gestión de stock por tamaño y formato.
- Control de fechas de vencimiento (Lotes).
- Roles de usuario (Superusuario, Administrador, Trabajador).
- Registro de transacciones con fotos opcionales para administradores.
- Exportación de reportes.

## Instalación Local
1. Clonar el repositorio.
2. Crear un entorno virtual: `python -m venv venv`.
3. Instalar dependencias: `pip install -r requirements.txt`.
4. Ejecutar: `python app.py`.

## Despliegue
Este repositorio está configurado para desplegarse automáticamente en Hugging Face Spaces mediante el `Dockerfile` incluido.
