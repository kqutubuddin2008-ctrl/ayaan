"""Development-only seed. Set DEMO_ADMIN_PASSWORD explicitly before running."""
import os
from app import create_app
from app.extensions import db
from app.models import Course, Department, Student, Subject, User
app=create_app()
with app.app_context():
 db.create_all()
 if not Department.query.filter_by(code='CSE').first():
  d=Department(name='Computer Science',code='CSE'); db.session.add(d); db.session.flush(); c=Course(name='Bachelor of Computer Applications',code='BCA',department_id=d.id); db.session.add(c); db.session.flush(); db.session.add(Subject(code='BCA601',name='Artificial Intelligence',course_id=c.id,semester=6))
  admin=User(email='admin@example.invalid',full_name='Demo Administrator',role='SUPER_ADMIN'); admin.set_password(os.environ.get('DEMO_ADMIN_PASSWORD','')); db.session.add(admin)
  db.session.add(Student(student_id='DEMO-001',full_name='Demo Student',email='student@example.invalid',department_id=d.id,course_id=c.id,year=3,semester=6,section='A',roll_number='1',admission_number='DEMO-001'))
  db.session.commit(); print('Demo data created. Change the explicitly supplied password before any shared demonstration.')
