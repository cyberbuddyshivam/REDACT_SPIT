# src/scaling_bridge.py

import os
import json
import numpy as np

class ScalingBridge:
    """
    Scaling using min–max metadata from features_metadata.json.
    """

    def __init__(self, meta_path: str = "metadata/features_metadata.json"):
        self.meta_path = meta_path
        self.meta = {}
        self.feature_order = []
        self.load_features_metadata()

    def load_features_metadata(self):
        if not os.path.exists(self.meta_path):
            raise FileNotFoundError(f"Features metadata not found at: {self.meta_path}")

        with open(self.meta_path, "r", encoding="utf-8") as f:
            self.meta = json.load(f)

        if not isinstance(self.meta, dict):
            raise ValueError("features_metadata.json must contain a dictionary")

        # FIXED — now always available
        self.feature_order = list(self.meta.keys())

        return self.meta

    def scale_value(self, feature, value):
        m = self.meta[feature]
        lo = float(m["min"])
        hi = float(m["max"])
        v = float(value)

        # min-max scale
        scaled = (v - lo) / (hi - lo)
        return float(np.clip(scaled, 0.0, 1.0))

    def scale_dict(self, incoming):
        """
        Convert dict → 1x24 numpy array
        """
        row = []
        for feat in self.feature_order:
            if feat not in incoming:
                raise KeyError(f"Missing input: {feat}")
            row.append(self.scale_value(feat, incoming[feat]))
        return np.array([row], dtype=float)

    def unscale_value(self, feat, scaled):
        lo = float(self.meta[feat]["min"])
        hi = float(self.meta[feat]["max"])
        return lo + scaled * (hi - lo)
