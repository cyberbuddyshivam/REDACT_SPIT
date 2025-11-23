import { Router } from "express";
import {
  saveParameters,
  getAllParameters,
  getParametersByPatient,
  getParameterById,
  updateParameters,
  deleteParameters,
  batchSaveParameters,
} from "../controllers/parameters.controller.js";
import { validateObjectId } from "../middlewares/validation.middleware.js";
import {
  generalLimiter,
  readLimiter,
} from "../middlewares/rateLimit.middleware.js";

const router = Router();

// Save single parameter set
router.post("/parameters", generalLimiter, saveParameters);

// Batch save multiple parameter sets
router.post("/parameters/batch", generalLimiter, batchSaveParameters);

// Get all parameter records
router.get("/parameters", readLimiter, getAllParameters);

// Get parameters by patient ID
router.get(
  "/parameters/patient/:patientId",
  readLimiter,
  validateObjectId,
  getParametersByPatient
);

// Get single parameter record
router.get("/parameters/:id", readLimiter, validateObjectId, getParameterById);

// Update parameter record
router.patch(
  "/parameters/:id",
  generalLimiter,
  validateObjectId,
  updateParameters
);

// Delete parameter record
router.delete(
  "/parameters/:id",
  generalLimiter,
  validateObjectId,
  deleteParameters
);

export default router;
