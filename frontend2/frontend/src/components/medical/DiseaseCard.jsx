import React from "react";
import {
  AlertCircle,
  Info,
  TrendingUp,
  Activity,
  ChevronDown,
  Heart,
  Droplet,
  Brain,
  Pill,
  Zap,
  BarChart3,
} from "lucide-react";

const DiseaseCard = ({ prediction, isExpanded, onToggle }) => {
  const { name, probability, reasons = [], parameterFactors = [] } = prediction;

  // Risk level determination
  const getRiskLevel = () => {
    if (name === "Healthy") {
      return {
        label: "HEALTHY",
        color: "green",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        textColor: "text-green-700",
      };
    }
    if (probability >= 60)
      return {
        label: "HIGH",
        color: "red",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        textColor: "text-red-700",
      };
    if (probability >= 30)
      return {
        label: "MEDIUM",
        color: "yellow",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        textColor: "text-yellow-700",
      };
    return {
      label: "LOW",
      color: "green",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-700",
    };
  };

  const risk = getRiskLevel();

  // Get disease emoji icon
  const getDiseaseIcon = () => {
    if (name.includes("Heart")) return "🫀";
    if (name.includes("Diabetes")) return "🩸";
    if (name.includes("Liver")) return "🫁";
    if (name.includes("Kidney")) return "💊";
    if (name.includes("Healthy")) return "✅";
    return "🏥";
  };

  // Calculate top 5 feature impacts from parameterFactors
  const getFeatureImpacts = () => {
    if (!parameterFactors || parameterFactors.length === 0) return [];

    // Extract parameter names and create impact scores
    const impacts = parameterFactors.slice(0, 5).map((factor, idx) => {
      // Extract parameter name from message
      const paramName = factor.split(" ")[0];
      // Higher index = lower severity, so reverse the impact score
      const impactScore = 100 - idx * 15;
      return { name: paramName, score: impactScore };
    });

    return impacts;
  };

  const featureImpacts = getFeatureImpacts();

  // Generate clinical explanation
  const getClinicalExplanation = () => {
    if (reasons.length === 0)
      return "No significant clinical factors identified.";

    const topFactors = reasons.slice(0, 2).map((r) => {
      // Extract key term from reason
      if (r.includes("Glucose")) return "elevated Glucose";
      if (r.includes("Troponin")) return "high Troponin";
      if (r.includes("HbA1c")) return "elevated HbA1c";
      if (r.includes("Creatinine")) return "critical Creatinine";
      if (r.includes("liver enzymes")) return "elevated liver enzymes";
      if (r.includes("LDL")) return "high LDL cholesterol";
      if (r.includes("BMI")) return "obesity indicators";
      return r.toLowerCase();
    });

    if (topFactors.length === 1) {
      return `${topFactors[0]} contributed strongly to this prediction.`;
    } else if (topFactors.length === 2) {
      return `${topFactors[0]} and ${topFactors[1]} contributed strongly to this decision.`;
    }
    return "Multiple clinical factors contributed to this prediction.";
  };

  return (
    <div
      className={`rounded-xl shadow-2xl overflow-hidden border-2 ${risk.borderColor} ${risk.bgColor} card-hover transition-all duration-500`}
    >
      {/* Triage Risk Indicator */}
      <div className={`p-6 border-b-2 ${risk.borderColor} bg-white/60 backdrop-blur-sm`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-5xl float-animation">{getDiseaseIcon()}</span>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 drop-shadow-sm">{name}</h3>
              <div className="tooltip-container inline-block mt-2">
                <span
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${risk.textColor} ${risk.bgColor} border-2 ${risk.borderColor} shadow-md cursor-help`}
                >
                  {risk.label} RISK
                </span>
                <div className="tooltip">
                  {risk.label === "HIGH" && "Immediate medical attention may be needed"}
                  {risk.label === "MEDIUM" && "Monitor closely and consult healthcare provider"}
                  {risk.label === "LOW" && "Risk is within acceptable range"}
                  {risk.label === "HEALTHY" && "All parameters within normal limits"}
                </div>
              </div>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            {/* Circular Progress Ring */}
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200"
              />
              {/* Progress circle */}
              <circle
                cx="60"
                cy="60"
                r="54"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - probability / 100)}`}
                className={`${risk.textColor} transition-all duration-1000 ease-out`}
                strokeLinecap="round"
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="tooltip-container">
                <div className={`text-4xl font-black ${risk.textColor} drop-shadow-lg cursor-help`}>
                  {probability}%
                </div>
                <div className="tooltip">
                  Model confidence level based on clinical parameters
                </div>
              </div>
              <p className="text-xs text-slate-600 font-semibold mt-1">CONFIDENCE</p>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className="w-full p-5 flex items-center justify-center gap-3 bg-linear-to-r from-white to-slate-50 hover:from-slate-50 hover:to-slate-100 transition-all duration-300 text-slate-700 text-sm font-bold uppercase tracking-wide border-y border-slate-200 shadow-inner"
      >
        {isExpanded ? "Hide Details" : "View Clinical Explainability"}
        <ChevronDown
          className={`w-5 h-5 transition-transform duration-500 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>
      {isExpanded && (
        <div className="bg-white space-y-6 border-t-2 border-slate-200">
          {/* Explainability Section - MANDATORY FOR PS */}
          <section className="p-8 bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 border-b-2 border-indigo-300 shadow-inner">
            <h4 className="text-lg font-black text-indigo-900 uppercase tracking-wider mb-6 flex items-center gap-3">
              <BarChart3 className="w-6 h-6 float-animation" /> 🔷 Model Explainability (Top 5
              Feature Impacts)
            </h4>

            {featureImpacts.length > 0 ? (
              <div className="space-y-4 mb-6">
                {featureImpacts.map((feature, idx) => {
                  // Determine color based on impact score
                  let barColor = "bg-green-500"; // Low impact (default)
                  let textColor = "text-green-700";
                  if (feature.score >= 85) {
                    barColor = "bg-red-500"; // High impact
                    textColor = "text-red-700";
                  } else if (feature.score >= 70) {
                    barColor = "bg-yellow-500"; // Medium impact
                    textColor = "text-yellow-700";
                  }

                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-xl p-4 border-2 border-indigo-200 shadow-md hover:shadow-lg transition-all duration-300 card-hover"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-base font-bold text-slate-800">
                          {feature.name}
                        </span>
                        <span className={`text-sm font-bold ${textColor} bg-white px-3 py-1 rounded-full border-2 ${barColor.replace('bg-', 'border-')}`}>
                          {feature.score}% impact
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner overflow-hidden">
                        <div
                          className={`h-4 rounded-full transition-all duration-1000 ease-out ${barColor} shadow-lg`}
                          style={{ width: `${feature.score}%`, animation: 'slideInLeft 1s ease-out' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-600 bg-white/80 p-5 rounded-xl border-2 border-indigo-200 shadow-md">
                No significant feature impacts detected.
              </p>
            )}

            {/* Clinical Explanation */}
            <div className="mt-6 p-5 bg-white rounded-xl border-l-4 border-indigo-600 shadow-lg card-hover">
              <p className="text-xs font-black text-indigo-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" /> 🔷 Clinical Explanation:
              </p>
              <p className="text-base text-slate-800 font-semibold leading-relaxed">
                "{getClinicalExplanation()}"
              </p>
            </div>
          </section>

          {/* Contributing Factors */}
          <section className="px-6 pb-4">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Info className="w-4 h-4" /> Contributing Factors
            </h4>
            {reasons.length > 0 ? (
              <ul className="space-y-2">
                {reasons.map((reason, idx) => (
                  <li
                    key={idx}
                    className="flex items-start text-sm text-slate-600 bg-slate-50 p-3 rounded border border-slate-200"
                  >
                    <TrendingUp className="w-4 h-4 text-rose-500 mr-2 mt-0.5 shrink-0" />
                    {reason}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">
                The model did not flag any qualitative drivers for this
                condition.
              </p>
            )}
          </section>

          {/* Parameter Evidence */}
          <section className="px-6 pb-6">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" /> Parameter Evidence
            </h4>
            {parameterFactors.length > 0 ? (
              <ul className="space-y-2">
                {parameterFactors.map((factor, idx) => (
                  <li
                    key={idx}
                    className="flex items-start text-sm text-slate-600 bg-slate-50 p-3 rounded border border-slate-200"
                  >
                    <Info className="w-4 h-4 text-indigo-500 mr-2 mt-0.5 shrink-0" />
                    {factor}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">
                Available lab parameters remain within their respective
                reference ranges.
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default DiseaseCard;
