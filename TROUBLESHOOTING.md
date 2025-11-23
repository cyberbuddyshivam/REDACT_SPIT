# ML API Integration Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: ML API Not Starting

**Symptoms:**

- `Connection refused` errors
- `curl http://localhost:5000/health` fails
- Backend logs show ML API unreachable

**Solutions:**

1. **Check if port 5000 is already in use:**

   ```bash
   # Windows
   netstat -ano | findstr :5000

   # Linux/Mac
   lsof -i :5000
   ```

   If occupied, either kill the process or change ML API port

2. **Verify Python dependencies:**

   ```bash
   cd ml
   pip install -r requirements.txt
   ```

3. **Check if model file exists:**

   ```bash
   # Should exist: ml/models/model.joblib
   ls ml/models/model.joblib
   ```

4. **Start ML API manually with verbose logs:**

   ```bash
   cd ml
   python -m uvicorn src.app:app --host 0.0.0.0 --port 5000 --log-level debug
   ```

5. **Check for Python errors:**
   - Missing dependencies
   - Import errors
   - Model loading failures

---

### Issue 2: Backend Cannot Connect to ML API

**Symptoms:**

- Backend starts but ML predictions fail
- Logs show: "ML service is not responding"
- `mlError` in response

**Solutions:**

1. **Verify ML_API_URL in backend/.env:**

   ```env
   ML_API_URL=http://localhost:5000
   ```

   Note: Use `http://` not `https://`

2. **Test ML API manually:**

   ```bash
   curl http://localhost:5000/health
   ```

   Should return: `{"status":"ok"}`

3. **Check firewall/antivirus:**

   - Allow port 5000
   - Whitelist Python/Node.js

4. **Verify axios is installed:**

   ```bash
   cd backend
   npm list axios
   ```

5. **Check backend logs for detailed error:**
   ```bash
   # Look for [ML API] logs
   npm run dev
   ```

---

### Issue 3: CORS Errors

**Symptoms:**

- Browser console: "CORS policy blocked"
- Network tab shows preflight (OPTIONS) failures
- Frontend cannot reach ML API directly

**Solutions:**

1. **Verify ML API CORS settings (ml/src/app.py):**

   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["*"],
       allow_methods=["*"],
       allow_headers=["*"]
   )
   ```

2. **Use backend proxy instead of direct calls:**

   ```javascript
   // Recommended: Via backend
   getPredictions(clinicalData, true);

   // Instead of direct ML API call
   getMLPredictions(features);
   ```

3. **Check browser console for specific CORS error**

---

### Issue 4: Prediction Timeout

**Symptoms:**

- Request takes >30 seconds
- "Timeout" error in response
- ML API hangs

**Solutions:**

1. **Increase timeout in backend service:**

   ```javascript
   // backend/src/services/mlApi.service.js
   const ML_API_TIMEOUT = 60000; // Increase to 60 seconds
   ```

2. **Check ML API performance:**

   ```bash
   # Time the prediction
   time curl -X POST http://localhost:5000/predict \
     -H "Content-Type: application/json" \
     -d '{"features": {...}}'
   ```

3. **Optimize model loading:**

   - Model loads on startup (good)
   - Avoid reloading on each prediction

4. **Check system resources:**
   - CPU usage
   - Memory availability
   - Disk I/O

---

### Issue 5: Invalid Prediction Response

**Symptoms:**

- 422 Unprocessable Entity
- "Invalid input" errors
- Missing features in response

**Solutions:**

1. **Verify all 24 features are provided:**

   ```javascript
   const requiredFeatures = [
     "glucose",
     "hba1c",
     "insulin",
     "bmi",
     "systolicBP",
     "diastolicBP",
     "heartRate",
     "temperature",
     "spo2",
     "troponin",
     "crp",
     "ldl",
     "hdl",
     "triglycerides",
     "totalCholesterol",
     "alt",
     "ast",
     "bilirubin",
     "albumin",
     "creatinine",
     "bun",
     "sodium",
     "potassium",
     "wbc",
   ];
   ```

2. **Check feature types (must be numbers):**

   ```javascript
   // Bad
   {
     glucose: "120";
   }

   // Good
   {
     glucose: 120;
   }
   ```

3. **Validate feature names match exactly:**

   - Case-sensitive
   - No typos
   - No extra spaces

4. **Test with known good data:**
   ```bash
   curl -X POST http://localhost:5000/predict \
     -H "Content-Type: application/json" \
     -d @ml/test_sample.json
   ```

---

### Issue 6: Frontend Not Receiving ML Predictions

**Symptoms:**

- Frontend shows only rule-based predictions
- `mlPrediction` is null or undefined
- No errors in console

**Solutions:**

1. **Check if ML API is enabled in request:**

   ```javascript
   // Make sure useMLModel is true
   getPredictions(clinicalData, true);
   ```

2. **Verify backend is calling ML API:**

   ```javascript
   // backend/src/controllers/patient.controller.js
   const { clinicalData, useMLModel = true } = req.body;
   ```

3. **Check backend response structure:**

   ```json
   {
     "data": {
       "predictions": [...],
       "mlPrediction": {  // Should be present
         "prediction": {...},
         "probabilities": {...}
       }
     }
   }
   ```

4. **Look for `mlError` in response:**
   - Indicates ML API call failed
   - Check backend logs for details

---

### Issue 7: Wrong Predictions

**Symptoms:**

- ML predictions seem inaccurate
- Probabilities don't make sense
- SHAP values are strange

**Solutions:**

1. **Verify feature scaling is correct:**

   ```python
   # ml/src/scaling_bridge.py should normalize features
   # Check metadata/minmax.json has correct ranges
   ```

2. **Check model version:**

   ```bash
   # Ensure latest model is loaded
   ls -lh ml/models/model.joblib
   ```

3. **Validate input data:**

   - Are values in reasonable ranges?
   - Any missing or zero values?
   - Any extreme outliers?

4. **Compare with rule-based predictions:**

   - If both disagree significantly, investigate
   - Check feature importance (SHAP values)

5. **Retrain model if needed:**
   ```bash
   cd ml
   python train_new.py
   ```

---

### Issue 8: Environment Variables Not Loading

**Symptoms:**

- ML API URL is undefined
- Backend tries to connect to wrong URL
- "Cannot read environment variable" errors

**Solutions:**

1. **Verify .env files exist:**

   ```bash
   # Check these exist:
   backend/.env
   frontend2/frontend/.env
   ```

2. **Check .env file format:**

   ```env
   # No quotes needed
   ML_API_URL=http://localhost:5000

   # Not like this
   ML_API_URL="http://localhost:5000"
   ```

3. **Restart services after changing .env:**

   ```bash
   # Stop all services (Ctrl+C)
   # Start again
   start-all.bat
   ```

4. **Use full URLs including protocol:**

   ```env
   # Good
   ML_API_URL=http://localhost:5000

   # Bad
   ML_API_URL=localhost:5000
   ```

---

### Issue 9: Services Start But Don't Communicate

**Symptoms:**

- All services running
- Health checks pass individually
- Integration fails

**Solutions:**

1. **Test each service individually:**

   ```bash
   # ML API
   curl http://localhost:5000/health

   # Backend
   curl http://localhost:8000/api/v1/healthcheck

   # Frontend
   curl http://localhost:5173
   ```

2. **Test connectivity between services:**

   ```bash
   # From backend container/server, test ML API
   curl http://localhost:5000/health
   ```

3. **Check network configuration:**

   - Docker networks (if using containers)
   - VPN interference
   - Proxy settings

4. **Verify ports are accessible:**
   ```bash
   telnet localhost 5000
   telnet localhost 8000
   ```

---

### Issue 10: Integration Test Fails

**Symptoms:**

- `test_ml_integration.py` shows failures
- One or more tests don't pass

**Solutions:**

1. **Run tests individually to isolate issue:**

   ```python
   # Modify test_ml_integration.py
   # Comment out all but one test
   ```

2. **Check which test fails:**

   - `test_ml_health` → ML API not running
   - `test_ml_predict` → ML API broken
   - `test_backend_health` → Backend not running
   - `test_backend_predict` → Integration broken

3. **Read detailed error messages:**

   ```bash
   python test_ml_integration.py 2>&1 | tee test_log.txt
   ```

4. **Verify all services are running before testing:**

   ```bash
   # Start all
   start-all.bat

   # Wait 10 seconds
   timeout /t 10

   # Run tests
   python test_ml_integration.py
   ```

---

## Debugging Commands

### Check Service Status

```bash
# Windows
netstat -ano | findstr "5000 8000 5173"

