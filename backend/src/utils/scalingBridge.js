// Reference ranges for all 24 clinical parameters
export const REFERENCE_RANGES = {
  bmi: { min: 18.5, max: 24.9, unit: "kg/m²", category: "Vitals" },
  glucose: { min: 70, max: 140, unit: "mg/dL", category: "Metabolic" },
  hba1c: { min: 0, max: 5.7, unit: "%", category: "Metabolic" },
  insulin: { min: 2.6, max: 24.9, unit: "µIU/mL", category: "Metabolic" },
  cholesterol: { min: 125, max: 200, unit: "mg/dL", category: "Lipid Profile" },
  ldl: { min: 0, max: 100, unit: "mg/dL", category: "Lipid Profile" },
  hdl: { min: 40, max: 60, unit: "mg/dL", category: "Lipid Profile" },
  triglycerides: { min: 0, max: 150, unit: "mg/dL", category: "Lipid Profile" },
  troponin: { min: 0, max: 0.04, unit: "ng/mL", category: "Cardiac Marker" },
  alt: { min: 7, max: 56, unit: "U/L", category: "Liver" },
  ast: { min: 8, max: 48, unit: "U/L", category: "Liver" },
  bilirubin: { min: 0.1, max: 1.2, unit: "mg/dL", category: "Liver" },
  creatinine: { min: 0.7, max: 1.3, unit: "mg/dL", category: "Kidney" },
  bun: { min: 7, max: 20, unit: "mg/dL", category: "Kidney" },
  crp: { min: 0, max: 10, unit: "mg/L", category: "Inflammation" },
  hemoglobin: { min: 13.5, max: 17.5, unit: "g/dL", category: "Blood Count" },
  hematocrit: { min: 41, max: 50, unit: "%", category: "Blood Count" },
  rbc: { min: 4.5, max: 5.9, unit: "10^12/L", category: "Blood Count" },
  mcv: { min: 80, max: 100, unit: "fL", category: "Blood Indices" },
  wbc: { min: 4.5, max: 11.0, unit: "10^9/L", category: "Blood Count" },
  platelets: { min: 150, max: 450, unit: "10^9/L", category: "Blood Count" },
  systolicBP: { min: 90, max: 120, unit: "mmHg", category: "Cardio" },
  diastolicBP: { min: 60, max: 80, unit: "mmHg", category: "Cardio" },
  cholesterolHDLRatio: {
    min: 0,
    max: 5,
    unit: "ratio",
    category: "Lipid Profile",
  },
};

const STATUS_DESCRIPTION = {
  "critical-high": "critically high",
  "very-high": "very high",
  high: "high",
  "critical-low": "critically low",
  "very-low": "very low",
  low: "low",
  normal: "within range",
};

/**
 * Normalizes a parameter value to [0, 1] range using Min-Max scaling
 * @param {number} value - The raw clinical value
 * @param {string} parameterName - The name of the parameter
 * @returns {number} Normalized value between 0 and 1
 */
export const normalizeParameter = (value, parameterName) => {
  const range = REFERENCE_RANGES[parameterName];
  if (!range) {
    throw new Error(`Unknown parameter: ${parameterName}`);
  }

  const { min, max } = range;
  const normalized = (value - min) / (max - min);

  // Clamp to [0, 1] range
  return Math.max(0, Math.min(1, normalized));
};

/**
 * Returns binary classification (0 = normal, 1 = abnormal)
 * @param {number} value - The raw clinical value
 * @param {string} parameterName - The name of the parameter
 * @returns {number} 0 if within range, 1 if outside range
 */
export const getBinaryStatus = (value, parameterName) => {
  const range = REFERENCE_RANGES[parameterName];
  if (!range) {
    throw new Error(`Unknown parameter: ${parameterName}`);
  }

  const { min, max } = range;
  return value >= min && value <= max ? 0 : 1;
};

/**
 * Classifies the severity of abnormal values
 * @param {number} value - The raw clinical value
 * @param {string} parameterName - The name of the parameter
 * @returns {Object} Object containing status, severity level, and description
 */
