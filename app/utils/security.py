import base64
from functools import wraps
from cryptography.fernet import Fernet
from flask import current_app, jsonify
from flask_login import current_user

def role_required(*roles):
    def decorator(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            if not current_user.is_authenticated:
                return jsonify(success=False, message='Authentication required', data={}), 401
            if current_user.role not in roles:
                return jsonify(success=False, message='You do not have permission for this action', data={}), 403
            return view(*args, **kwargs)
        return wrapped
    return decorator

def _fernet():
    configured = current_app.config.get('BIOMETRIC_ENCRYPTION_KEY')
    if configured:
        return Fernet(configured.encode())
    # Derive a development key from SECRET_KEY; production must set a separately rotated key.
    key = base64.urlsafe_b64encode(current_app.config['SECRET_KEY'].encode().ljust(32, b'0')[:32])
    return Fernet(key)

def encrypt_biometric(payload: bytes) -> bytes: return _fernet().encrypt(payload)
def decrypt_biometric(payload: bytes) -> bytes: return _fernet().decrypt(payload)
