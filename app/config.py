"""Central configuration; secrets are supplied through the environment."""
import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'development-only-change-before-deploying')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///smart_attendance.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 5 * 1024 * 1024))
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'false').lower() == 'true'
    PERMANENT_SESSION_LIFETIME = timedelta(hours=8)
    WTF_CSRF_TIME_LIMIT = 3600
    RECOGNITION_DISTANCE_THRESHOLD = float(os.getenv('RECOGNITION_DISTANCE_THRESHOLD', '.42'))
    LIVENESS_MIN_MOVEMENT = float(os.getenv('LIVENESS_MIN_MOVEMENT', '8'))
    LOW_ATTENDANCE_THRESHOLD = float(os.getenv('LOW_ATTENDANCE_THRESHOLD', '75'))
    LATE_THRESHOLD_MINUTES = int(os.getenv('LATE_THRESHOLD_MINUTES', '10'))
    SESSION_TIMEOUT_MINUTES = int(os.getenv('SESSION_TIMEOUT_MINUTES', '45'))
    MAX_LOGIN_ATTEMPTS = int(os.getenv('MAX_LOGIN_ATTEMPTS', '5'))
    LOCKOUT_MINUTES = int(os.getenv('LOCKOUT_MINUTES', '15'))
    RATELIMIT_DEFAULT = '300 per day; 100 per hour'
    RATELIMIT_STORAGE_URI = 'memory://'
