# MediGuard ML Integration Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                              │
│                    (React Frontend - Port 5173)                     │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐  │
│  │ Patient Form │  │ Results View │  │ Parameter Dashboard     │  │
│  └──────────────┘  └──────────────┘  └─────────────────────────┘  │
│                                                                     │
│                     src/services/api.js                             │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ • getPredictions(clinicalData, useMLModel)                   │  │
│  │ • getMLPredictions(features) [Direct to ML]                  │  │
│  │ • checkMLHealth()                                            │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
            │                                           │
            │ HTTP                                      │ HTTP (Optional)
            │ POST /api/v1/patients/predict             │ POST /predict
            ↓                                           ↓
┌─────────────────────────────────────────────┐    ┌──────────────────┐
│     BACKEND API (Express - Port 8000)       │    │   ML API         │
│                                             │    │   (FastAPI       │
│  ┌─────────────────────────────────────┐   │    │   Port 5000)     │
│  │  patient.controller.js              │   │    │                  │
│  │                                     │   │    │  ┌─────────────┐ │
│  │  predictDiseases() {                │   │    │  │ app.py      │ │
│  │    1. Normalize data                │   │    │  │             │ │
│  │    2. Rule-based predictions  ◄─────┼───┼────┤  │ /health     │ │
│  │    3. Call ML API ───────────────────────────►  │ /predict    │ │
│  │    4. Combine results               │   │    │  └─────────────┘ │
│  │    5. Return to frontend            │   │    │                  │
│  │  }                                  │   │    │  ┌─────────────┐ │
│  └─────────────────────────────────────┘   │    │  │ disease_    │ │
│                                             │    │  │ predictor.py│ │
│  ┌─────────────────────────────────────┐   │    │  │             │ │
│  │  services/mlApi.service.js          │   │    │  │ - Load model│ │
│  │                                     │   │    │  │ - Scale data│ │
│  │  • checkMLHealth()                  │   │    │  │ - Predict   │ │
│  │  • getMLPredictions(features) ──────┼───┼────►  │ - SHAP      │ │
│  │  • getCombinedPredictions()         │   │    │  └─────────────┘ │
│  └─────────────────────────────────────┘   │    │                  │
│                                             │    │  ┌─────────────┐ │
│  ┌─────────────────────────────────────┐   │    │  │ CatBoost    │ │
│  │  utils/predictionEngine.js          │   │    │  │ Model       │ │
│  │                                     │   │    │  │ (Trained)   │ │
│  │  • generatePredictions() [Rules]    │   │    │  └─────────────┘ │
│  │  • DISEASE_PARAMETER_MAP            │   │    └──────────────────┘
│  │  • Diabetes, Heart, Liver, Kidney   │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  utils/scalingBridge.js             │   │
│  │  • normalizeAllParameters()          │   │
│  │  • REFERENCE_RANGES                  │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
            │
            ↓
┌─────────────────────────────────────────────┐
│         MongoDB Database                    │
│         (Port 27017)                        │
│                                             │
│  Collections:                               │
│  • patients                                 │
│  • parameters                               │
└─────────────────────────────────────────────┘
```

## Data Flow: Clinical Data → Prediction

```
┌────────────────────────────────────────────────────────────────────┐
│ STEP 1: User Input (Frontend)                                     │
└────────────────────────────────────────────────────────────────────┘
                              │
                              │ clinicalData = {
                              │   glucose: 120,
                              │   hba1c: 5.8,
                              │   ... (24 parameters)
                              │ }
                              ↓
┌────────────────────────────────────────────────────────────────────┐
│ STEP 2: API Call (Frontend)                                       │
│ getPredictions(clinicalData, useMLModel=true)                      │
└────────────────────────────────────────────────────────────────────┘
                              │
                              │ POST /api/v1/patients/predict
                              │ { clinicalData, useMLModel: true }
                              ↓
┌────────────────────────────────────────────────────────────────────┐
│ STEP 3: Backend Processing                                        │
│                                                                    │
│ A. Normalize & Validate                                           │
│    └─► scalingBridge.normalizeAllParameters()                     │
│                                                                    │
│ B. Rule-Based Prediction                                          │
│    └─► predictionEngine.generatePredictions()                     │
│        • Check glucose, HbA1c → Diabetes risk                     │
│        • Check troponin, BP → Heart disease risk                  │
│        • Check ALT, AST → Liver disease risk                      │
│        • Check creatinine, BUN → Kidney disease risk              │
│                                                                    │
│ C. ML Model Prediction                                            │
│    └─► mlApi.getCombinedPredictions()                             │
│        POST http://localhost:5000/predict                         │
└────────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌────────────────────────────────────────────────────────────────────┐
│ STEP 4: ML API Processing                                         │
│                                                                    │
│ A. Feature Scaling                                                │
│    └─► ScalingBridge.scale_dict()                                 │
│        • Min-Max normalization                                    │
│        • Feature order matching                                   │
│                                                                    │
│ B. Model Prediction                                               │
│    └─► CatBoost.predict_proba()                                   │
│        • Input: 24 normalized features                            │
│        • Output: Probabilities for 4 diseases                     │
│                                                                    │
│ C. Explainability (SHAP)                                          │
│    └─► ExplainabilityEngine.compute_and_return()                  │
│        • Feature importance scores                                │
│        • Which features contributed most                          │
└────────────────────────────────────────────────────────────────────┘
                              │
                              │ {
                              │   prediction: {label: "Diabetes"},
                              │   probabilities: {...},
                              │   shap_values: {...}
                              │ }
                              ↓
