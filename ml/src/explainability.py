# src/explainability.py

import numpy as np
import shap

class ExplainabilityEngine:

    def __init__(self, model, feature_names):
        """
        model: trained model
        feature_names: list of 24 features in correct order
        """
        self.model = model
        self.feature_names = feature_names
        self.explainer = None

    # -----------------------------------------------------
    # Initialize SHAP explainer
    # -----------------------------------------------------
    def _init_explainer(self, background):
        background = np.asarray(background, dtype=float)

        # Try tree explainer first (XGBoost, RandomForest, CatBoost)
        try:
            self.explainer = shap.TreeExplainer(self.model)
        except:
            # Fallback generic explainer
            self.explainer = shap.Explainer(self.model.predict, background)

    # -----------------------------------------------------
    # MAIN PUBLIC METHOD (used in main.py)
    # -----------------------------------------------------
    def compute_and_return(self, raw_input_dict):
        """
        raw_input_dict = {feature: raw_value}
        Returns {feature: shap_value}
        """

        # Convert dict → 1xN ordered vector
        X = np.array([[raw_input_dict[f] for f in self.feature_names]], dtype=float)

        # Initialize explainer first time
        if self.explainer is None:
            self._init_explainer(X)

        # Generate SHAP explanation
        explanation = self.explainer(X)

        # SHAP returns Explanation object → get values
        try:
            shap_values = explanation.values[0]     # for TreeExplainer
        except Exception:
            shap_values = explanation[0]            # for fallback Explainer

        import numpy as _np
        sv = _np.asarray(shap_values)

        # Reduce shapes to a 1-D feature vector when possible
        if sv.ndim == 1:
            vec = sv
        elif sv.ndim == 2:
            # Could be (1, n_features) or (n_outputs, n_features)
            if sv.shape[0] == 1:
                vec = sv[0]
            else:
                # multiclass / multioutput: average across outputs
                vec = _np.mean(sv, axis=0)
        elif sv.ndim == 3:
            # e.g., (samples, outputs, features) — take first sample then average outputs
            vec = _np.mean(sv[0], axis=0)
        else:
            # Fallback: flatten and take first N features
            vec = sv.ravel()[: len(self.feature_names)]

        # Convert array → dict, safe-cast to float
        out = {}
        for i, fname in enumerate(self.feature_names):
            try:
                out[fname] = float(vec[i])
            except Exception:
                out[fname] = 0.0

        return out
