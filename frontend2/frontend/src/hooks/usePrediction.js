import { useMemo } from "react";
import { REFERENCE_RANGES } from "../data/ReferenceRanges";

const STATUS_DESCRIPTION = {
  "critical-high": "critically high",
  "very-high": "very high",
  high: "high",
  "critical-low": "critically low",
  "very-low": "very low",
  low: "low",
  normal: "within range",
};

const DISEASE_PARAMETER_MAP = {
  Diabetes: ["glucose", "hba1c", "insulin", "bmi", "triglycerides", "hdl"],
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

const parseValue = (value) => {
  const numeric = parseFloat(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const evaluateRange = (value, min, max) => {
  if (value > max) {
    const diffRatio = (value - max) / max;
    if (diffRatio > 0.5) return { status: "critical-high", severity: 3 };
    if (diffRatio > 0.2) return { status: "very-high", severity: 2 };
    return { status: "high", severity: 1 };
  }
  if (value < min) {
    const diffRatio = (min - value) / min;
    if (diffRatio > 0.5) return { status: "critical-low", severity: 3 };
    if (diffRatio > 0.2) return { status: "very-low", severity: 2 };
    return { status: "low", severity: 1 };
  }
  return { status: "normal", severity: 0 };
};

const buildInsight = (range, value) => {
  const { status, severity } = evaluateRange(value, range.min, range.max);
  const unit = range.unit ? ` ${range.unit}` : "";
  const description = STATUS_DESCRIPTION[status];
  const message =
    status === "normal"
      ? `${range.label} is within reference limits (${value}${unit}).`
      : `${range.label} is ${description} at ${value}${unit} (expected ${range.min}-${range.max}${unit}).`;
  return { ...range, value, status, severity, message };
};

const buildParameterLookup = (clinicalData) => {
  const lookup = {};
  const abnormalList = [];

  REFERENCE_RANGES.forEach((range) => {
    const raw = clinicalData?.[range.id];
    const value = parseValue(raw);
    if (value === null) return;
    const insight = buildInsight(range, value);
    lookup[range.id] = insight;
    if (insight.status !== "normal") {
      abnormalList.push(insight);
    }
  });

  abnormalList.sort((a, b) => b.severity - a.severity);

  return { lookup, abnormalList };
};

const describeParametersForDisease = (name, lookup, fallback) => {
  const ids = DISEASE_PARAMETER_MAP[name] || [];
  const insights = ids
    .map((id) => lookup[id])
    .filter((insight) => insight && insight.status !== "normal");

  if (insights.length > 0) {
    return insights.map((insight) => insight.message);
  }

  return fallback.slice(0, 3).map((insight) => insight.message);
};

export const usePrediction = (clinicalData) => {
  return useMemo(() => {
    const predictions = [];
    const val = (id) => parseFloat(clinicalData[id] || 0);
    const { lookup: parameterLookup, abnormalList } =
      buildParameterLookup(clinicalData);

    // 1. Diabetes Logic
    let diabetes = 0;
    const diabetesReasons = [];
    if (val("glucose") > 200) {
      diabetes += 50;
      diabetesReasons.push(`Critical Glucose (${val("glucose")} mg/dL)`);
    } else if (val("glucose") > 140) {
      diabetes += 30;
      diabetesReasons.push(`Elevated Glucose`);
    }
    if (val("hba1c") > 6.5) {
      diabetes += 40;
      diabetesReasons.push(`HbA1c indicates diabetes (${val("hba1c")}%)`);
    }
    if (diabetes > 0)
      predictions.push({
        name: "Diabetes",
        probability: Math.min(diabetes, 99),
        reasons: diabetesReasons,
        parameterFactors: describeParametersForDisease(
          "Diabetes",
          parameterLookup,
          abnormalList
        ),
      });

    // 2. Heart Disease Logic
    let cardio = 0;
    const cardioReasons = [];
    if (val("troponin") > 0.04) {
      cardio += 95;
      cardioReasons.push(`Critical Troponin - Myocardial Infarction Risk`);
    }
    if (val("ldl") > 160) {
      cardio += 20;
      cardioReasons.push(`Very High LDL`);
    }
    if (val("triglycerides") > 500) {
      cardio += 15;
      cardioReasons.push(`Severe Hypertriglyceridemia`);
    }
    if (val("systolicBP") > 160) {
      cardio += 20;
      cardioReasons.push(`Stage 2 Hypertension`);
    }
    if (cardio > 0)
      predictions.push({
        name: "Heart Disease",
        probability: Math.min(cardio, 99),
        reasons: cardioReasons,
        parameterFactors: describeParametersForDisease(
          "Heart Disease",
          parameterLookup,
          abnormalList
        ),
      });

    // 3. Liver Disease Logic
    let liver = 0;
    const liverReasons = [];
    if (val("alt") > 200 || val("ast") > 200) {
      liver += 80;
      liverReasons.push(`Extremely elevated liver enzymes`);
    }
    if (val("bilirubin") > 2.0) {
      liver += 30;
      liverReasons.push(`Elevated Bilirubin`);
    }
    if (liver > 0)
      predictions.push({
        name: "Liver Disease",
        probability: Math.min(liver, 99),
        reasons: liverReasons,
        parameterFactors: describeParametersForDisease(
          "Liver Disease",
          parameterLookup,
          abnormalList
        ),
      });

    // 4. Kidney Disease Logic
    let kidney = 0;
    const kidneyReasons = [];
    if (val("creatinine") > 4.0) {
      kidney += 90;
      kidneyReasons.push(
        `Critical Creatinine (${val("creatinine")}) - Renal Failure`
      );
    } else if (val("creatinine") > 1.4) {
      kidney += 40;
      kidneyReasons.push(`Elevated Creatinine`);
    }
    if (val("bun") > 30) {
      kidney += 30;
      kidneyReasons.push(`Elevated BUN (${val("bun")} mg/dL)`);
    }
    if (kidney > 0)
      predictions.push({
        name: "Kidney Disease",
        probability: Math.min(kidney, 99),
        reasons: kidneyReasons,
        parameterFactors: describeParametersForDisease(
          "Kidney Disease",
          parameterLookup,
          abnormalList
        ),
      });

    // If no diseases detected, add Healthy status
    if (predictions.length === 0) {
      const totalParams = REFERENCE_RANGES.length;
      const normalParams = REFERENCE_RANGES.filter((range) => {
        const value = parseValue(clinicalData?.[range.id]);
        if (value === null) return false;
        const { status } = evaluateRange(value, range.min, range.max);
        return status === "normal";
      }).length;

      const healthPercentage = Math.round((normalParams / totalParams) * 100);

      predictions.push({
        name: "Healthy",
        probability: healthPercentage,
        reasons: [
          `All major clinical parameters are within normal range`,
          `${normalParams} out of ${totalParams} parameters are normal`,
        ],
        parameterFactors: [
          "No critical abnormalities detected in cardiac markers",
          "Metabolic panel shows normal glucose and lipid levels",
          "Kidney and liver function tests are within limits",
        ],
      });
    }

    // Sort descending
    return predictions
      .map((prediction) => ({
        ...prediction,
        parameterFactors:
          prediction.parameterFactors && prediction.parameterFactors.length > 0
            ? prediction.parameterFactors
            : abnormalList.slice(0, 3).map((insight) => insight.message),
      }))
      .sort((a, b) => b.probability - a.probability);
  }, [clinicalData]);
};
