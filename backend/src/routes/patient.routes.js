import { Router } from "express";
import {
  createPatientRecord,
  getPatientRecords,
  getPatientById,
  predictDiseases,
  updatePatientRecord,
  deletePatientRecord,
} from "../controllers/patient.controller.js";
import {
  validatePatientDemographics,
  validateClinicalDataMiddleware,
  validateObjectId,
  validatePredictionData,
} from "../middlewares/validation.middleware.js";
import {
  generalLimiter,
  predictionLimiter,
  readLimiter,
} from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.post(
  "/patients",
  generalLimiter,
  validatePatientDemographics,
  validateClinicalDataMiddleware,
  createPatientRecord
);
router.get("/patients", readLimiter, getPatientRecords);
router.get("/patients/:id", readLimiter, validateObjectId, getPatientById);
router.patch(
  "/patients/:id",
  generalLimiter,
  validateObjectId,
  updatePatientRecord
);
router.delete(
  "/patients/:id",
  generalLimiter,
  validateObjectId,
  deletePatientRecord
);
router.post(
  "/patients/predict",
  predictionLimiter,
  validatePredictionData,
  predictDiseases
);

export default router;
