from datetime import datetime, timedelta
from io import BytesIO
import json
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import numpy as np
import pandas as pd
from flask import Blueprint, jsonify, request, send_file, current_app
from flask_login import current_user, login_user, logout_user, login_required
from sqlalchemy import func
from app.ai.face_recognition_service import FaceRecognitionService
from app.ai.liveness_service import LivenessService
from app.extensions import db, limiter
from app.models import Attendance, AttendanceSession, Course, Department, FaceEmbedding, Student, Subject, SuspiciousEvent, User
from app.services.attendance_service import flag_event, mark_attendance, percentage
from app.services.audit_service import audit
from app.utils.security import encrypt_biometric, role_required
api = Blueprint('api', __name__, url_prefix='/api')
def ok(data=None, message='OK', status=200): return jsonify(success=True, message=message, data=data or {}), status
def fail(message, status=400): return jsonify(success=False, message=message, data={}), status
def student_data(s): return {'id':s.id,'student_id':s.student_id,'full_name':s.full_name,'email':s.email,'department':s.department.name,'course':s.course.name,'year':s.year,'semester':s.semester,'section':s.section,'roll_number':s.roll_number,'is_active':s.is_active}

@api.post('/auth/login')
@limiter.limit('5 per minute')
def login():
    data=request.get_json(silent=True) or {}; email=data.get('email','').strip().lower(); user=User.query.filter_by(email=email).first()
    if not user or not user.check_password(data.get('password','')):
        if user:
            user.failed_login_count += 1
            if user.failed_login_count >= current_app.config['MAX_LOGIN_ATTEMPTS']:
                user.locked_until = datetime.utcnow() + timedelta(minutes=current_app.config['LOCKOUT_MINUTES'])
                user.failed_login_count = 0
        audit('LOGIN_FAILED','User',user.id if user else None,'Invalid credentials'); db.session.commit(); return fail('Invalid credentials',401)
    if user.locked_until and user.locked_until > datetime.utcnow(): return fail('Account is temporarily locked',423)
    user.failed_login_count=0; login_user(user); audit('LOGIN','User',user.id,'User signed in'); db.session.commit(); return ok({'user':{'id':user.id,'name':user.full_name,'role':user.role}},'Signed in')
@api.post('/auth/logout')
@login_required
def logout(): audit('LOGOUT','User',current_user.id,'User signed out'); db.session.commit(); logout_user(); return ok(message='Signed out')
@api.get('/students')
@role_required('SUPER_ADMIN','FACULTY')
def students():
    q=Student.query.join(Department).join(Course); term=request.args.get('q','').strip();
    if term: q=q.filter(db.or_(Student.full_name.ilike(f'%{term}%'),Student.student_id.ilike(f'%{term}%')))
    if request.args.get('department_id'): q=q.filter(Student.department_id==request.args['department_id'])
    if request.args.get('semester'): q=q.filter(Student.semester==request.args['semester'])
    page=max(1,request.args.get('page',1,type=int)); rows=q.order_by(Student.full_name).paginate(page=page,per_page=min(request.args.get('per_page',20,type=int),100),error_out=False)
    return ok({'items':[student_data(s) for s in rows.items],'page':page,'pages':rows.pages,'total':rows.total})
@api.post('/students')
@role_required('SUPER_ADMIN')
def create_student():
    d=request.get_json(silent=True) or {}; required=['student_id','full_name','email','department_id','course_id','year','semester','section','roll_number']
    if missing := [x for x in required if not str(d.get(x,'')).strip()]: return fail(f'Missing required field: {missing[0]}',422)
    try:
        s=Student(**{k:d.get(k) for k in required},admission_number=d.get('admission_number'),phone=d.get('phone'),gender=d.get('gender')); db.session.add(s); db.session.commit()
    except Exception: db.session.rollback(); return fail('Student ID, email, admission number, or class roll number already exists',409)
    audit('STUDENT_CREATED','Student',s.id,'Student record created'); db.session.commit(); return ok(student_data(s),'Student created',201)
