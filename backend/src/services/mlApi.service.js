import axios from "axios";

// ML API configuration
const ML_API_BASE_URL = process.env.ML_API_URL || "http://localhost:5000";
const ML_API_TIMEOUT = 30000; // 30 seconds for ML predictions

// Create axios instance for ML API
const mlApiClient = axios.create({
  baseURL: ML_API_BASE_URL,
  timeout: ML_API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
mlApiClient.interceptors.request.use(
  (config) => {
    console.log(`[ML API] ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("[ML API] Request error:", error.message);
    return Promise.reject(error);
  }
);

// Response interceptor
mlApiClient.interceptors.response.use(
  (response) => {
    console.log(`[ML API] Success: ${response.config.url}`);
    return response.data;
  },
  (error) => {
    if (error.response) {
      console.error(
        `[ML API] Error ${error.response.status}:`,
        error.response.data
      );
      throw new Error(error.response.data?.detail || "ML API request failed");
    } else if (error.request) {
      console.error("[ML API] No response from ML service");
      throw new Error(
        "ML service is not responding. Please ensure the ML API is running."
      );
    } else {
      console.error("[ML API] Request setup error:", error.message);
      throw new Error(error.message);
    }
  }
);

/**
 * Check ML API health status
 * @returns {Promise<Object>} Health status
 */
export const checkMLHealth = async () => {
  try {
    const response = await mlApiClient.get("/health");
    return { status: "ok", data: response };
  } catch (error) {
    return { status: "error", message: error.message };
  }
};

/**
 * Get disease predictions from ML model
 * @param {Object} features - Clinical parameters (24 features)
 * @returns {Promise<Object>} Prediction results with probabilities, scaled values, and SHAP values
 */
export const getMLPredictions = async (features) => {
  try {
    // Validate that features object is not empty
    if (!features || Object.keys(features).length === 0) {
      throw new Error("Features object cannot be empty");
    }

    // Mapping from frontend keys (lowercase) to ML API keys (capitalized)
    const featureMapping = {
      bmi: "BMI",
      glucose: "Glucose",
      hba1c: "HbA1c",
      insulin: "Insulin",
      cholesterol: "Cholesterol",
      ldl: "LDL",
      hdl: "HDL",
      triglycerides: "Triglycerides",
      troponin: "Troponin",
      alt: "ALT",
      ast: "AST",
      bilirubin: "Bilirubin",
      creatinine: "Creatinine",
      bun: "BUN",
      crp: "CRP",
      hemoglobin: "Hemoglobin",
      hematocrit: "Hematocrit",
      rbc: "RBC",
      mcv: "MCV",
      wbc: "WBC",
      platelets: "Platelets",
      systolicBP: "SystolicBP",
      diastolicBP: "DiastolicBP",
      cholesterolHDLRatio: "Cholesterol_HDL_Ratio",
    };

    // Convert all feature values to floats and map keys to ML API format
    const processedFeatures = {};
    for (const [key, value] of Object.entries(features)) {
      const mlKey = featureMapping[key] || key;
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        console.warn(`[ML API] Invalid value for ${key}: ${value}, using 0`);
        processedFeatures[mlKey] = 0.0;
      } else {
        processedFeatures[mlKey] = numValue;
      }
    }

    console.log("[ML API] Sending features:", Object.keys(processedFeatures));

    const response = await mlApiClient.post("/predict", {
      features: processedFeatures,
    });

    return response;
  } catch (error) {
    console.error("[ML API] Prediction error:", error.message);
    throw error;
  }
};

/**
 * Get both rule-based and ML predictions
 * @param {Object} clinicalData - Raw clinical parameters
 * @returns {Promise<Object>} Combined predictions from both engines
 */
export const getCombinedPredictions = async (clinicalData) => {
  try {
    const mlPrediction = await getMLPredictions(clinicalData);
    return {
      mlModel: mlPrediction,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[ML API] Combined prediction error:", error.message);
    // Return null for ML prediction if it fails
    return {
      mlModel: null,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

export default {
  checkMLHealth,
  getMLPredictions,
  getCombinedPredictions,
};
