-- MySQL 8 deployment schema is managed from SQLAlchemy by Flask-Migrate.
-- Run: flask --app app.py db init && flask --app app.py db migrate && flask --app app.py db upgrade
CREATE DATABASE IF NOT EXISTS smart_attendance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- The generated migration creates users, departments, courses, subjects, students,
-- face_embeddings, attendance_sessions, attendance, audit_logs and suspicious_events.
-- Critical integrity: attendance has UNIQUE(student_id, session_id).