@api.patch('/students/<int:id>')
@role_required('SUPER_ADMIN')
def update_student(id):
    s=Student.query.get_or_404(id); d=request.get_json(silent=True) or {}
    for field in ['full_name','phone','gender','section','semester','year','is_active']:
        if field in d: setattr(s,field,d[field])
    audit('STUDENT_UPDATED','Student',s.id,'Student record updated'); db.session.commit(); return ok(student_data(s),'Student updated')
@api.delete('/students/<int:id>')
@role_required('SUPER_ADMIN')
def deactivate_student(id):
    s=Student.query.get_or_404(id); s.is_active=False; audit('STUDENT_DEACTIVATED','Student',s.id,'Historical attendance retained'); db.session.commit(); return ok(message='Student deactivated')
@api.post('/face/enroll')
@role_required('SUPER_ADMIN')
def enroll():
    student_id=request.form.get('student_id',type=int); image=request.files.get('image')
    if not student_id or not image or image.mimetype not in {'image/jpeg','image/png'}: return fail('Submit a student ID and JPEG or PNG image',422)
    student=Student.query.get_or_404(student_id); result=FaceRecognitionService().analyze(image.read())
    if result.embedding is None: return fail(result.message,422)
    existing=FaceEmbedding.query.filter_by(student_id=student.id).first()
    if existing: db.session.delete(existing)
    db.session.add(FaceEmbedding(student_id=student.id,encrypted_embedding=encrypt_biometric(result.embedding.astype(np.float32).tobytes()),algorithm='OpenCV-DCT-256-v1',quality_score=result.quality,enrolled_by_id=current_user.id)); audit('FACE_ENROLLED','Student',student.id,'Embedding encrypted; raw image not retained'); db.session.commit(); return ok({'quality_score':round(result.quality,1)},'Face enrollment complete')
@api.post('/attendance/start-session')
@role_required('SUPER_ADMIN','FACULTY')
def start_session():
    d=request.get_json(silent=True) or {}; required=['subject_id','department_id','course_id','year','semester','section']
    if any(x not in d for x in required): return fail('Missing session scope fields',422)
    try: starts=datetime.fromisoformat(d.get('starts_at',datetime.utcnow().isoformat())); duration=int(d.get('duration_minutes',current_app.config['SESSION_TIMEOUT_MINUTES']))
    except (ValueError,TypeError): return fail('Invalid start time or duration',422)
    import uuid
    session=AttendanceSession(session_code=str(uuid.uuid4()),starts_at=starts,ends_at=starts+timedelta(minutes=duration),created_by_id=current_user.id,**{x:d[x] for x in required}); db.session.add(session); audit('SESSION_STARTED','AttendanceSession',None,'Attendance session created'); db.session.commit(); return ok({'id':session.id,'session_code':session.session_code,'ends_at':session.ends_at.isoformat()},'Session started',201)
@api.post('/attendance/recognize')
@role_required('SUPER_ADMIN','FACULTY')
def recognize():
    session=AttendanceSession.query.get_or_404(request.form.get('session_id',type=int)); image=request.files.get('image')
    if not image or image.mimetype not in {'image/jpeg','image/png'}: return fail('A JPEG or PNG camera frame is required',422)
    vision=FaceRecognitionService().recognize(image.read()); centers=json.loads(request.form.get('movement_centers','[]')); live=LivenessService().verify(*(centers[:2] if len(centers)>=2 else [None,None]))
    if vision.state!='RECOGNIZED' or live.state!='LIVE':
        if vision.state=='UNKNOWN' or live.state=='SPOOF_SUSPECTED': flag_event(session.id,'RECOGNITION_OR_LIVENESS_FAILURE','Flagged for review; no attendance was marked', 'MEDIUM',current_user.id)
        return ok({'recognition_state':vision.state,'liveness_state':live.state,'message':vision.message},'Attendance not marked')
    try: record=mark_attendance(Student.query.get(vision.student_id),session,vision.state,live.state)
    except ValueError as e: return fail(str(e),409)
    audit('ATTENDANCE_MARKED','Attendance',record.id,'Live recognized attendance recorded'); db.session.commit(); return ok({'student':student_data(record.student),'status':record.status,'marked_at':record.marked_at.isoformat()},'Attendance marked successfully')
