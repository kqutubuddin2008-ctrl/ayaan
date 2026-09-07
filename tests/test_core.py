from datetime import datetime, timedelta
from app.extensions import db
from app.models import AttendanceSession, Course, Department, Student, Subject, User

def seed(app):
 with app.app_context():
  d=Department(name='Computing',code='CMP'); db.session.add(d); db.session.flush(); c=Course(name='BCA',code='BCA',department_id=d.id); db.session.add(c); db.session.flush(); sub=Subject(code='AI1',name='AI',course_id=c.id,semester=6); u=User(email='admin@test.local',full_name='Admin',role='SUPER_ADMIN');u.set_password('correct-password');s=Student(student_id='S1',full_name='Student',email='s@test.local',department_id=d.id,course_id=c.id,year=3,semester=6,section='A',roll_number='1');db.session.add_all([sub,u,s]);db.session.commit(); return d,c,sub,s
def login(client): return client.post('/api/auth/login',json={'email':'admin@test.local','password':'correct-password'})
def test_login_and_student_lifecycle(app,client):
 d,c,sub,s=seed(app); assert login(client).status_code==200
 response=client.get('/api/students'); assert response.status_code==200 and response.json['data']['total']==1
 assert client.delete(f'/api/students/{s.id}').status_code==200
 assert client.post('/api/auth/logout').status_code==200
 assert client.get('/api/students').status_code==401
def test_duplicate_student_returns_conflict(app,client):
 d,c,sub,s=seed(app); login(client)
 r=client.post('/api/students',json={'student_id':'S1','full_name':'Other','email':'x@test.local','department_id':d.id,'course_id':c.id,'year':3,'semester':6,'section':'A','roll_number':'2'}); assert r.status_code==409
def test_session_creation_role_protected(app,client):
 d,c,sub,s=seed(app); login(client)
 r=client.post('/api/attendance/start-session',json={'subject_id':sub.id,'department_id':d.id,'course_id':c.id,'year':3,'semester':6,'section':'A','duration_minutes':20}); assert r.status_code==201 and r.json['data']['session_code']
