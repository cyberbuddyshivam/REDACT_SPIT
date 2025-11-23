"""
Test script to verify ML API integration with backend and frontend
"""

import requests
import json
import sys

# Configuration
ML_API_URL = "http://localhost:5000"
BACKEND_API_URL = "http://localhost:8000/api/v1"

# Sample clinical data
SAMPLE_DATA = {
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

def test_ml_health():
    """Test ML API health endpoint"""
    print("\n🔍 Testing ML API Health...")
    try:
        response = requests.get(f"{ML_API_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ ML API is healthy")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ ML API returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to connect to ML API: {e}")
        return False

def test_ml_predict():
    """Test ML API prediction endpoint"""
    print("\n🧠 Testing ML API Prediction...")
    try:
        response = requests.post(
            f"{ML_API_URL}/predict",
            json={"features": SAMPLE_DATA},
            timeout=30
        )
        if response.status_code == 200:
            result = response.json()
            print("✅ ML API prediction successful")
            print(f"   Predicted: {result['prediction']['label']}")
            print(f"   Probabilities: {json.dumps(result['probabilities'], indent=2)}")
            return True
        else:
            print(f"❌ ML API returned status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to get ML prediction: {e}")
        return False

def test_backend_health():
    """Test Backend API health endpoint"""
    print("\n🔍 Testing Backend API Health...")
    try:
        response = requests.get(f"{BACKEND_API_URL}/healthcheck", timeout=5)
        if response.status_code == 200:
            print("✅ Backend API is healthy")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Backend API returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to connect to Backend API: {e}")
        return False

def test_backend_predict():
    """Test Backend API prediction endpoint (includes ML)"""
    print("\n🎯 Testing Backend Prediction (with ML integration)...")
    try:
        response = requests.post(
            f"{BACKEND_API_URL}/patients/predict",
            json={
                "clinicalData": SAMPLE_DATA,
                "useMLModel": True
            },
            timeout=30
        )
        if response.status_code == 200:
            result = response.json()
            print("✅ Backend prediction successful")
            
            # Check rule-based predictions
            if "data" in result and "predictions" in result["data"]:
                print(f"   Rule-based predictions: {len(result['data']['predictions'])} diseases")
                for pred in result['data']['predictions'][:3]:
                    print(f"      - {pred['name']}: {pred['probability']}%")
            
            # Check ML predictions
            if "data" in result and "mlPrediction" in result["data"]:
                ml_pred = result['data']['mlPrediction']
                if ml_pred:
                    print(f"   ML Prediction: {ml_pred['prediction']['label']}")
                    print(f"   ML Probabilities: {json.dumps(ml_pred['probabilities'], indent=2)}")
                else:
                    print("   ⚠️  ML prediction not available")
            
            # Check for errors
            if "data" in result and "mlError" in result["data"]:
                print(f"   ⚠️  ML Error: {result['data']['mlError']}")
            
            return True
        else:
            print(f"❌ Backend API returned status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to get backend prediction: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("🧪 MediGuard ML Integration Test Suite")
    print("=" * 60)
    
    results = {}
    
    # Test ML API
    results['ml_health'] = test_ml_health()
    results['ml_predict'] = test_ml_predict()
    
    # Test Backend API
    results['backend_health'] = test_backend_health()
    results['backend_predict'] = test_backend_predict()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)
    
    all_passed = True
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name.replace('_', ' ').title()}")
        if not passed:
            all_passed = False
    
    print("=" * 60)
    
    if all_passed:
        print("\n🎉 All tests passed! ML API is properly integrated.")
        return 0
    else:
        print("\n⚠️  Some tests failed. Check the logs above for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
