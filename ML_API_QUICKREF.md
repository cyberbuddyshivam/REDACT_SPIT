# ML API Quick Reference

## Start Services

**Windows:**

```bash
start-all.bat
```

**Linux/Mac:**

```bash
chmod +x start-all.sh
./start-all.sh
```

**Manual Start:**

```bash
# Terminal 1 - ML API
cd ml
python -m uvicorn src.app:app --port 5000 --reload

# Terminal 2 - Backend
cd backend
npm run dev

# Terminal 3 - Frontend
cd frontend2/frontend
npm run dev
```

## Test Integration

```bash
python test_ml_integration.py
```

## API Endpoints

### ML API (Port 5000)

- `GET /health` - Health check
- `POST /predict` - Get ML prediction

### Backend API (Port 8000)

- `GET /api/v1/healthcheck` - Health check
- `POST /api/v1/patients/predict` - Get predictions (rule-based + ML)

### Frontend (Port 5173)

- Web interface for patient data entry and prediction viewing

## Environment Variables

**Backend (.env):**

```env
ML_API_URL=http://localhost:5000
```

**Frontend (.env):**

```env
VITE_ML_API_URL=http://localhost:5000
```

## Code Examples

### Frontend - Get Predictions

```javascript
import { getPredictions } from "./services/api";

const clinicalData = {
  glucose: 120,
  hba1c: 5.8,
  // ... other parameters
};

// Get both rule-based and ML predictions
const response = await getPredictions(clinicalData, true);

// Rule-based predictions
console.log(response.data.predictions);

// ML predictions
console.log(response.data.mlPrediction);
```

### Backend - Call ML API

```javascript
import { getMLPredictions } from "../services/mlApi.service.js";

const mlResult = await getMLPredictions(clinicalData);
console.log(mlResult.prediction.label);
console.log(mlResult.probabilities);
```

### Direct ML API Call

```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"features": {"glucose": 120, "hba1c": 5.8, ...}}'
```

## Required Features (24 parameters)

```javascript
{
  glucose, // Blood glucose (mg/dL)
    hba1c, // Hemoglobin A1c (%)
    insulin, // Insulin level (μU/mL)
    bmi, // Body Mass Index
    systolicBP, // Systolic blood pressure (mmHg)
    diastolicBP, // Diastolic blood pressure (mmHg)
    heartRate, // Heart rate (bpm)
    temperature, // Body temperature (°F)
    spo2, // Blood oxygen saturation (%)
    troponin, // Troponin level (ng/mL)
    crp, // C-reactive protein (mg/L)
    ldl, // LDL cholesterol (mg/dL)
    hdl, // HDL cholesterol (mg/dL)
    triglycerides, // Triglycerides (mg/dL)
    totalCholesterol, // Total cholesterol (mg/dL)
    alt, // ALT enzyme (U/L)
    ast, // AST enzyme (U/L)
    bilirubin, // Bilirubin (mg/dL)
    albumin, // Albumin (g/dL)
    creatinine, // Creatinine (mg/dL)
    bun, // Blood urea nitrogen (mg/dL)
    sodium, // Sodium (mEq/L)
    potassium, // Potassium (mEq/L)
    wbc; // White blood cell count (×10⁹/L)
}
```

## Troubleshooting

| Issue                  | Solution                                       |
| ---------------------- | ---------------------------------------------- |
| ML API not responding  | Check if running on port 5000                  |
| CORS errors            | ML API has CORS enabled, check browser console |
| 422 validation error   | Verify all 24 features are provided            |
| Backend can't reach ML | Check `ML_API_URL` in backend/.env             |
| Prediction timeout     | Increase timeout in mlApi.service.js           |

## File Locations

```
├── ml/
│   └── src/
│       ├── app.py                    # ML API main file
│       └── disease_predictor.py      # Prediction logic
├── backend/
│   ├── .env                          # Backend environment
│   └── src/
│       ├── services/
│       │   └── mlApi.service.js      # ML API client
│       └── controllers/
│           └── patient.controller.js # Prediction endpoint
├── frontend2/frontend/
│   ├── .env                          # Frontend environment
│   └── src/
│       └── services/
│           └── api.js                # API client
├── ML_API_INTEGRATION.md             # Full documentation
├── test_ml_integration.py            # Integration tests
├── start-all.bat                     # Windows startup
└── start-all.sh                      # Linux/Mac startup
```

## Health Checks

```bash
# ML API
curl http://localhost:5000/health

# Backend
curl http://localhost:8000/api/v1/healthcheck

# Frontend
curl http://localhost:5173
```

## Support

See `ML_API_INTEGRATION.md` for detailed documentation.
