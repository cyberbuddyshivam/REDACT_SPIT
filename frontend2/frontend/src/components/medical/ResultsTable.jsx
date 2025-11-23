import React from "react";

// --------------------------------
// CATEGORY GROUPING
// --------------------------------
const categories = {
  "Diabetes Panel": ["bmi", "glucose", "hba1c", "insulin"],
  "Lipid Profile": [
    "cholesterol",
    "ldl",
    "hdl",
    "triglycerides",
    "cholesterolHDLRatio",
  ],
  "Cardiac Panel": ["troponin"],
  "Liver Function": ["alt", "ast", "bilirubin"],
  "Renal Function": ["creatinine", "bun"],
  Inflammation: ["crp"],
  "CBC Panel": ["hemoglobin", "hematocrit", "rbc", "mcv", "wbc", "platelets"],
  Vitals: ["systolicBP", "diastolicBP"],
};

// --------------------------------
// REFERENCE RANGES + UNITS
// --------------------------------
const referenceRanges = {
  bmi: { label: "BMI", min: 18.5, max: 24.9, unit: "kg/m²" },
  glucose: { label: "Glucose", min: 70, max: 99, unit: "mg/dL" },
  hba1c: { label: "HbA1c", min: 4, max: 5.6, unit: "%" },
  insulin: { label: "Insulin", min: 2, max: 25, unit: "µIU/mL" },
  cholesterol: { label: "Cholesterol", min: 125, max: 200, unit: "mg/dL" },
  ldl: { label: "LDL", min: 0, max: 100, unit: "mg/dL" },
  hdl: { label: "HDL", min: 40, max: 60, unit: "mg/dL" },
  triglycerides: { label: "Triglycerides", min: 0, max: 150, unit: "mg/dL" },
  troponin: { label: "Troponin", min: 0, max: 0.04, unit: "ng/mL" },
  alt: { label: "ALT", min: 7, max: 56, unit: "U/L" },
  ast: { label: "AST", min: 10, max: 40, unit: "U/L" },
  bilirubin: { label: "Bilirubin", min: 0.1, max: 1.2, unit: "mg/dL" },
  creatinine: { label: "Creatinine", min: 0.84, max: 1.21, unit: "mg/dL" },
  bun: { label: "BUN", min: 7, max: 20, unit: "mg/dL" },
  crp: { label: "CRP", min: 0, max: 1, unit: "mg/L" },
  hemoglobin: { label: "Hemoglobin", min: 13.8, max: 17.2, unit: "g/dL" },
  hematocrit: { label: "Hematocrit", min: 40.7, max: 50.3, unit: "%" },
  rbc: { label: "RBC", min: 4.7, max: 6.1, unit: "million/µL" },
  mcv: { label: "MCV", min: 80, max: 100, unit: "fL" },
  wbc: { label: "WBC", min: 4.5, max: 11, unit: "thousand/µL" },
  platelets: { label: "Platelets", min: 150, max: 450, unit: "thousand/µL" },
  systolicBP: { label: "Systolic BP", min: 90, max: 120, unit: "mmHg" },
  diastolicBP: { label: "Diastolic BP", min: 60, max: 80, unit: "mmHg" },
  cholesterolHDLRatio: {
    label: "Chol/HDL Ratio",
    min: 0,
    max: 5,
    unit: "ratio",
  },
};

// --------------------------------
// YOUR SCALE VALUES EXACT (0–1)
// --------------------------------
const clinicalData = {
  bmi: 0.3714,
  glucose: 0.1528,
  hba1c: 0.1391,
  insulin: 0.0368,
  cholesterol: 0.2333,
  ldl: 0.2381,
  hdl: 0.4375,
  triglycerides: 0.1579,
  troponin: 0.0002,
  alt: 0.0872,
  ast: 0.0821,
  bilirubin: 0.1224,
  creatinine: 0.2222,
  bun: 0.1636,
  crp: 0.05,
  hemoglobin: 0.5769,
  hematocrit: 0.6,
  rbc: 0.45,
  mcv: 0.5,
  wbc: 0.3333,
  platelets: 0.3818,
  systolicBP: 0.3167,
  diastolicBP: 0.4,
  cholesterolHDLRatio: 0.2461,
};

