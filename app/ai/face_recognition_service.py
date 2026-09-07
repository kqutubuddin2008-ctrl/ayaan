"""OpenCV Haar detection plus a deterministic DCT descriptor for an offline college prototype.
It uses real image measurements, not random results. For institutional deployment replace the
extractor with a validated, consented face-embedding model and calibrate thresholds locally.
"""
from dataclasses import dataclass
import cv2
import numpy as np
from flask import current_app
from app.models import FaceEmbedding
from app.utils.security import decrypt_biometric

@dataclass
class VisionResult:
    state: str; message: str; embedding: np.ndarray | None = None; quality: float = 0; distance: float | None = None; student_id: int | None = None

class FaceRecognitionService:
    def __init__(self):
        path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.detector = cv2.CascadeClassifier(path)
    def analyze(self, raw: bytes) -> VisionResult:
        image = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
        if image is None: return VisionResult('UNKNOWN', 'Invalid image')
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY); faces = self.detector.detectMultiScale(gray, 1.1, 5, minSize=(80,80))
        if len(faces) == 0: return VisionResult('UNKNOWN', 'No face detected')
        if len(faces) != 1: return VisionResult('UNCERTAIN', 'Exactly one face is required')
        x,y,w,h = faces[0]; crop = gray[y:y+h,x:x+w]; quality = float(cv2.Laplacian(crop, cv2.CV_64F).var())
        if quality < 25: return VisionResult('UNCERTAIN', 'Image is too blurred; improve lighting and focus', quality=quality)
        resized = cv2.resize(crop, (64,64)).astype(np.float32) / 255.0
        descriptor = cv2.dct(resized)[:16,:16].flatten(); descriptor /= np.linalg.norm(descriptor) + 1e-8
        return VisionResult('READY','One usable face detected',descriptor,quality)
    def recognize(self, raw: bytes) -> VisionResult:
        result = self.analyze(raw)
        if result.embedding is None: return result
        candidates = FaceEmbedding.query.filter_by(revoked_at=None).all()
        if not candidates: return VisionResult('UNKNOWN','No enrolled faces are available', quality=result.quality)
        best = min(((float(np.linalg.norm(result.embedding - np.frombuffer(decrypt_biometric(row.encrypted_embedding), dtype=np.float32))), row.student_id) for row in candidates), default=(None,None))
        distance, student_id = best; threshold = current_app.config['RECOGNITION_DISTANCE_THRESHOLD']
        if distance <= threshold: return VisionResult('RECOGNIZED','Face matched an enrolled student', quality=result.quality, distance=distance, student_id=student_id)
        if distance <= threshold * 1.25: return VisionResult('UNCERTAIN','Match is too close to the decision boundary', quality=result.quality, distance=distance)
        return VisionResult('UNKNOWN','Face did not match an enrolled student', quality=result.quality, distance=distance)
