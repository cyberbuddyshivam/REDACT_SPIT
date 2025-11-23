import { ApiError } from "../utils/api-error.js";
import { validateClinicalData } from "../utils/scalingBridge.js";

/**
 * Validates patient demographics data
 */
export const validatePatientDemographics = (req, res, next) => {
  const { fullname, age, gender, bloodGroup, mobile } = req.body;

  // Check required fields
  if (!fullname || !age || !gender || !bloodGroup || !mobile) {
    throw new ApiError(400, "All demographic fields are required", [
      { field: "demographics", message: "fullname, age, gender, bloodGroup, and mobile are required" }
    ]);
  }

  // Validate age
  if (typeof age !== "number" || age < 0 || age > 150) {
    throw new ApiError(400, "Invalid age", [
      { field: "age", message: "Age must be a number between 0 and 150" }
    ]);
  }

  // Validate gender
  const validGenders = ["Male", "Female", "Other"];
  if (!validGenders.includes(gender)) {
    throw new ApiError(400, "Invalid gender", [
      { field: "gender", message: "Gender must be one of: Male, Female, Other" }
    ]);
  }

  // Validate blood group
  const validBloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  if (!validBloodGroups.includes(bloodGroup)) {
    throw new ApiError(400, "Invalid blood group", [
      { field: "bloodGroup", message: `Blood group must be one of: ${validBloodGroups.join(", ")}` }
    ]);
  }

  // Validate mobile number format
  const mobileRegex = /^\+?[1-9]\d{1,14}$/;
  if (!mobileRegex.test(mobile)) {
    throw new ApiError(400, "Invalid mobile number", [
      { field: "mobile", message: "Mobile number must be in valid international format" }
    ]);
  }

  next();
};

/**
 * Validates clinical data for all 24 parameters
 */
export const validateClinicalDataMiddleware = (req, res, next) => {
  const { clinicalData } = req.body;

  if (!clinicalData || typeof clinicalData !== "object") {
    throw new ApiError(400, "Clinical data is required and must be an object");
  }

  // Convert Map to object if needed
  const dataObject = clinicalData instanceof Map 
    ? Object.fromEntries(clinicalData) 
    : clinicalData;

  // Validate using scaling bridge utility
  const validation = validateClinicalData(dataObject);

  if (!validation.isValid) {
    const errors = [];

    if (validation.missingParameters.length > 0) {
      errors.push({
        field: "clinicalData",
        message: `Missing parameters: ${validation.missingParameters.join(", ")}`
      });
    }

    if (validation.invalidParameters.length > 0) {
      errors.push({
        field: "clinicalData",
        message: `Invalid parameters (must be numbers): ${validation.invalidParameters.join(", ")}`
      });
    }

    throw new ApiError(400, "Clinical data validation failed", errors);
  }

  next();
};

/**
 * Validates clinical data for prediction (allows partial data)
 */
export const validatePredictionData = (req, res, next) => {
  const { clinicalData } = req.body;

  if (!clinicalData || typeof clinicalData !== "object") {
    throw new ApiError(400, "Clinical data is required for prediction");
  }

  // Convert Map to object if needed
  const dataObject = clinicalData instanceof Map 
    ? Object.fromEntries(clinicalData) 
    : clinicalData;

  // Check that at least some parameters are present
  const providedParams = Object.keys(dataObject).filter(
    key => dataObject[key] !== null && dataObject[key] !== undefined
  );

  if (providedParams.length === 0) {
    throw new ApiError(400, "At least one clinical parameter must be provided");
  }

  // Validate that provided parameters are numbers
  const invalidParams = providedParams.filter(
    key => typeof dataObject[key] !== "number" || isNaN(dataObject[key])
  );

  if (invalidParams.length > 0) {
    throw new ApiError(400, "Invalid parameter values", [
      {
        field: "clinicalData",
        message: `The following parameters must be valid numbers: ${invalidParams.join(", ")}`
      }
    ]);
  }

  next();
};

/**
 * Validates MongoDB ObjectId format
 */
export const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  
  // MongoDB ObjectId is a 24-character hexadecimal string
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  
  if (!objectIdRegex.test(id)) {
    throw new ApiError(400, "Invalid patient ID format");
  }
  
  next();
};