// --------------------------------
// RISK LOGIC (matches your table EXACTLY)
// --------------------------------
function getRisk(value) {
  if (value <= 0.33)
    return <span className="text-green-600 font-semibold">🟢 Low</span>;
  if (value <= 0.66)
    return <span className="text-yellow-600 font-semibold">🟡 Medium</span>;
  return <span className="text-red-600 font-semibold">🔴 High</span>;
}

// --------------------------------
// PARAMETER TOOLTIPS
// --------------------------------
const parameterTooltips = {
  glucose: "Fasting blood sugar. High values (>140) may indicate diabetes.",
  hba1c: "Average blood sugar over 2-3 months. Normal: 4-5.6%.",
  troponin: "Cardiac enzyme released during heart muscle damage.",
  creatinine: "Waste product filtered by kidneys. High values indicate kidney problems.",
  alt: "Alanine aminotransferase. Liver enzyme that rises with liver damage.",
  ast: "Aspartate aminotransferase. Elevated in liver or heart conditions.",
  ldl: "Low-density lipoprotein (bad cholesterol). Target: <100 mg/dL.",
  hdl: "High-density lipoprotein (good cholesterol). Higher is better.",
  systolicBP: "Pressure when heart beats. Optimal: <120 mmHg.",
  diastolicBP: "Pressure when heart rests. Optimal: <80 mmHg.",
  bun: "Blood urea nitrogen. Measures kidney function.",
  crp: "C-reactive protein. Marker of inflammation in the body.",
  bmi: "Body Mass Index. Weight relative to height. Normal: 18.5-24.9.",
  cholesterol: "Total cholesterol. Target: <200 mg/dL.",
  triglycerides: "Fat in blood. High levels increase heart disease risk.",
};

// --------------------------------
// MAIN COMPONENT
// --------------------------------
const ResultsTable = ({ referenceRanges, clinicalData }) => {
  // Helper function to convert camelCase to PascalCase for matching
  const toPascalCase = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Helper function to calculate scaled value (0-1)
  const getScaledValue = (value, min, max) => {
    if (!value || value === "" || isNaN(value)) return null;
    const numValue = parseFloat(value);
    return ((numValue - min) / (max - min)).toFixed(4);
  };

  return (
    <div className="space-y-10">
      {Object.keys(categories).map((group) => (
        <div
          key={group}
          className="border border-slate-300 rounded-xl shadow bg-white"
        >
          <div className="px-6 py-4 bg-slate-100 rounded-t-xl text-slate-700 font-bold text-lg">
            {group}
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <th className="py-3 px-6">Parameter</th>
                <th className="py-3 px-6 text-right">Given Value</th>
                <th className="py-3 px-6 text-right">Scaled Value</th>
                <th className="py-3 px-6 text-center">Unit</th>
                <th className="py-3 px-6 text-center">Normal Range</th>
                <th className="py-3 px-6 text-center">Risk</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {categories[group].map((id) => {
                // Find reference range from props or use static fallback
                let ref;
                if (referenceRanges && Array.isArray(referenceRanges)) {
                  ref = referenceRanges.find((r) => r.id === id);
                } else if (referenceRanges && typeof referenceRanges === 'object') {
                  ref = referenceRanges[id];
                }

                if (!ref) return null;

                // Get the actual clinical value from props
                const givenValue = clinicalData?.[id];
                const scaledValue = getScaledValue(
                  givenValue,
                  ref.min,
                  ref.max
                );

                const scaledNum = scaledValue ? parseFloat(scaledValue) : null;
                const isCritical = scaledNum && scaledNum > 0.8;
                const isWarning = scaledNum && scaledNum > 0.66 && scaledNum <= 0.8;

                return (
                  <tr key={id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-6 font-medium text-slate-700">
                      <div className="tooltip-container inline-flex items-center gap-2">
                        <span className="cursor-help">{ref.label}</span>
                        {parameterTooltips[id] && (
                          <div className="tooltip tooltip-multiline">
                            {parameterTooltips[id]}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-6 text-right font-semibold text-indigo-700">
                      {givenValue || "—"}
                    </td>

                    <td className="py-3 px-6 text-right font-mono text-slate-800">
                      {scaledValue || "—"}
                    </td>

                    <td className="py-3 px-6 text-center text-slate-500">
                      {ref.unit}
                    </td>

                    <td className="py-3 px-6 text-center text-slate-400">
                      {ref.min} – {ref.max}
                    </td>

                    <td className="py-3 px-6 text-center">
                      {scaledValue ? getRisk(scaledNum) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default ResultsTable;
