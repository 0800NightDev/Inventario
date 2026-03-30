import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from app import app, db, User, Inventory, Transaction

def migrate():
    if len(sys.argv) < 2:
        print("Error: Debes proporcionar la URL de conexión de Supabase.")
        return

    supabase_url = sys.argv[1]

    print("--- PASO 1: Leyendo datos de SQLite local ---")
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.getcwd(), 'inventario.db')}"
    
    # Listas para guardar los datos puros (diccionarios)
    users_data = []
    inv_data = []
    trx_data = []

    with app.app_context():
        for u in User.query.all():
            users_data.append({
                'id': u.id, 'username': u.username, 'password_hash': u.password_hash,
                'role': u.role, 'status': u.status, 'whatsapp_number': u.whatsapp_number,
                'foto_carnet': u.foto_carnet
            })
            
        for i in Inventory.query.all():
            inv_data.append({
                'id': i.id, 'tamano_placa': i.tamano_placa, 'formato': i.formato,
                'fecha_vencimiento': i.fecha_vencimiento, 'cantidad_cajas': i.cantidad_cajas
            })
            
        for t in Transaction.query.all():
            trx_data.append({
                'id': t.id, 'tipo': t.tipo, 'user_id': t.user_id, 'admin_id': t.admin_id,
                'tamano_placa': t.tamano_placa, 'formato': t.formato,
                'fecha_vencimiento': t.fecha_vencimiento, 'cantidad_cajas': t.cantidad_cajas,
                'fecha': t.fecha, 'imagen_path': t.imagen_path, 'estado': t.estado
            })
            
        print(f"Datos extraídos en memoria: {len(users_data)} usuarios, {len(inv_data)} productos, {len(trx_data)} movimientos.")

    print("\n--- PASO 2: Conectando a Supabase y creando tablas ---")
    # Usamos un motor puro de SQLAlchemy, ignorando Flask-SQLAlchemy para evitar la caché del motor
    pg_engine = create_engine(supabase_url)
    
    try:
        # Crear las tablas directamente en la BD de Postgres usando los metadatos construidos en app.py
        db.metadata.create_all(pg_engine)
        print("Tablas verificadas/creadas en Supabase.")

        print("\n--- PASO 3: Insertando datos en Supabase ---")
        with Session(pg_engine) as pg_session:
            # Insertar usuarios
            for data in users_data:
                pg_session.merge(User(**data))
            
            # Insertar inventario
            for data in inv_data:
                pg_session.merge(Inventory(**data))
                
            # Insertar transacciones
            for data in trx_data:
                pg_session.merge(Transaction(**data))
                
            pg_session.commit()
            print("Datos copiados correctamente a PostgreSQL.")

        print("\n--- PASO 4: Ajustando secuencias de ID ---")
        with pg_engine.connect() as con:
            tables = ['user', 'inventory', 'transaction']
            for table_name in tables:
                try:
                    seq_name = f"{table_name}_id_seq"
                    sql = f"SELECT setval('{seq_name}', (SELECT COALESCE(MAX(id), 1) FROM \"{table_name}\"));"
                    con.execute(text(sql))
                    con.commit()
                    print(f"  Secuencia arreglada para la tabla: {table_name}")
                except Exception as seq_e:
                    print(f"  Advertencia con secuencia {table_name}: {str(seq_e).splitlines()[0]}")
                    
        print("\n¡MIGRACIÓN 100% EXITOSA! Revisa el panel de Supabase (Table Editor).")

    except Exception as e:
        print(f"\nERROR CRÍTICO DURANTE LA MIGRACIÓN: {e}")

if __name__ == '__main__':
    migrate()
