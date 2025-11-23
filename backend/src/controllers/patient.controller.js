import Patient from "../models/patient.model.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { normalizeAllParameters } from "../utils/scalingBridge.js";
import { generatePredictions } from "../utils/predictionEngine.js";
import {
  getMLPredictions,
  getCombinedPredictions,
} from "../services/mlApi.service.js";

// @desc    Save a new patient analysis
// @route   POST /api/patients
const createPatientRecord = asyncHandler(async (req, res) => {
  const {
    fullname,
    age,
    gender,
    bloodGroup,
    mobile,
    clinicalData,
    predictions,
  } = req.body;

  if (!fullname || !age || !gender || !bloodGroup || !mobile) {
    throw new ApiError(400, "Please provide all required demographic fields");
  }

  if (!clinicalData) {
    throw new ApiError(400, "Clinical data is required");
  }

  const record = await Patient.create({
    fullname,
    age,
    gender,
    bloodGroup,
    mobile,
    clinicalData,
    predictions: predictions || [],
  });

  return res
    .status(201)
    .json(new ApiResponse(201, record, "Patient record created successfully"));
});

// @desc    Get all patient records (Latest first)
// @route   GET /api/patients
const getPatientRecords = asyncHandler(async (req, res) => {
  const records = await Patient.find().sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(200, records, "Patient records retrieved successfully")
    );
});

// @desc    Get single patient record by ID
// @route   GET /api/patients/:id
const getPatientById = asyncHandler(async (req, res) => {
  const record = await Patient.findById(req.params.id);

  if (!record) {
    throw new ApiError(404, "Patient record not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, record, "Patient record retrieved successfully")
    );
});

// @desc    Generate disease predictions from clinical data
// @route   POST /api/patients/predict
const predictDiseases = asyncHandler(async (req, res) => {
  const { clinicalData, useMLModel = true } = req.body;

  if (!clinicalData) {
    throw new ApiError(400, "Clinical data is required for prediction");
  }

  // Normalize the data using scaling bridge
  const { normalizedData, binaryStatuses, abnormalParameters } =
    normalizeAllParameters(clinicalData);

  // Generate rule-based disease predictions
  const ruleBased = generatePredictions(clinicalData);

  // Initialize response object
  const response = {
    predictions: ruleBased,
    normalizedData,
    binaryStatuses,
    abnormalParameters,
    summary: {
      totalPredictions: ruleBased.length,
      highRiskDiseases: ruleBased.filter((p) => p.probability > 70).length,
      moderateRiskDiseases: ruleBased.filter(
        (p) => p.probability >= 40 && p.probability <= 70
      ).length,
      abnormalParameterCount: abnormalParameters.length,
    },
  };

  // Get ML model predictions if requested
  if (useMLModel) {
    try {
      const mlResult = await getCombinedPredictions(clinicalData);
      response.mlPrediction = mlResult.mlModel;
      response.mlTimestamp = mlResult.timestamp;

      if (mlResult.error) {
        console.warn("[Prediction] ML API error:", mlResult.error);
        response.mlError = mlResult.error;
      }
    } catch (error) {
      console.error(
        "[Prediction] Failed to get ML predictions:",
        error.message
      );
      response.mlError = error.message;
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, response, "Predictions generated successfully"));
});

// @desc    Update patient record by ID
// @route   PATCH /api/patients/:id
const updatePatientRecord = asyncHandler(async (req, res) => {
  const { fullname, age, gender, bloodGroup, mobile, clinicalData } = req.body;

  const record = await Patient.findById(req.params.id);

  if (!record) {
    throw new ApiError(404, "Patient record not found");
  }

  // Update only provided fields
  if (fullname !== undefined) record.fullname = fullname;
  if (age !== undefined) record.age = age;
  if (gender !== undefined) record.gender = gender;
  if (bloodGroup !== undefined) record.bloodGroup = bloodGroup;
  if (mobile !== undefined) record.mobile = mobile;
  if (clinicalData !== undefined) record.clinicalData = clinicalData;

  await record.save();

  return res
    .status(200)
    .json(new ApiResponse(200, record, "Patient record updated successfully"));
});

// @desc    Delete (soft delete) patient record by ID
// @route   DELETE /api/patients/:id
const deletePatientRecord = asyncHandler(async (req, res) => {
  const record = await Patient.findById(req.params.id);

  if (!record) {
    throw new ApiError(404, "Patient record not found");
  }

  await Patient.findByIdAndDelete(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Patient record deleted successfully"));
});

export {
  createPatientRecord,
  getPatientRecords,
  getPatientById,
  predictDiseases,
  updatePatientRecord,
  deletePatientRecord,
};
