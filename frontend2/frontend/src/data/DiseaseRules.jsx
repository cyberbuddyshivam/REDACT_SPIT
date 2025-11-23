/**
 * Disease Prediction Logic Engine
 * * This file contains the rulesets for analyzing the 24 medical parameters.
 * It checks for thresholds and returns a list of probable conditions with confidence scores.
 */

export const predictDiseases = (clinicalData) => {
  const predictions = [];

  // Helper to safely get a number from the string input
  const val = (id) => {
    const value = parseFloat(clinicalData[id]);
    return isNaN(value) ? 0 : value;
  };

  // --- RULESET 1: Diabetes Mellitus (Type 2) ---
  // Triggers: High Glucose, High HbA1c, High Insulin
  let diabetesScore = 0;
  const diabetesReasons = [];

  if (val("glucose") > 200) {
    diabetesScore += 50;
    diabetesReasons.push(
      `Critical Random Glucose level (${val("glucose")} mg/dL)`
    );
  } else if (val("glucose") > 140) {
    diabetesScore += 30;
    diabetesReasons.push(`Elevated Glucose indicates hyperglycemia`);
  }

  if (val("hba1c") > 6.5) {
    diabetesScore += 40;
    diabetesReasons.push(`HbA1c (${val("hba1c")}%) is in diabetic range`);
  } else if (val("hba1c") > 5.7) {
    diabetesScore += 20;
    diabetesReasons.push(`HbA1c indicates pre-diabetes`);
  }

  if (val("insulin") > 25) {
    diabetesScore += 10;
    diabetesReasons.push(`High Insulin levels suggest insulin resistance`);
  }

  if (diabetesScore > 0) {
    predictions.push({
      name: "Type 2 Diabetes Mellitus",
      probability: Math.min(diabetesScore, 99),
      reasons: diabetesReasons,
    });
  }

  // --- RULESET 2: Cardiovascular Disease (CVD) / Acute MI ---
  // Triggers: High Troponin, High Cholesterol/LDL, High BP
  let cardioScore = 0;
  const cardioReasons = [];

  if (val("troponin") > 0.04) {
    cardioScore += 95; // Troponin is highly specific to heart damage
    cardioReasons.push(
      `Elevated Troponin (${val("troponin")}) indicates myocardial injury`
    );
  }

  if (val("sbp") > 180 || val("dbp") > 120) {
    cardioScore += 30;
    cardioReasons.push(
      `Hypertensive Crisis levels (BP ${val("sbp")}/${val("dbp")})`
    );
  } else if (val("sbp") > 140 || val("dbp") > 90) {
    cardioScore += 15;
    cardioReasons.push(`Hypertension`);
  }

  if (val("ldl") > 160) {
    cardioScore += 20;
    cardioReasons.push(`Very High LDL Cholesterol`);
  }

  if (val("triglycerides") > 200) {
    cardioScore += 10;
    cardioReasons.push(`High Triglycerides`);
  }

  if (cardioScore > 0) {
    predictions.push({
      name: "Coronary Artery Disease / Myocardial Infarction Risk",
      probability: Math.min(cardioScore, 99),
      reasons: cardioReasons,
    });
  }

  // --- RULESET 3: Liver Dysfunction / Hepatitis ---
  // Triggers: High ALT, AST
  let liverScore = 0;
  const liverReasons = [];

  if (val("alt") > 300 || val("ast") > 300) {
    liverScore += 90;
    liverReasons.push(`Critically high Liver Enzymes (ALT/AST > 300)`);
  } else if (val("alt") > 56 || val("ast") > 48) {
    liverScore += 40;
    liverReasons.push(`Elevated Liver Enzymes indicate inflammation`);
  }

  if (liverScore > 0) {
    predictions.push({
      name: "Liver Dysfunction (Hepatitis/Hepatic Injury)",
      probability: Math.min(liverScore, 99),
      reasons: liverReasons,
    });
  }

  // --- RULESET 4: Chronic Kidney Disease (CKD) ---
  // Triggers: High Creatinine, Hypertension
  let kidneyScore = 0;
  const kidneyReasons = [];

  if (val("creatinine") > 4.0) {
    kidneyScore += 90;
    kidneyReasons.push(
      `Critical Creatinine (${val("creatinine")}) suggests renal failure`
    );
  } else if (val("creatinine") > 1.3) {
    kidneyScore += 50;
    kidneyReasons.push(`Elevated Creatinine indicates reduced kidney function`);
  }

  if (val("sbp") > 140 && kidneyScore > 0) {
    kidneyScore += 10; // Hypertension worsens kidney score
    kidneyReasons.push(`Uncontrolled Blood Pressure stressing kidneys`);
  }

  if (kidneyScore > 0) {
    predictions.push({
      name: "Chronic Kidney Disease / Renal Failure",
      probability: Math.min(kidneyScore, 99),
      reasons: kidneyReasons,
    });
  }

  // --- RULESET 5: Anemia ---
  // Triggers: Low Hemoglobin, Low RBC, Low Hematocrit
  let anemiaScore = 0;
  const anemiaReasons = [];

  if (val("hemoglobin") < 10) {
    anemiaScore += 60;
    anemiaReasons.push(
      `Significantly low Hemoglobin (${val("hemoglobin")} g/dL)`
    );
  } else if (val("hemoglobin") < 13.5) {
    anemiaScore += 30;
    anemiaReasons.push(`Low Hemoglobin`);
  }

  if (val("rbc") < 4.0) {
    anemiaScore += 20;
    anemiaReasons.push(`Low Red Blood Cell count`);
  }

  if (anemiaScore > 0) {
    predictions.push({
      name: "Anemia",
      probability: Math.min(anemiaScore, 99),
      reasons: anemiaReasons,
    });
  }

  // --- RULESET 6: Metabolic Syndrome ---
  // Triggers: High BMI + (High BP or High Glucose or High Triglycerides)
  let metaScore = 0;
  const metaReasons = [];

  if (val("bmi") > 30) {
    metaScore += 30;
    metaReasons.push(`Obesity (BMI: ${val("bmi")})`);
  }

  if (metaScore > 0) {
    // Check co-morbidities for Metabolic Syndrome
    if (val("triglycerides") > 150) {
      metaScore += 20;
      metaReasons.push(`High Triglycerides`);
    }
    if (val("hdl") < 40) {
      metaScore += 20;
      metaReasons.push(`Low HDL (Good Cholesterol)`);
    }
    if (val("sbp") > 130) {
      metaScore += 20;
      metaReasons.push(`Elevated Blood Pressure`);
    }
    if (val("glucose") > 100) {
      metaScore += 20;
      metaReasons.push(`Elevated Fasting Glucose`);
    }
  }

  if (metaScore >= 50) {
    // Threshold to actually call it Metabolic Syndrome
    predictions.push({
      name: "Metabolic Syndrome",
      probability: Math.min(metaScore, 99),
      reasons: metaReasons,
    });
  }

  // --- RULESET 7: Infection / Inflammation ---
  // Triggers: High CRP, High WBC
  let infectionScore = 0;
  const infectionReasons = [];

  if (val("wbc") > 11.0) {
    infectionScore += 50;
    infectionReasons.push(`Leukocytosis (High WBC: ${val("wbc")})`);
  }
  if (val("crp") > 10) {
    infectionScore += 40;
    infectionReasons.push(`Elevated C-Reactive Protein indicates inflammation`);
  }

  if (infectionScore > 0) {
    predictions.push({
      name: "Active Infection / Inflammation",
      probability: Math.min(infectionScore, 99),
      reasons: infectionReasons,
    });
  }

  // Return sorted list (highest probability first)
  return predictions.sort((a, b) => b.probability - a.probability);
};
