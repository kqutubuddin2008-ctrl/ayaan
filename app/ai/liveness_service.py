from dataclasses import dataclass
from flask import current_app
@dataclass
class LivenessResult: state: str; message: str; movement: float = 0
class LivenessService:
    """Challenge-based movement verifier. Client submits two independently captured frames."""
    def verify(self, first_center, second_center):
        if not first_center or not second_center: return LivenessResult('UNCERTAIN','Complete the prompted head-movement challenge')
        movement = ((first_center[0]-second_center[0])**2 + (first_center[1]-second_center[1])**2) ** .5
        if movement >= current_app.config['LIVENESS_MIN_MOVEMENT']: return LivenessResult('LIVE','Movement challenge completed',movement)
        return LivenessResult('SPOOF_SUSPECTED','Insufficient face movement; flagged for review',movement)