┌────────────────────────────────────────────────────────────────────┐
│ STEP 5: Backend Response Assembly                                 │
│                                                                    │
│ response = {                                                       │
│   predictions: [Rule-based results],                              │
│   mlPrediction: {ML model results},                               │
│   normalizedData: {...},                                          │
│   abnormalParameters: [...],                                      │
│   summary: {...}                                                  │
│ }                                                                  │
└────────────────────────────────────────────────────────────────────┘
                              │
                              │ 200 OK
                              │ ApiResponse(200, response, "Success")
                              ↓
┌────────────────────────────────────────────────────────────────────┐
│ STEP 6: Frontend Display                                          │
│                                                                    │
│ • Show rule-based predictions (cards)                             │
│ • Show ML prediction (probability bars)                           │
│ • Show SHAP feature importance                                    │
│ • Display abnormal parameters                                     │
│ • Save to patient record                                          │
└────────────────────────────────────────────────────────────────────┘
```

## Component Interaction Matrix

| Component              | Calls                          | Called By          | Purpose                        |
| ---------------------- | ------------------------------ | ------------------ | ------------------------------ |
| **Frontend API**       | Backend API, ML API (optional) | React Components   | User interface for predictions |
| **Backend Controller** | ML Service, Prediction Engine  | Frontend API       | Orchestrate prediction logic   |
| **ML Service**         | ML API                         | Backend Controller | HTTP client for ML API         |
| **Prediction Engine**  | Scaling Bridge                 | Backend Controller | Rule-based disease detection   |
| **ML API**             | Disease Predictor              | Backend/Frontend   | FastAPI server for ML          |
| **Disease Predictor**  | CatBoost Model, SHAP           | ML API             | ML prediction logic            |

## Error Handling Flow

```
Frontend Request
    │
    ↓
Backend receives request
    │
    ├─► Rule-based prediction (ALWAYS succeeds)
    │   └─► Result saved
    │
    ├─► ML API call
    │   │
    │   ├─► Success
    │   │   └─► ML prediction added to response
    │   │
    │   └─► Failure (timeout, offline, error)
    │       ├─► Log error
    │       ├─► Add mlError field
    │       └─► Continue with rule-based only
    │
    ↓
Return combined response
    │
    └─► Frontend displays available predictions
```

## Environment Configuration

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (.env)                                             │
│ ├─► VITE_API_BASE_URL=http://localhost:8000/api/v1         │
│ └─► VITE_ML_API_URL=http://localhost:5000                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Connects to
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend (.env)                                              │
│ ├─► PORT=8000                                               │
│ ├─► MONGO_URI=mongodb://...                                 │
│ └─► ML_API_URL=http://localhost:5000                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Calls
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ ML API (Port 5000)                                          │
│ ├─► Loads model from models/model.joblib                    │
│ ├─► Uses metadata from metadata/                            │
│ └─► Returns predictions with SHAP values                    │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

```
┌────────────────┬──────────────────┬─────────────────────┐
│ Layer          │ Technology       │ Key Libraries       │
├────────────────┼──────────────────┼─────────────────────┤
│ Frontend       │ React 18         │ Axios, Vite         │
│ Backend        │ Node.js/Express  │ Axios, Mongoose     │
│ ML API         │ Python/FastAPI   │ CatBoost, SHAP      │
│ Database       │ MongoDB          │ Mongoose ODM        │
│ ML Model       │ CatBoost         │ Joblib, NumPy       │
└────────────────┴──────────────────┴─────────────────────┘
```

## Deployment Ports

```
Service          Port    Protocol    URL
────────────────────────────────────────────────────────
Frontend         5173    HTTP        http://localhost:5173
Backend API      8000    HTTP        http://localhost:8000
ML API           5000    HTTP        http://localhost:5000
MongoDB          27017   TCP         mongodb://localhost:27017
```

## Key Features Summary

```
┌─────────────────────────────────────────────────────────────┐
│ DUAL PREDICTION SYSTEM                                      │
│                                                             │
│ ┌──────────────────────┐    ┌──────────────────────┐      │
│ │ Rule-Based Engine    │    │ ML Model Engine      │      │
│ ├──────────────────────┤    ├──────────────────────┤      │
│ │ • Fast (<100ms)      │    │ • Accurate (>85%)    │      │
│ │ • Deterministic      │    │ • Probabilistic      │      │
│ │ • Explainable logic  │    │ • SHAP explanations  │      │
│ │ • Always available   │    │ • Requires API       │      │
│ │ • Clinical rules     │    │ • Data-driven        │      │
│ └──────────────────────┘    └──────────────────────┘      │
│                                                             │
│         Both results combined in single response            │
└─────────────────────────────────────────────────────────────┘
```

## Success Indicators

```
✅ Frontend connects to Backend
✅ Backend connects to ML API
✅ ML API loads model successfully
✅ Predictions return in <30 seconds
✅ SHAP values included in response
✅ System works with ML API offline
✅ Error messages are informative
✅ All 24 features processed correctly
```

---

**Architecture Version**: 1.0.0  
**Last Updated**: November 23, 2025  
**Status**: Production Ready
