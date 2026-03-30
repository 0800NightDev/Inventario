import os
import sys
from app import app, db, User, Inventory, Transaction

def migrate():
    # Obtener la URL de Supabase de los argumentos o variable de entorno
    if len(sys.argv) < 2:
        print("Error: Debes proporcionar la URL de conexión de Supabase.")
        print("Uso: python migrate_to_supabase.py 'postgresql://usuario:password@host:port/db'")
        return

    supabase_url = sys.argv[1]

    # 1. Leer datos de SQLite local
    print("--- PASO 1: Leyendo datos de SQLite local ---")
    # Asegurarnos de usar SQLite para leer
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.getcwd(), 'inventario.db')}"
    
    with app.app_context():
        users = User.query.all()
        inventories = Inventory.query.all()
        transactions = Transaction.query.all()
        print(f"Datos extraídos: {len(users)} usuarios, {len(inventories)} productos, {len(transactions)} movimientos.")

    # 2. Cambiar configuración a Postgres para escribir
    print("\n--- PASO 2: Conectando a Supabase ---")
    app.config['SQLALCHEMY_DATABASE_URI'] = supabase_url
    
    with app.app_context():
        # Crear tablas si no existen
        db.create_all()
        print("Tablas verificadas/creadas en Supabase.")

        # Migrar Usuarios
        print("Migrando usuarios...")
        for u in users:
            new_u = User(
                id=u.id, username=u.username, password_hash=u.password_hash,
                role=u.role, status=u.status, whatsapp_number=u.whatsapp_number,
                foto_carnet=u.foto_carnet
            )
            db.session.merge(new_u)
        
        # Migrar Inventario
        print("Migrando inventario...")
        for i in inventories:
            new_i = Inventory(
                id=i.id, tamano_placa=i.tamano_placa, formato=i.formato,
                fecha_vencimiento=i.fecha_vencimiento, cantidad_cajas=i.cantidad_cajas
            )
            db.session.merge(new_i)

        # Migrar Transacciones
        print("Migrando transacciones...")
        for t in transactions:
            new_t = Transaction(
                id=t.id, tipo=t.tipo, user_id=t.user_id, admin_id=t.admin_id,
                tamano_placa=t.tamano_placa, formato=t.formato,
                fecha_vencimiento=t.fecha_vencimiento, cantidad_cajas=t.cantidad_cajas,
                fecha=t.fecha, imagen_path=t.imagen_path, estado=t.estado
            )
            db.session.merge(new_t)
            
        try:
            db.session.commit()
            print("\n¡MIGRACIÓN EXITOSA!")
            print("Todos los datos han sido copiados a Supabase.")
            
            # Ajustar secuencias de IDs para Postgres (importante para que los nuevos registros no fallen)
            print("Ajustando secuencias de IDs...")
            db.session.execute(db.text("SELECT setval('user_id_seq', (SELECT max(id) FROM \"user\"));"))
            db.session.execute(db.text("SELECT setval('inventory_id_seq', (SELECT max(id) FROM inventory));"))
            db.session.execute(db.text("SELECT setval('transaction_id_seq', (SELECT max(id) FROM \"transaction\"));"))
            db.session.commit()
            print("Secuencias actualizadas correctamente.")
            
        except Exception as e:
            db.session.rollback()
            print(f"\nERROR DURANTE LA MIGRACIÓN: {e}")

if __name__ == '__main__':
    migrate()
