import axios from "axios";

// Base API URL - can be configured via environment variable
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

// ML API URL - direct connection to ML service (optional)
const ML_API_BASE_URL =
  import.meta.env.VITE_ML_API_URL || "http://localhost:5000";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // 15 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Create axios instance for direct ML API calls (optional)
const mlApiClient = axios.create({
  baseURL: ML_API_BASE_URL,
  timeout: 30000, // 30 seconds for ML predictions
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - can add auth tokens here later
apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp for debugging
    config.metadata = { startTime: new Date() };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    // Log response time in development
    if (import.meta.env.DEV) {
      const duration = new Date() - response.config.metadata.startTime;
      console.log(
        `[API] ${response.config.method.toUpperCase()} ${
          response.config.url
        } - ${duration}ms`
      );
    }
    return response.data;
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.message || "An error occurred";
      console.error("[API Error]", errorMessage, error.response.data);
      throw new Error(errorMessage);
    } else if (error.request) {
      // Request made but no response received
      console.error("[API Error] No response from server");
      throw new Error(
        "Cannot connect to server. Please check your internet connection."
      );
    } else {
      // Error in request setup
      console.error("[API Error]", error.message);
      throw new Error(error.message);
    }
  }
);

// ML API interceptors
mlApiClient.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: new Date() };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

mlApiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      const duration = new Date() - response.config.metadata.startTime;
      console.log(`[ML API] ${response.config.url} - ${duration}ms`);
    }
    return response.data;
  },
  (error) => {
    if (error.response) {
      console.error("[ML API Error]", error.response.data);
      throw new Error(error.response.data?.detail || "ML API error");
    } else if (error.request) {
      console.error("[ML API Error] No response from ML service");
      throw new Error("ML service is not responding");
    } else {
      console.error("[ML API Error]", error.message);
      throw new Error(error.message);
    }
  }
);

// ===========================
// PATIENT ENDPOINTS
// ===========================

/**
 * Create a new patient record
 * @param {Object} patientData - { fullname, age, gender, bloodGroup, mobile, clinicalData }
 * @returns {Promise} Response with created patient record
 */
export const createPatient = async (patientData) => {
  return await apiClient.post("/patients", patientData);
};

/**
 * Get all patient records
 * @returns {Promise} Response with array of patient records
 */
export const getAllPatients = async () => {
  return await apiClient.get("/patients");
};

/**
 * Get a single patient by ID
 * @param {string} id - Patient ID
 * @returns {Promise} Response with patient record
 */
export const getPatientById = async (id) => {
  return await apiClient.get(`/patients/${id}`);
};

/**
 * Update patient record
 * @param {string} id - Patient ID
 * @param {Object} updates - Fields to update
 * @returns {Promise} Response with updated patient record
 */
export const updatePatient = async (id, updates) => {
  return await apiClient.patch(`/patients/${id}`, updates);
};

/**
 * Delete patient record
 * @param {string} id - Patient ID
 * @returns {Promise} Response with success message
 */
export const deletePatient = async (id) => {
  return await apiClient.delete(`/patients/${id}`);
};

// ===========================
// PREDICTION ENDPOINTS
// ===========================

/**
 * Get disease predictions from clinical data (via backend - includes both rule-based and ML)
 * @param {Object} clinicalData - Object with 24 clinical parameters
 * @param {boolean} useMLModel - Whether to include ML model predictions (default: true)
 * @returns {Promise} Response with predictions, normalized data, abnormal parameters, and ML predictions
 */
export const getPredictions = async (clinicalData, useMLModel = true) => {
  return await apiClient.post("/patients/predict", {
    clinicalData,
    useMLModel,
  });
};

/**
 * Get ML predictions directly from ML API (bypasses backend)
 * @param {Object} features - Clinical parameters as key-value pairs
 * @returns {Promise} Response with ML model predictions, probabilities, scaled values, and SHAP values
 */
export const getMLPredictions = async (features) => {
  return await mlApiClient.post("/predict", { features });
};

/**
 * Check ML API health status
 * @returns {Promise} Health status of ML service
 */
export const checkMLHealth = async () => {
  try {
    return await mlApiClient.get("/health");
  } catch (error) {
    console.error("ML health check failed:", error.message);
    return { status: "error", message: error.message };
  }
};

