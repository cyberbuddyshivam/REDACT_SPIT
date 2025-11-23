# ML API Integration Guide

## Overview

This document describes how the ML API is connected to the frontend and backend of the MediGuard system.

## Architecture

```
Frontend (React)
    ↓
Backend (Express.js)
    ↓
ML API (FastAPI + CatBoost)
```

## Components

### 1. ML API (FastAPI)

**Location**: `ml/src/app.py`

**Endpoints**:

- `GET /health` - Health check
- `POST /predict` - Disease prediction

**Request Format**:

```json
{
  "features": {
    "glucose": 120.5,
    "hba1c": 5.8,
    "insulin": 15.2
    // ... 21 more features
  }
}
```

**Response Format**:

```json
{
  "prediction": {
    "label": "Diabetes"
  },
  "probabilities": {
    "Diabetes": 0.85,
    "Heart Disease": 0.1,
    "Liver Disease": 0.03,
    "Kidney Disease": 0.02
  },
  "scaled_values": {
    "glucose": 0.75,
    "hba1c": 0.68
    // ... scaled features
  },
  "shap_values": {
    "glucose": 0.23,
    "hba1c": 0.18
    // ... SHAP explanations
  }
}
```

### 2. Backend Service (Express.js)

**Location**: `backend/src/services/mlApi.service.js`

**Functions**:

- `checkMLHealth()` - Verify ML API is running
- `getMLPredictions(features)` - Get predictions from ML API
- `getCombinedPredictions(clinicalData)` - Get both rule-based and ML predictions

**Controller Integration**: `backend/src/controllers/patient.controller.js`

The `predictDiseases` controller now:

1. Generates rule-based predictions (existing logic)
2. Calls ML API for model-based predictions
3. Returns both results to the frontend

### 3. Frontend Service (React)

**Location**: `frontend2/frontend/src/services/api.js`

**Functions**:

- `getPredictions(clinicalData, useMLModel)` - Get predictions via backend (includes both rule-based and ML)
- `getMLPredictions(features)` - Direct call to ML API (optional)
- `checkMLHealth()` - Check ML service status

## Setup Instructions

### Step 1: Start the ML API

```bash
cd ml
python -m uvicorn src.app:app --host 0.0.0.0 --port 5000 --reload
```

**Verify ML API is running**:

```bash
curl http://localhost:5000/health
```

Expected response: `{"status":"ok"}`

### Step 2: Configure Environment Variables

**Backend** (`backend/.env`):

```env
ML_API_URL=http://localhost:5000
```

**Frontend** (`frontend2/frontend/.env`):

```env
VITE_ML_API_URL=http://localhost:5000
```

### Step 3: Start Backend

```bash
cd backend
npm install
npm run dev
```

Backend will start on `http://localhost:8000`

### Step 4: Start Frontend

```bash
cd frontend2/frontend
npm install
npm run dev
```

Frontend will start on `http://localhost:5173`

## Usage

### Option 1: Via Backend (Recommended)

The backend automatically calls the ML API when predictions are requested:

```javascript
import { getPredictions } from "./services/api";

const clinicalData = {
  glucose: 120,
  hba1c: 5.8,
  // ... other parameters
};

const response = await getPredictions(clinicalData, true);

console.log("Rule-based predictions:", response.data.predictions);
console.log("ML prediction:", response.data.mlPrediction);
```

### Option 2: Direct ML API Call

Frontend can also call ML API directly (optional):

```javascript
import { getMLPredictions, checkMLHealth } from "./services/api";

// Check if ML service is available
const health = await checkMLHealth();
console.log(health);

// Get ML predictions directly
const mlResult = await getMLPredictions(clinicalData);
console.log(mlResult);
```

## Testing

### Test ML API Health

```bash
curl http://localhost:5000/health
```

### Test ML Prediction

```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "features": {
      "glucose": 120.5,
      "hba1c": 5.8,
      "insulin": 15.2,
      "bmi": 24.5,
      "systolicBP": 120,
      "diastolicBP": 80,
      "heartRate": 72,
      "temperature": 98.6,
      "spo2": 98,
      "troponin": 0.01,
      "crp": 1.2,
      "ldl": 100,
      "hdl": 50,
      "triglycerides": 150,
      "totalCholesterol": 200,
      "alt": 25,
      "ast": 30,
      "bilirubin": 0.8,
      "albumin": 4.5,
      "creatinine": 1.0,
      "bun": 15,
      "sodium": 140,
      "potassium": 4.0,
      "wbc": 7.5
    }
  }'
```

### Test Backend Integration

```bash
curl -X POST http://localhost:8000/api/v1/patients/predict \
  -H "Content-Type: application/json" \
  -d '{
    "clinicalData": {
      "glucose": 120.5,
      "hba1c": 5.8,
      // ... other parameters
    },
    "useMLModel": true
  }'
```

