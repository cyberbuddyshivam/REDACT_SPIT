from fastapi.testclient import TestClient
import json
import sys

# Import the FastAPI app
from main import app

client = TestClient(app)

payload = {
    "features": {
        "BMI": 25.0,
        "Glucose": 120.0,
        "HbA1c": 5.8,
        "Insulin": 10.0,
        "Cholesterol": 200.0,
        "LDL": 120.0,
        "HDL": 50.0,
        "Triglycerides": 150.0,
        "Troponin": 0.02,
        "ALT": 30.0,
        "AST": 28.0,
        "Bilirubin": 0.6,
        "Creatinine": 1.0,
        "BUN": 14.0,
        "CRP": 1.2,
        "Hemoglobin": 14.0,
        "Hematocrit": 42.0,
        "RBC": 4.8,
        "MCV": 90.0,
        "WBC": 7.0,
        "Platelets": 250.0,
        "SystolicBP": 120,
        "DiastolicBP": 80,
        "Cholesterol_HDL_Ratio": 4.0
    }
}

resp = client.post("/predict", json=payload)
print('status_code', resp.status_code)
try:
    print(json.dumps(resp.json(), indent=2))
except Exception as e:
    print('Response not JSON:', resp.text)
    print('Headers:', resp.headers)
    raise
