import joblib
import json
import numpy as np
from .scaling_bridge import ScalingBridge
from .explainability import ExplainabilityEngine

class DiseasePredictor:
    def __init__(self):

        MODEL_PATH = "models/model.joblib"   # FIXED
        CLASS_MAP_PATH = "metadata/class_mapping.json"
        
        try:
            self.model = joblib.load(MODEL_PATH)
        except:
            raise FileNotFoundError(f"Model file not found at: {MODEL_PATH}")

        try:
            with open(CLASS_MAP_PATH, "r") as f:
                self.class_mapping = json.load(f)
        except:
            raise FileNotFoundError(f"Class mapping missing: {CLASS_MAP_PATH}")

        self.scaler = ScalingBridge()
        self.features = list(self.scaler.meta.keys())

        # Initialize explainability engine with feature order
        self.explainer = ExplainabilityEngine(self.model, feature_names=self.features)

    def predict(self, features: dict):
        # scale (scale_dict may return ndarray or dict)
        scaled = self.scaler.scale_dict(features)
        if isinstance(scaled, dict):
            scaled_map = {f: float(scaled[f]) for f in self.features}
            x_scaled = np.array([[scaled_map[f] for f in self.features]], dtype=float)
        else:
            # assume numpy array 1 x N
            import numpy as _np
            arr = _np.asarray(scaled)
            if arr.ndim == 2:
                x_scaled = arr
            else:
                x_scaled = arr.reshape(1, -1)
            scaled_map = {f: float(x_scaled[0][i]) for i, f in enumerate(self.features)}

        # predict
        proba = self.model.predict_proba(x_scaled)[0]
        max_idx = int(np.argmax(proba))
        pred_label = self.class_mapping[str(max_idx)]

        # shap (use raw features dict for meaningful explanations)
        try:
            shap_values = self.explainer.compute_and_return(features)
        except Exception:
            # fallback: empty shap mapping
            shap_values = {f: 0.0 for f in self.features}

        return {
            "prediction": {"label": pred_label},
            "probabilities": {
                self.class_mapping[str(i)]: float(p)
                for i, p in enumerate(proba)
            },
            "scaled_values": scaled_map,
            "shap_values": shap_values
        }
