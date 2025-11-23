# main.py

import argparse
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import math

from src.scaling_bridge import ScalingBridge
from src.predict import ModelPredictor
from src.explainability import ExplainabilityEngine
from src.schemas import PredictRequest, PredictResponse

startup_error = None

try:
    scaler = ScalingBridge()
    predictor = ModelPredictor()
    feature_order = scaler.feature_order

    explainer = ExplainabilityEngine(
        predictor.model,
        feature_order
    )

    print("[main] Loaded all components successfully")

except Exception as e:
    startup_error = str(e)
    scaler = predictor = explainer = None
    feature_order = []
    print("[main] Startup error:", startup_error)

# API
app = FastAPI(title="Medical ML API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    if predictor is None:
        return {"status": "error", "details": startup_error}
    return {"status": "ok", "features": feature_order}

def clean(d):
    out = {}
    for k, v in d.items():
        if isinstance(v, float) and (math.isnan(v) or v is None):
            out[k] = 0.0
        else:
            out[k] = float(v)
    return out

@app.post("/predict", response_model=PredictResponse)
def predict_api(req: PredictRequest):

    if predictor is None:
        raise HTTPException(503, f"Startup error: {startup_error}")

    # scale
    Xs = scaler.scale_dict(req.features)
    scaled_map = {feat: float(Xs[0][i]) for i, feat in enumerate(feature_order)}

    # predict
    pred, probs = predictor.predict(Xs)

    # shap
    shap_map = explainer.compute_and_return(req.features)

    # top K
    if req.top_k:
        shap_map = dict(sorted(shap_map.items(), key=lambda x: abs(x[1]), reverse=True)[:req.top_k])

    return {
        "prediction": pred,
        "probabilities": probs,
        "scaled_values": clean(scaled_map),
        "shap_values": clean(shap_map)
    }

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--serve", action="store_true")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    if args.serve:
        uvicorn.run("main:app", host="0.0.0.0", port=args.port)
    else:
        parser.print_help()