export const classifySeverity = (value, parameterName) => {
  const range = REFERENCE_RANGES[parameterName];
  if (!range) {
    throw new Error(`Unknown parameter: ${parameterName}`);
  }

  const { min, max } = range;

  if (value > max) {
    const diffRatio = (value - max) / max;
    if (diffRatio > 0.5) {
      return {
        status: "critical-high",
        severity: 3,
        description: STATUS_DESCRIPTION["critical-high"],
      };
    }
    if (diffRatio > 0.2) {
      return {
        status: "very-high",
        severity: 2,
        description: STATUS_DESCRIPTION["very-high"],
      };
    }
    return {
      status: "high",
      severity: 1,
      description: STATUS_DESCRIPTION["high"],
    };
  }

  if (value < min) {
    const diffRatio = (min - value) / min;
    if (diffRatio > 0.5) {
      return {
        status: "critical-low",
        severity: 3,
        description: STATUS_DESCRIPTION["critical-low"],
      };
    }
    if (diffRatio > 0.2) {
      return {
        status: "very-low",
        severity: 2,
        description: STATUS_DESCRIPTION["very-low"],
      };
    }
    return {
      status: "low",
      severity: 1,
      description: STATUS_DESCRIPTION["low"],
    };
  }

  return {
    status: "normal",
    severity: 0,
    description: STATUS_DESCRIPTION["normal"],
  };
};

/**
 * Generates a human-readable message for a parameter
 * @param {string} parameterName - The name of the parameter
 * @param {number} value - The raw clinical value
 * @returns {string} Human-readable description
 */
export const generateParameterMessage = (parameterName, value) => {
  const range = REFERENCE_RANGES[parameterName];
  if (!range) {
    throw new Error(`Unknown parameter: ${parameterName}`);
  }

  const { status, description } = classifySeverity(value, parameterName);
  const { min, max, unit } = range;
  const paramLabel =
    parameterName.charAt(0).toUpperCase() + parameterName.slice(1);
  const unitStr = unit ? ` ${unit}` : "";

  if (status === "normal") {
    return `${paramLabel} is within reference limits (${value}${unitStr}).`;
  }

  return `${paramLabel} is ${description} at ${value}${unitStr} (expected ${min}-${max}${unitStr}).`;
};

/**
 * Normalizes all clinical parameters in a dataset
 * @param {Object} clinicalData - Object containing raw clinical values
 * @returns {Object} Object containing normalized values and binary statuses
 */
export const normalizeAllParameters = (clinicalData) => {
  const normalizedData = {};
  const binaryStatuses = {};
  const abnormalParameters = [];

  Object.keys(REFERENCE_RANGES).forEach((parameterName) => {
    const value = clinicalData[parameterName];

    if (value === undefined || value === null || isNaN(value)) {
      normalizedData[parameterName] = null;
      binaryStatuses[parameterName] = null;
      return;
    }

    const numValue = parseFloat(value);
    normalizedData[parameterName] = normalizeParameter(numValue, parameterName);
    binaryStatuses[parameterName] = getBinaryStatus(numValue, parameterName);

    if (binaryStatuses[parameterName] === 1) {
      const severityInfo = classifySeverity(numValue, parameterName);
      abnormalParameters.push({
        parameter: parameterName,
        value: numValue,
        ...severityInfo,
        message: generateParameterMessage(parameterName, numValue),
      });
    }
  });

  // Sort abnormal parameters by severity (highest first)
  abnormalParameters.sort((a, b) => b.severity - a.severity);

  return {
    normalizedData,
    binaryStatuses,
    abnormalParameters,
  };
};

/**
 * Validates that all required clinical parameters are present
 * @param {Object} clinicalData - Object containing clinical values
 * @returns {Object} Validation result with isValid and missing parameters
 */
export const validateClinicalData = (clinicalData) => {
  const missingParameters = [];
  const invalidParameters = [];

  Object.keys(REFERENCE_RANGES).forEach((parameterName) => {
    const value = clinicalData[parameterName];

    if (value === undefined || value === null) {
      missingParameters.push(parameterName);
    } else if (isNaN(value) || typeof value !== "number") {
      invalidParameters.push(parameterName);
    }
  });

  return {
    isValid: missingParameters.length === 0 && invalidParameters.length === 0,
    missingParameters,
    invalidParameters,
  };
};
