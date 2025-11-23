# src/predict.py

import joblib
import numpy as np
from pathlib import Path

MODEL_PATH = Path("models/model.joblib")

DISEASE_MAP = {
    0: "Diabetes",
    1: "Heart Disease",
    2: "Kidney Disease",
    3: "Liver Disorder"
}

class ModelPredictor:
    def __init__(self):
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

        self.model = joblib.load(MODEL_PATH)

    def predict(self, X):
        """
        Returns:
            pred_label_dict = {"label": "..."}
            probs_map = {"Diabetes": ..., "Heart Disease": ..., ...}
        """

        X = np.asarray(X, dtype=float)

        # Predict class index
        class_index = int(self.model.predict(X)[0])

        # Predict probabilities
        try:
            probs = self.model.predict_proba(X)[0]
        except:
            # fallback for models without predict_proba
            raw = self.model.decision_function(X)[0]
            exp = np.exp(raw - np.max(raw))
            probs = exp / exp.sum()

        # Convert numeric probs → label probs
        probs_map = {
            DISEASE_MAP[i]: float(probs[i])
            for i in range(len(probs))
        }

        pred_label_dict = {
            "label": DISEASE_MAP[class_index]
        }

        return pred_label_dict, probs_map
