# Viva preparation

## Basic questions
**What is the project?** A Flask/MySQL attendance platform that combines enrolled face descriptors, a movement challenge, role-based workflow, reports, and auditability.

**Why this project?** Manual registers consume teaching time and make timely attendance intervention difficult.

**What technologies are used?** Python, Flask, SQLAlchemy, MySQL 8, OpenCV, Bootstrap, Pandas/OpenPyXL, and ReportLab.

## Technical questions
**How does recognition work?** Enrollment detects one face and computes a normalized image descriptor. Recognition compares Euclidean distance to encrypted enrolled descriptors and returns recognized, unknown, or uncertain.

**What are embeddings?** Compact numeric feature vectors representing visual characteristics; they are sensitive biometric data and are encrypted at rest here.

**What is liveness?** A two-frame, prompted head-movement challenge. It returns LIVE, SPOOF_SUSPECTED, or UNCERTAIN. It is not proof against every replay or deepfake attack.

**How is duplication prevented?** Service validation is backed by the database `UNIQUE(student_id, session_id)` constraint.

**Why MySQL and Flask?** MySQL offers mature transactional relational storage; Flask keeps a modular BCA-scale API understandable.

**What are REST and ORM?** REST uses resource-oriented HTTP endpoints; SQLAlchemy ORM maps Python models to parameterized database operations.

**How are passwords and RBAC secured?** Werkzeug hashes passwords; Flask-Login maintains server-side sessions; decorators enforce role permissions.

**How is percentage calculated?** Count PRESENT, LATE, and MANUALLY_CORRECTED records divided by non-cancelled applicable sessions.

## Advanced questions
**What if students look similar or confidence is low?** The result is UNCERTAIN and automatic attendance is blocked; staff can use an audited correction.

**How do you stop photo spoofing?** The movement prompt is a baseline deterrent only. Production needs calibrated PAD/landmarks, secure cameras, monitoring, and consent.

**How does it scale?** Paginate queries, index session/student keys, cache or vector-index encrypted retrieval safely, use background reporting, and separate web workers.

**How is biometric data protected?** Keep minimum descriptors, encrypt at rest, restrict roles, avoid logs, use TLS, and provide retention/re-enrollment/deletion controls.
