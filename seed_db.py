import os
import datetime
import random
from app import app, db
from models import User, Inventory, Transaction
from werkzeug.security import generate_password_hash

def poblar_base_datos():
    with app.app_context():
        print("Eliminando base de datos antigua si existe...")
        db.drop_all()
        db.create_all()
        
        print("Creando Usuarios Base Obligatorios...")
        su = User(username='admin', password_hash=generate_password_hash('admin123', method='pbkdf2:sha256:600000'), role='superusuario', status='activo', whatsapp_number='+1234567890')
        trab = User(username='trabajador', password_hash=generate_password_hash('trabajador123', method='pbkdf2:sha256:600000'), role='trabajador', status='activo', whatsapp_number='+1112223334')
        adm = User(username='administrador', password_hash=generate_password_hash('admin123', method='pbkdf2:sha256:600000'), role='administrador', status='activo', whatsapp_number='+5556667778')
        db.session.add_all([su, trab, adm])
        db.session.commit()
        
        print("Configurando Inventario Base Estable...")
        tamanos = ['14x14', '14x17', '10x14 (26x36)', '10x12']
        formatos = ['DI-HL', 'HR-U']
        
        for t in tamanos:
            for f in formatos:
                # Stock aleatorio de entre 10 a 50 cajas (2 a 10 bultos) iniciales
                cant = random.randint(10, 50)
                inv = Inventory(tamano_placa=t, formato=f, cantidad_cajas=cant)
                db.session.add(inv)
                
        db.session.commit()
        
        print("Generando Historial Transaccional (Mes y Semanas recientes)...")
        hoy = datetime.datetime.utcnow()
        auth_users = [su.id, adm.id]
        
        for _ in range(45):
            fecha_pasada = hoy - datetime.timedelta(days=random.randint(1, 30), hours=random.randint(0, 23), minutes=random.randint(0, 59))
            tipo = random.choices(['ingreso', 'egreso'], weights=[0.6, 0.4])[0]
            tam = random.choice(tamanos)
            form = random.choice(formatos)
            cantidad = random.randint(3, 20)
            
            tx = Transaction(
                fecha=fecha_pasada,
                tipo=tipo,
                user_id=trab.id,
                admin_id=random.choice(auth_users),
                tamano_placa=tam,
                formato=form,
                cantidad_cajas=cantidad,
                estado='aprobada',
                imagen_path=None
            )
            db.session.add(tx)
            
        # Generar algunos Pedidos a Entregar (para trabajador)
        for _ in range(3):
            tam = random.choice(tamanos)
            form = random.choice(formatos)
            cantidad = random.randint(1, 4)
            fecha_reciente = hoy - datetime.timedelta(hours=random.randint(1, 10))
            tx_orden = Transaction(
                fecha=fecha_reciente,
                tipo='egreso',
                user_id=trab.id,
                admin_id=random.choice(auth_users),
                tamano_placa=tam,
                formato=form,
                cantidad_cajas=cantidad,
                estado='asignado',
                imagen_path=None
            )
            db.session.add(tx_orden)
            
        db.session.commit()
        
        print("¡Base de Datos de Producción (inventario.db) ha sido sembrada con éxito!")

if __name__ == '__main__':
    poblar_base_datos()
