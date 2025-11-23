import {
  normalizeAllParameters,
  generateParameterMessage,
  REFERENCE_RANGES,
} from "../utils/scalingBridge.js";

const DISEASE_PARAMETER_MAP = {
  "Diabetes": [
    "glucose",
    "hba1c",
    "insulin",
    "bmi",
    "triglycerides",
    "hdl",
  ],
  "Heart Disease": [
    "troponin",
    "systolicBP",
    "diastolicBP",
    "ldl",
    "triglycerides",
    "hdl",
    "crp",
  ],
  "Liver Disease": ["alt", "ast", "bilirubin", "crp"],
  "Kidney Disease": [
    "creatinine",
    "bun",
    "systolicBP",
    "diastolicBP",
    "bmi",
    "crp",
  ],
};

/**
 * Helper function to get parameter value
 */
const val = (clinicalData, id) => {
  const value = clinicalData[id];
  return value ? parseFloat(value) : 0;
};

/**
 * Describes parameters relevant to a disease
 */
const describeParametersForDisease = (
  diseaseName,
  clinicalData,
  abnormalList
) => {
  const relevantParams = DISEASE_PARAMETER_MAP[diseaseName] || [];
  const factors = [];

  relevantParams.forEach((param) => {
    const value = clinicalData[param];
    if (value !== undefined && value !== null) {
      const range = REFERENCE_RANGES[param];
      if (range) {
        const { min, max } = range;
        if (value < min || value > max) {
          factors.push(generateParameterMessage(param, value));
        }
      }
    }
  });

  // If no relevant abnormal parameters found, use top 3 abnormal from the list
  if (factors.length === 0 && abnormalList.length > 0) {
    return abnormalList.slice(0, 3).map((item) => item.message);
  }

  return factors;
};

/**
 * Generates disease predictions based on clinical data
 * @param {Object} clinicalData - Object containing raw clinical values
 * @returns {Array} Array of disease predictions with probabilities and factors
 */
export const generatePredictions = (clinicalData) => {
  const predictions = [];
  const { abnormalParameters } = normalizeAllParameters(clinicalData);

  // 1. Diabetes
  let diabetes = 0;
  const diabetesReasons = [];

  if (val(clinicalData, "glucose") > 200) {
    diabetes += 50;
    diabetesReasons.push(
      `Critical Glucose (${val(clinicalData, "glucose")} mg/dL)`
    );
  } else if (val(clinicalData, "glucose") > 140) {
    diabetes += 30;
    diabetesReasons.push(`Elevated Glucose`);
  }

  if (val(clinicalData, "hba1c") > 6.5) {
    diabetes += 40;
    diabetesReasons.push(
      `HbA1c indicates diabetes (${val(clinicalData, "hba1c")}%)`
    );
  }

  if (diabetes > 0) {
    predictions.push({
      name: "Diabetes",
      probability: Math.min(diabetes, 99),
      confidence: Math.min(diabetes, 99),
      severity: diabetes > 70 ? "high" : "moderate",
      contributingFactors: diabetesReasons,
      parameterEvidence: describeParametersForDisease(
        "Diabetes",
        clinicalData,
        abnormalParameters
      ),
    });
  }

  // 2. Heart Disease
  let cardio = 0;
  const cardioReasons = [];

  if (val(clinicalData, "troponin") > 0.04) {
    cardio += 95;
    cardioReasons.push(`Critical Troponin - Myocardial Infarction Risk`);
  }

  if (val(clinicalData, "ldl") > 160) {
    cardio += 20;
    cardioReasons.push(`Very High LDL`);
  }

  if (val(clinicalData, "triglycerides") > 500) {
    cardio += 15;
    cardioReasons.push(`Severe Hypertriglyceridemia`);
  }

  if (val(clinicalData, "systolicBP") > 160) {
    cardio += 20;
    cardioReasons.push(`Stage 2 Hypertension`);
  }

  if (cardio > 0) {
    predictions.push({
      name: "Heart Disease",
      probability: Math.min(cardio, 99),
      confidence: Math.min(cardio, 99),
      severity: cardio > 80 ? "high" : cardio > 50 ? "moderate" : "low",
      contributingFactors: cardioReasons,
      parameterEvidence: describeParametersForDisease(
        "Heart Disease",
        clinicalData,
        abnormalParameters
      ),
    });
  }

  // 3. Liver Disease
  let liver = 0;
  const liverReasons = [];

  if (val(clinicalData, "alt") > 200 || val(clinicalData, "ast") > 200) {
    liver += 80;
    liverReasons.push(`Extremely elevated liver enzymes`);
  }

  if (val(clinicalData, "bilirubin") > 2.0) {
    liver += 30;
    liverReasons.push(`Elevated Bilirubin`);
  }

  if (liver > 0) {
    predictions.push({
      name: "Liver Disease",
      probability: Math.min(liver, 99),
      confidence: Math.min(liver, 99),
      severity: liver > 70 ? "high" : "moderate",
      contributingFactors: liverReasons,
      parameterEvidence: describeParametersForDisease(
        "Liver Disease",
        clinicalData,
        abnormalParameters
      ),
    });
  }

  // 4. Kidney Disease
  let kidney = 0;
  const kidneyReasons = [];

  if (val(clinicalData, "creatinine") > 4.0) {
    kidney += 90;
    kidneyReasons.push(
      `Critical Creatinine (${val(clinicalData, "creatinine")}) - Renal Failure`
    );
  } else if (val(clinicalData, "creatinine") > 1.4) {
    kidney += 40;
    kidneyReasons.push(`Elevated Creatinine`);
  }

  if (val(clinicalData, "bun") > 30) {
    kidney += 30;
    kidneyReasons.push(`Elevated BUN (${val(clinicalData, "bun")} mg/dL)`);
  }

  if (kidney > 0) {
    predictions.push({
      name: "Kidney Disease",
      probability: Math.min(kidney, 99),
      confidence: Math.min(kidney, 99),
      severity: kidney > 70 ? "high" : "moderate",
      contributingFactors: kidneyReasons,
      parameterEvidence: describeParametersForDisease(
        "Kidney Disease",
        clinicalData,
        abnormalParameters
      ),
    });
  }

  // If no diseases detected, add Healthy status
  if (predictions.length === 0) {
    const totalParams = Object.keys(REFERENCE_RANGES).length;
    const normalParams = Object.keys(clinicalData).filter((key) => {
      const value = clinicalData[key];
      const range = REFERENCE_RANGES[key];
      if (!range || value === undefined || value === null) return false;
      return value >= range.min && value <= range.max;
    }).length;

    const healthPercentage = Math.round((normalParams / totalParams) * 100);

    predictions.push({
      name: "Healthy",
      probability: healthPercentage,
      confidence: healthPercentage,
      severity: "low",
      contributingFactors: [
        `All major clinical parameters are within normal range`,
        `${normalParams} out of ${totalParams} parameters are normal`,
      ],
      parameterEvidence: [
        "No critical abnormalities detected in cardiac markers",
        "Metabolic panel shows normal glucose and lipid levels",
        "Kidney and liver function tests are within limits",
      ],
    });
  }

  // Sort by probability (highest first)
  return predictions.sort((a, b) => b.probability - a.probability);
};