// ===========================
// PARAMETERS ENDPOINTS
// ===========================

/**
 * Save clinical parameters (user input)
 * @param {Object} data - { patientId (optional), parameters }
 * @returns {Promise} Response with saved parameter record
 */
export const saveParameters = async (data) => {
  return await apiClient.post("/parameters", data);
};

/**
 * Get all parameter records
 * @returns {Promise} Response with array of parameter records
 */
export const getAllParameters = async () => {
  return await apiClient.get("/parameters");
};

/**
 * Get parameters by patient ID
 * @param {string} patientId - Patient ID
 * @returns {Promise} Response with array of parameter records
 */
export const getParametersByPatient = async (patientId) => {
  return await apiClient.get(`/parameters/patient/${patientId}`);
};

/**
 * Get single parameter record by ID
 * @param {string} id - Parameter record ID
 * @returns {Promise} Response with parameter record
 */
export const getParameterById = async (id) => {
  return await apiClient.get(`/parameters/${id}`);
};

/**
 * Update parameter record
 * @param {string} id - Parameter record ID
 * @param {Object} parameters - Updated parameters
 * @returns {Promise} Response with updated parameter record
 */
export const updateParameterRecord = async (id, parameters) => {
  return await apiClient.patch(`/parameters/${id}`, { parameters });
};

/**
 * Delete parameter record
 * @param {string} id - Parameter record ID
 * @returns {Promise} Response with success message
 */
export const deleteParameterRecord = async (id) => {
  return await apiClient.delete(`/parameters/${id}`);
};

/**
 * Batch save multiple parameter sets
 * @param {Array} parameterSets - Array of { patientId, parameters }
 * @returns {Promise} Response with saved parameter records
 */
export const batchSaveParameters = async (parameterSets) => {
  return await apiClient.post("/parameters/batch", { parameterSets });
};

// ===========================
// HEALTH CHECK
// ===========================

/**
 * Check if backend API is reachable
 * @returns {Promise} Response with health status
 */
export const healthCheck = async () => {
  return await apiClient.get("/healthcheck");
};

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Save patient and get predictions in one flow
 * @param {Object} demographics - Patient demographic data
 * @param {Object} clinicalData - Clinical parameters
 * @returns {Promise} Object with saved patient and predictions
 */
export const savePatientAndPredict = async (payload) => {
  const { clinicalData, ...demographics } = payload;

  if (!clinicalData || typeof clinicalData !== "object") {
    throw new Error("Clinical data is required to save patient details");
  }

  console.log("Fetching predictions for clinical data...");
  // Fetch predictions using the clinical data (includes both rule-based and ML)
  const predictionResponse = await getPredictions(clinicalData, true);
  console.log("Predictions received:", predictionResponse.data.predictions);

  // Extract ML prediction if available
  const mlPrediction = predictionResponse.data.mlPrediction || null;
  if (mlPrediction) {
    console.log("ML Model Prediction:", mlPrediction.prediction);
  }

  // Create patient record in database with predictions included
  const patientResponse = await createPatient({
    ...demographics,
    clinicalData,
    predictions: predictionResponse.data.predictions || [],
    mlPrediction: mlPrediction,
  });
  console.log("Patient saved:", patientResponse.data);

  // Save parameters separately for historical tracking
  try {
    const parametersToSave = {};
    Object.entries(clinicalData).forEach(([key, value]) => {
      if (value && value !== "") {
        parametersToSave[key] = parseFloat(value);
      }
    });

    if (Object.keys(parametersToSave).length > 0) {
      await saveParameters({
        patientId: patientResponse.data._id,
        parameters: parametersToSave,
      });
      console.log("Parameters saved for patient:", patientResponse.data._id);
    }
  } catch (error) {
    console.error("Failed to save parameters:", error.message);
    // Don't fail the whole operation if parameter saving fails
  }

  return {
    patient: patientResponse.data,
    predictions: predictionResponse.data,
  };
};

/**
 * Test backend connection
 * @returns {Promise<boolean>} True if backend is reachable
 */
export const testConnection = async () => {
  try {
    await healthCheck();
    return true;
  } catch (error) {
    return false;
  }
};

// Export API base URL for reference
export { API_BASE_URL, ML_API_BASE_URL };

export default apiClient;
