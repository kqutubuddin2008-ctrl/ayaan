from datetime import datetime
from sqlalchemy.exc import IntegrityError
from app.extensions import db
from app.models import Attendance, AttendanceSession, Student, SuspiciousEvent

COUNTED = {'PRESENT', 'LATE', 'MANUALLY_CORRECTED'}
def percentage(student_id, subject_id=None, threshold=75.0):
    query = Attendance.query.join(AttendanceSession).filter(Attendance.student_id == student_id, AttendanceSession.status != 'CANCELLED')
    if subject_id: query = query.filter(AttendanceSession.subject_id == subject_id)
    rows = query.all(); total = len(rows); attended = sum(row.status in COUNTED for row in rows)
    pct = round((attended / total * 100), 2) if total else 0.0
    missed = total - attended
    needed = max(0, int((threshold * total - 100 * attended + (100 - threshold) - 1) // (100 - threshold))) if threshold < 100 else 0
    return {'total_classes': total, 'attended': attended, 'missed': missed, 'percentage': pct, 'low_attendance': bool(total and pct < threshold), 'classes_required_to_reach_threshold': needed}

def mark_attendance(student, session, recognition_state, liveness_state, when=None):
    when = when or datetime.utcnow()
    if session.status != 'OPEN' or not (session.starts_at <= when <= session.ends_at): raise ValueError('Attendance session is not currently open')
    if not student.is_active or (student.department_id, student.course_id, student.year, student.semester, student.section) != (session.department_id, session.course_id, session.year, session.semester, session.section): raise ValueError('Student is not eligible for this session')
    if recognition_state != 'RECOGNIZED' or liveness_state != 'LIVE': raise ValueError('Only live, recognized faces may be marked automatically')
    late_cutoff = session.starts_at.timestamp() + 60 * 10
    status = 'LATE' if when.timestamp() > late_cutoff else 'PRESENT'
    record = Attendance(student_id=student.id, session_id=session.id, status=status, marked_at=when, recognition_state=recognition_state, liveness_state=liveness_state)
    db.session.add(record)
    try: db.session.commit()
    except IntegrityError:
        db.session.rollback(); raise ValueError('Attendance was already recorded for this student')
    return record

def flag_event(session_id, event_type, description, severity='MEDIUM', user_id=None):
    db.session.add(SuspiciousEvent(session_id=session_id, user_id=user_id, event_type=event_type, description=description, severity=severity)); db.session.commit()
