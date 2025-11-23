from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .schemas import PredictRequest, PredictResponse
from .disease_predictor import DiseasePredictor

app = FastAPI(title="ML Disease Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

predictor = DiseasePredictor()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict", response_model=PredictResponse)
def predict_endpoint(req: PredictRequest):
    return predictor.predict(req.features)