# Linux/Mac
lsof -i :5000 -i :8000 -i :5173
```

### View Service Logs

```bash
# ML API logs (if running)
# Check terminal where ML API is running

# Backend logs
cd backend
npm run dev

# Frontend logs
cd frontend2/frontend
npm run dev
```

### Test Individual Components

```bash
# Test ML API directly
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"features": {"glucose": 120, "hba1c": 5.8, ...}}'

# Test Backend prediction
curl -X POST http://localhost:8000/api/v1/patients/predict \
  -H "Content-Type: application/json" \
  -d '{"clinicalData": {...}, "useMLModel": true}'
```

### Check Dependencies

```bash
# Backend
cd backend
npm list

# Frontend
cd frontend2/frontend
npm list

# ML API
cd ml
pip list
```

---

## Error Message Reference

| Error Message                  | Cause               | Solution                    |
| ------------------------------ | ------------------- | --------------------------- |
| `ECONNREFUSED`                 | Service not running | Start the service           |
| `CORS policy blocked`          | CORS misconfigured  | Check CORS middleware       |
| `422 Unprocessable Entity`     | Invalid input       | Check feature format        |
| `Request timeout`              | Slow ML processing  | Increase timeout            |
| `Module not found`             | Missing dependency  | Install packages            |
| `Port already in use`          | Port conflict       | Change port or kill process |
| `ML service is not responding` | ML API down         | Start ML API                |
| `Cannot read property`         | Missing data        | Check request format        |

---

## Quick Diagnostic Script

Create `diagnose.bat` (Windows) or `diagnose.sh` (Linux/Mac):

```bash
@echo off
echo === MediGuard Diagnostic Tool ===
echo.

echo Checking ML API...
curl -s http://localhost:5000/health
echo.

echo Checking Backend API...
curl -s http://localhost:8000/api/v1/healthcheck
echo.

echo Checking Frontend...
curl -s http://localhost:5173
echo.

echo Checking ports...
netstat -ano | findstr "5000 8000 5173"
echo.

echo Done!
pause
```

Run: `diagnose.bat`

---

## Getting Help

If issues persist:

1. **Check logs in order:**

   - ML API logs first
   - Backend logs second
   - Frontend console last

2. **Verify setup:**

   - Review `INTEGRATION_CHECKLIST.md`
   - Compare with `ARCHITECTURE.md`

3. **Use test script:**

   ```bash
   python test_ml_integration.py
   ```

4. **Check documentation:**

   - `ML_API_INTEGRATION.md` - Full guide
   - `ML_API_QUICKREF.md` - Quick reference
   - `ARCHITECTURE.md` - System design

5. **Review code:**
   - `backend/src/services/mlApi.service.js`
   - `backend/src/controllers/patient.controller.js`
   - `frontend2/frontend/src/services/api.js`

---

**Last Updated**: November 23, 2025  
**Version**: 1.0.0
