from pydantic import BaseModel
from typing import Dict, Optional


class PredictRequest(BaseModel):
    features: Dict[str, float]
    top_k: Optional[int] = None

class PredictResponse(BaseModel):
    prediction: Dict[str, str]
    probabilities: Dict[str, float]
    scaled_values: Dict[str, float]
    shap_values: Dict[str, float]