## Response Structure

When you call `/api/v1/patients/predict`, you'll receive:

```json
{
  "statusCode": 200,
  "data": {
    "predictions": [
      {
        "name": "Diabetes",
        "probability": 85,
        "confidence": 85,
        "severity": "high",
        "contributingFactors": [...],
        "parameterEvidence": [...]
      }
    ],
    "normalizedData": {...},
    "binaryStatuses": {...},
    "abnormalParameters": [...],
    "mlPrediction": {
      "prediction": {
        "label": "Diabetes"
      },
      "probabilities": {
        "Diabetes": 0.85,
        "Heart Disease": 0.10,
        "Liver Disease": 0.03,
        "Kidney Disease": 0.02
      },
      "scaled_values": {...},
      "shap_values": {...}
    },
    "mlTimestamp": "2025-11-23T12:00:00Z",
    "summary": {
      "totalPredictions": 1,
      "highRiskDiseases": 1,
      "moderateRiskDiseases": 0,
      "abnormalParameterCount": 3
    }
  },
  "message": "Predictions generated successfully",
  "success": true
}
```

## Error Handling

### ML API Down

If the ML API is not responding, the backend will:

- Continue with rule-based predictions
- Add `mlError` field to response
- Log error for debugging

```json
{
  "predictions": [...],
  "mlError": "ML service is not responding",
  "mlTimestamp": "2025-11-23T12:00:00Z"
}
```

### Invalid Input

ML API will return 422 error for invalid input:

```json
{
  "detail": "Invalid input format"
}
```

## Features

### ✅ Dual Prediction System

- Rule-based predictions (existing logic)
- ML model predictions (CatBoost)
- Both available simultaneously

### ✅ SHAP Explainability

ML predictions include SHAP values showing which features contributed most to the prediction.

### ✅ Graceful Degradation

If ML API is unavailable, the system continues with rule-based predictions.

### ✅ Health Monitoring

Both frontend and backend can check ML API health status.

### ✅ Scalable Architecture

ML API is separate microservice, can be scaled independently.

## Troubleshooting

### Issue: ML API returns 404

**Solution**: Ensure ML API is running on correct port (5000)

### Issue: CORS errors

**Solution**: ML API has CORS enabled for all origins. Check browser console for details.

### Issue: Connection timeout

**Solution**:

- Increase timeout in `mlApi.service.js` (currently 30 seconds)
- Check if ML API is processing slowly

### Issue: Wrong predictions

**Solution**:

- Verify feature names match exactly
- Check if model is loaded correctly
- Ensure input features are normalized

## Production Deployment

### Environment Variables

**Backend**:

```env
ML_API_URL=https://ml-api.yourdomain.com
```

**Frontend**:

```env
VITE_ML_API_URL=https://ml-api.yourdomain.com
```

### Security Considerations

1. Add API authentication for ML API
2. Use HTTPS for all communications
3. Implement rate limiting
4. Add request validation
5. Monitor API usage and performance

### Scaling

1. Deploy ML API as containerized service (Docker)
2. Use load balancer for multiple ML API instances
3. Implement caching for common predictions
4. Use message queue for async predictions

## Dependencies

**Backend**:

- `axios` (^1.6.0) - HTTP client for ML API calls

**Frontend**:

- `axios` (already installed) - HTTP client

**ML API**:

- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `joblib` - Model loading
- `numpy` - Numerical operations
- `catboost` - ML model

## API Endpoints Summary

| Service  | Method | Endpoint                   | Description          |
| -------- | ------ | -------------------------- | -------------------- |
| ML API   | GET    | `/health`                  | Health check         |
| ML API   | POST   | `/predict`                 | ML prediction        |
| Backend  | POST   | `/api/v1/patients/predict` | Combined predictions |
| Frontend | -      | `getPredictions()`         | Via backend          |
| Frontend | -      | `getMLPredictions()`       | Direct ML API        |
| Frontend | -      | `checkMLHealth()`          | ML health check      |

## Next Steps

1. **Add ML predictions to patient records** - Store ML predictions in database
2. **Visualize SHAP values** - Create UI to show feature importance
3. **Compare predictions** - Show differences between rule-based and ML predictions
4. **Add confidence intervals** - Display prediction uncertainty
5. **Implement A/B testing** - Compare accuracy of both approaches
6. **Add model versioning** - Track which model version made predictions

## Support

For issues or questions:

1. Check ML API logs: `ml/app.log`
2. Check backend logs: Terminal output
3. Check browser console: Frontend errors
4. Verify all services are running
5. Test endpoints individually

---

**Last Updated**: November 23, 2025
**Version**: 1.0.0
