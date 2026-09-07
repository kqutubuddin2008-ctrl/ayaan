import pytest
from app import create_app
from app.extensions import db
class TestConfig:
 TESTING=True; SECRET_KEY='test-secret-key-which-is-long-enough'; SQLALCHEMY_DATABASE_URI='sqlite://'; SQLALCHEMY_TRACK_MODIFICATIONS=False; WTF_CSRF_ENABLED=False; RATELIMIT_ENABLED=False; RECOGNITION_DISTANCE_THRESHOLD=.42; LIVENESS_MIN_MOVEMENT=8; LOW_ATTENDANCE_THRESHOLD=75; SESSION_TIMEOUT_MINUTES=45; MAX_CONTENT_LENGTH=5242880
@pytest.fixture
def app():
 app=create_app(TestConfig)
 with app.app_context(): db.create_all(); yield app; db.drop_all()
@pytest.fixture
def client(app): return app.test_client()
