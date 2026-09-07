from datetime import datetime
from flask_login import UserMixin
from werkzeug.security import check_password_hash, generate_password_hash
from app.extensions import db

class TimestampMixin:
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class Department(TimestampMixin, db.Model):
    __tablename__ = 'departments'
    id = db.Column(db.Integer, primary_key=True); name = db.Column(db.String(100), unique=True, nullable=False); code = db.Column(db.String(20), unique=True, nullable=False)

class Course(TimestampMixin, db.Model):
    __tablename__ = 'courses'
    id = db.Column(db.Integer, primary_key=True); name = db.Column(db.String(120), nullable=False); code = db.Column(db.String(20), unique=True, nullable=False); department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False, index=True)
    department = db.relationship('Department')

class Subject(TimestampMixin, db.Model):
    __tablename__ = 'subjects'
    id = db.Column(db.Integer, primary_key=True); code = db.Column(db.String(30), unique=True, nullable=False); name = db.Column(db.String(120), nullable=False); course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False, index=True); semester = db.Column(db.Integer, nullable=False, index=True)
    course = db.relationship('Course')

class User(TimestampMixin, UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True); email = db.Column(db.String(255), unique=True, nullable=False, index=True); full_name = db.Column(db.String(150), nullable=False); password_hash = db.Column(db.String(255), nullable=False); role = db.Column(db.String(20), nullable=False, default='STUDENT', index=True)
    is_active_account = db.Column(db.Boolean, default=True, nullable=False); failed_login_count = db.Column(db.Integer, default=0, nullable=False); locked_until = db.Column(db.DateTime); student = db.relationship('Student', back_populates='user', uselist=False)
    @property
    def is_active(self): return self.is_active_account
    def set_password(self, password): self.password_hash = generate_password_hash(password)
    def check_password(self, password): return check_password_hash(self.password_hash, password)

class Student(TimestampMixin, db.Model):
    __tablename__ = 'students'
    id = db.Column(db.Integer, primary_key=True); student_id = db.Column(db.String(40), unique=True, nullable=False, index=True); full_name = db.Column(db.String(150), nullable=False); email = db.Column(db.String(255), unique=True, nullable=False); phone = db.Column(db.String(30)); date_of_birth = db.Column(db.Date); gender = db.Column(db.String(20)); department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False, index=True); course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False); year = db.Column(db.Integer, nullable=False); semester = db.Column(db.Integer, nullable=False, index=True); section = db.Column(db.String(10), nullable=False); roll_number = db.Column(db.String(30), nullable=False); admission_number = db.Column(db.String(50), unique=True); profile_photo_path = db.Column(db.String(255)); is_active = db.Column(db.Boolean, default=True, nullable=False, index=True); user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True)
    __table_args__ = (db.UniqueConstraint('course_id','semester','section','roll_number', name='uq_student_roll_scope'),)
    department = db.relationship('Department'); course = db.relationship('Course'); user = db.relationship('User', back_populates='student')

class FaceEmbedding(TimestampMixin, db.Model):
    __tablename__ = 'face_embeddings'
    id = db.Column(db.Integer, primary_key=True); student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False, unique=True, index=True); encrypted_embedding = db.Column(db.LargeBinary, nullable=False); algorithm = db.Column(db.String(80), nullable=False); quality_score = db.Column(db.Float, nullable=False); enrolled_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False); revoked_at = db.Column(db.DateTime)
    student = db.relationship('Student')

class AttendanceSession(TimestampMixin, db.Model):
    __tablename__ = 'attendance_sessions'
    id = db.Column(db.Integer, primary_key=True); session_code = db.Column(db.String(36), unique=True, nullable=False, index=True); subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'), nullable=False, index=True); department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False); course_id = db.Column(db.Integer, db.ForeignKey('courses.id'), nullable=False); year = db.Column(db.Integer, nullable=False); semester = db.Column(db.Integer, nullable=False, index=True); section = db.Column(db.String(10), nullable=False); starts_at = db.Column(db.DateTime, nullable=False, index=True); ends_at = db.Column(db.DateTime, nullable=False); status = db.Column(db.String(20), default='OPEN', nullable=False, index=True); created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    subject = db.relationship('Subject'); created_by = db.relationship('User')

class Attendance(TimestampMixin, db.Model):
    __tablename__ = 'attendance'
    id = db.Column(db.Integer, primary_key=True); student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False, index=True); session_id = db.Column(db.Integer, db.ForeignKey('attendance_sessions.id'), nullable=False, index=True); status = db.Column(db.String(25), nullable=False); marked_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True); recognition_state = db.Column(db.String(20)); liveness_state = db.Column(db.String(20)); modified_by_id = db.Column(db.Integer, db.ForeignKey('users.id')); modification_reason = db.Column(db.String(500))
    __table_args__ = (db.UniqueConstraint('student_id','session_id', name='uq_attendance_student_session'),)
    student = db.relationship('Student'); session = db.relationship('AttendanceSession'); modified_by = db.relationship('User')

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    id = db.Column(db.Integer, primary_key=True); user_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True); action = db.Column(db.String(80), nullable=False, index=True); entity = db.Column(db.String(80)); entity_id = db.Column(db.String(80)); description = db.Column(db.String(1000)); ip_address = db.Column(db.String(64)); user_agent = db.Column(db.String(300)); created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)

class SuspiciousEvent(db.Model):
    __tablename__ = 'suspicious_events'
    id = db.Column(db.Integer, primary_key=True); session_id = db.Column(db.Integer, db.ForeignKey('attendance_sessions.id'), index=True); user_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True); event_type = db.Column(db.String(80), nullable=False); severity = db.Column(db.String(12), nullable=False); description = db.Column(db.String(1000), nullable=False); created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True); resolved_at = db.Column(db.DateTime)
