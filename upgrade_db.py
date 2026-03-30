from app import app, db
from sqlalchemy import text

def upgrade_db():
    with app.app_context():
        try:
            db.session.execute(text('ALTER TABLE user ADD COLUMN status VARCHAR(20) DEFAULT "activo"'))
            db.session.execute(text('ALTER TABLE user ADD COLUMN foto_carnet VARCHAR(255)'))
            db.session.commit()
            print("DB Schema Updated: status & foto_carnet added.")
            
            # Asegurar que el superusuario siempre esté activo
            db.session.execute(text('UPDATE user SET status = "activo"'))
            db.session.commit()
            
            try:
                db.session.execute(text('ALTER TABLE inventory ADD COLUMN fecha_vencimiento VARCHAR(10)'))
                db.session.execute(text('ALTER TABLE "transaction" ADD COLUMN fecha_vencimiento VARCHAR(10)'))
                db.session.commit()
                print("DB Schema Updated: fecha_vencimiento added a Inventory y Transaction.")
            except Exception as e2:
                print("fecha_vencimiento ya existe o hubo un error:", e2)

        except Exception as e:
            print("Schema might be already updated or error occurred:", e)

if __name__ == "__main__":
    upgrade_db()