@api.get('/attendance')
@role_required('SUPER_ADMIN','FACULTY')
def attendance():
    rows=Attendance.query.join(Student).join(AttendanceSession).order_by(Attendance.marked_at.desc()).limit(200).all(); return ok({'items':[{'id':a.id,'student':a.student.full_name,'student_id':a.student.student_id,'status':a.status,'time':a.marked_at.isoformat(),'session_code':a.session.session_code} for a in rows]})
@api.get('/analytics/overview')
@login_required
def analytics():
    if current_user.role=='STUDENT': return ok({'attendance':percentage(current_user.student.id,threshold=current_app.config['LOW_ATTENDANCE_THRESHOLD'])})
    today=datetime.utcnow().date(); total=Student.query.count(); active=Student.query.filter_by(is_active=True).count(); records=Attendance.query.filter(func.date(Attendance.marked_at)==today).all(); return ok({'total_students':total,'active_students':active,'today_present':sum(a.status in {'PRESENT','LATE'} for a in records),'today_absent':0,'late_students':sum(a.status=='LATE' for a in records),'average_attendance':round(sum(percentage(s.id)['percentage'] for s in Student.query.filter_by(is_active=True))/active,2) if active else 0})
@api.get('/reports/student/<int:id>')
@login_required
def student_report(id):
    if current_user.role=='STUDENT' and current_user.student.id != id: return fail('You may only view your own report',403)
    s=Student.query.get_or_404(id); return ok({'student':student_data(s),'attendance':percentage(s.id,threshold=current_app.config['LOW_ATTENDANCE_THRESHOLD'])})
def report_rows():
    rows=Attendance.query.join(Student).join(AttendanceSession).all()
    return [{'Student ID':a.student.student_id,'Name':a.student.full_name,'Status':a.status,'Time':a.marked_at.isoformat(),'Session':a.session.session_code} for a in rows]
@api.get('/reports/attendance.csv')
@role_required('SUPER_ADMIN','FACULTY')
def export_csv():
    data=report_rows(); audit('REPORT_GENERATED','Attendance',None,'CSV attendance report'); db.session.commit(); return send_file(BytesIO(pd.DataFrame(data).to_csv(index=False).encode()),mimetype='text/csv',as_attachment=True,download_name='attendance.csv')
@api.get('/reports/attendance.xlsx')
@role_required('SUPER_ADMIN','FACULTY')
def export_xlsx():
    stream=BytesIO(); pd.DataFrame(report_rows()).to_excel(stream,index=False); stream.seek(0); audit('REPORT_GENERATED','Attendance',None,'Excel attendance report'); db.session.commit(); return send_file(stream,mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',as_attachment=True,download_name='attendance.xlsx')
@api.get('/reports/attendance.pdf')
@role_required('SUPER_ADMIN','FACULTY')
def export_pdf():
    stream=BytesIO(); pdf=canvas.Canvas(stream,pagesize=letter); pdf.setTitle('Attendance report'); y=750; pdf.drawString(48,y,'Campus Presence — Attendance report'); y-=28
    for row in report_rows():
        pdf.drawString(48,y,f"{row['Student ID']} | {row['Name'][:28]} | {row['Status']} | {row['Time'][:19]}"); y-=16
        if y<48: pdf.showPage(); y=750
    pdf.save(); stream.seek(0); audit('REPORT_GENERATED','Attendance',None,'PDF attendance report'); db.session.commit(); return send_file(stream,mimetype='application/pdf',as_attachment=True,download_name='attendance.pdf')
