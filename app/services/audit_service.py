from flask import request
from flask_login import current_user
from app.extensions import db
from app.models import AuditLog

def audit(action, entity=None, entity_id=None, description=''):
    """Append an audit record without storing passwords or biometric payloads."""
    record = AuditLog(user_id=current_user.id if current_user.is_authenticated else None, action=action, entity=entity, entity_id=str(entity_id) if entity_id else None, description=description, ip_address=request.remote_addr, user_agent=request.user_agent.string[:300])
    db.session.add(record)
