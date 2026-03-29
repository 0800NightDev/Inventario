import os
import threading
import time
import socket
import webview
from app import app, init_db

# Patch para Arch Linux y Wayland: Desactiva compositor CSS y fuerza GDK X11
os.environ['WEBKIT_DISABLE_COMPOSITING_MODE'] = '1'
os.environ['GDK_BACKEND'] = 'x11'

def get_free_port():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('127.0.0.1', 0))
    port = s.getsockname()[1]
    s.close()
    return port

dinamic_port = get_free_port()

def start_flask():
    app.run(host='127.0.0.1', port=dinamic_port, use_reloader=False, debug=False)

if __name__ == '__main__':
    init_db()  # Ensures definitions run if needed
    
    # Arrancamos Flask invisible en segundo plano como daemon
    t = threading.Thread(target=start_flask)
    t.daemon = True
    t.start()
    
    # Pequeño delay para que Flask enlace al puerto dinámico sin error prematuro
    time.sleep(1)
    
    # Lanzamos la Ventana Nativa Pywebview anclada a ese Localhost variante
    webview.create_window(
        title='Sistema de Mando: Inventario Radiología', 
        url=f'http://127.0.0.1:{dinamic_port}', 
        width=1280, 
        height=800, 
        resizable=True
    )
    
    webview.start()
