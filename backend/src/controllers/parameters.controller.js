import Parameter from "../models/parameters.model.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

// @desc    Save user-inputted clinical parameters
// @route   POST /api/parameters
const saveParameters = asyncHandler(async (req, res) => {
  const { patientId, parameters } = req.body;

  if (!parameters || typeof parameters !== "object") {
    throw new ApiError(400, "Parameters object is required");
  }

  // Create a new parameter record for the patient
  const parameterRecord = await Parameter.create({
    patientId: patientId || null,
    parameters,
    timestamp: new Date(),
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        parameterRecord,
        "Clinical parameters saved successfully"
      )
    );
});

// @desc    Get all parameter records
// @route   GET /api/parameters
const getAllParameters = asyncHandler(async (req, res) => {
  const records = await Parameter.find()
    .populate("patientId", "fullname age gender")
    .sort({ timestamp: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(200, records, "Parameter records retrieved successfully")
    );
});

// @desc    Get parameter records by patient ID
// @route   GET /api/parameters/patient/:patientId
const getParametersByPatient = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  const records = await Parameter.find({ patientId }).sort({ timestamp: -1 });

  if (!records || records.length === 0) {
    throw new ApiError(404, "No parameter records found for this patient");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        records,
        "Patient parameter records retrieved successfully"
      )
    );
});

// @desc    Get single parameter record by ID
// @route   GET /api/parameters/:id
const getParameterById = asyncHandler(async (req, res) => {
  const record = await Parameter.findById(req.params.id).populate(
    "patientId",
    "fullname age gender"
  );

  if (!record) {
    throw new ApiError(404, "Parameter record not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, record, "Parameter record retrieved successfully")
    );
});

// @desc    Update parameter record
// @route   PATCH /api/parameters/:id
const updateParameters = asyncHandler(async (req, res) => {
  const { parameters } = req.body;

  const record = await Parameter.findById(req.params.id);

  if (!record) {
    throw new ApiError(404, "Parameter record not found");
  }

  if (parameters) {
    record.parameters = { ...record.parameters, ...parameters };
  }

  record.updatedAt = Date.now();
  await record.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, record, "Parameter record updated successfully")
    );
});

// @desc    Delete parameter record
// @route   DELETE /api/parameters/:id
const deleteParameters = asyncHandler(async (req, res) => {
  const record = await Parameter.findById(req.params.id);

  if (!record) {
    throw new ApiError(404, "Parameter record not found");
  }

  await Parameter.findByIdAndDelete(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Parameter record deleted successfully"));
});

// @desc    Batch save multiple parameter sets
// @route   POST /api/parameters/batch
const batchSaveParameters = asyncHandler(async (req, res) => {
  const { parameterSets } = req.body;

  if (!Array.isArray(parameterSets) || parameterSets.length === 0) {
    throw new ApiError(400, "parameterSets array is required");
  }

  const savedRecords = await Parameter.insertMany(
    parameterSets.map((set) => ({
      patientId: set.patientId || null,
      parameters: set.parameters,
      timestamp: new Date(),
    }))
  );

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        savedRecords,
        `${savedRecords.length} parameter records saved successfully`
      )
    );
});

export {
  saveParameters,
  getAllParameters,
  getParametersByPatient,
  getParameterById,
  updateParameters,
  deleteParameters,
  batchSaveParameters,
};
