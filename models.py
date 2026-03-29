from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
import datetime

db = SQLAlchemy()

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False) # 'trabajador', 'administrador', 'superusuario'
    status = db.Column(db.String(20), default='pendiente') # 'pendiente', 'activo'
    whatsapp_number = db.Column(db.String(30), nullable=True) # Ejem: '+1234567890', 'inactivo'
    foto_carnet = db.Column(db.String(255), nullable=True)

class Inventory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tamano_placa = db.Column(db.String(50), nullable=False)
    formato = db.Column(db.String(20), nullable=False) # 'DI-HL' o 'HR-U'
    cantidad_cajas = db.Column(db.Integer, default=0)

    @property
    def bultos(self):
        return self.cantidad_cajas // 5
    
    @property
    def cajas_sueltas(self):
        return self.cantidad_cajas % 5

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tipo = db.Column(db.String(20), nullable=False) # 'ingreso' o 'egreso'
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    admin_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True) # Admin que verificó la transacción
    
    user = db.relationship('User', foreign_keys=[user_id], backref=db.backref('transactions_created', lazy=True))
    admin = db.relationship('User', foreign_keys=[admin_id])
    
    tamano_placa = db.Column(db.String(50), nullable=False)
    formato = db.Column(db.String(20), nullable=False)
    cantidad_cajas = db.Column(db.Integer, nullable=False)
    
    fecha = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    imagen_path = db.Column(db.String(255), nullable=True)
    estado = db.Column(db.String(20), default='pendiente') # 'pendiente', 'aprobada', 'rechazada'
