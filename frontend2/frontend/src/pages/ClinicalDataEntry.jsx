import React, { useContext, useState, useEffect } from "react";
import {
  Activity,
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  Upload,
  FileImage,
  X,
} from "lucide-react";
import { PatientContext } from "../context/PatientContext";
import { REFERENCE_RANGES } from "../data/ReferenceRanges";
import Button from "../components/common/Button";
import Spinner from "../components/common/Spinner";
import { useToast } from "../components/common/Toast";

const ClinicalDataEntry = ({ onNext, onBack }) => {
  const {
    clinicalData,
    updateClinicalData,
    loadDemoData,
    saveClinicalParameters,
  } = useContext(PatientContext);
  const [validation, setValidation] = useState({});
  const [filledCount, setFilledCount] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { success, error } = useToast();

  // Calculate filled fields
  useEffect(() => {
    const filled = Object.values(clinicalData).filter(
      (val) => val !== ""
    ).length;
    setFilledCount(filled);
  }, [clinicalData]);

  // Validation
  const validateParameter = (param, value) => {
    if (!value) return "empty";
    const num = parseFloat(value);
    if (isNaN(num)) return "invalid";
    if (num < param.min || num > param.max) return "warning";
    return "valid";
  };

  const handleParameterChange = (id, value) => {
    updateClinicalData(id, value);
    const ref = REFERENCE_RANGES.find((p) => p.id === id);
    setValidation((p) => ({
      ...p,
      [id]: validateParameter(ref, value),
    }));
  };

  const getStatusIcon = (id) => {
    const s = validation[id];
    if (s === "valid")
      return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    if (s === "warning")
      return <AlertCircle className="w-4 h-4 text-orange-500" />;
    if (s === "invalid")
      return <AlertCircle className="w-4 h-4 text-rose-500" />;
    return null;
  };

  const getInputClassName = (id) => {
    const s = validation[id];
    if (s === "valid") return "border-emerald-500 focus:border-emerald-500";
    if (s === "warning") return "border-orange-500 focus:border-orange-500";
    if (s === "invalid") return "border-rose-500 focus:border-rose-500";
    return "border-slate-300 focus:border-blue-500";
  };

  // Check if parameter is critical (outside normal range by significant margin)
  const isCritical = (id, value) => {
    if (!value) return false;
    const ref = REFERENCE_RANGES.find((p) => p.id === id);
    if (!ref) return false;
    const num = parseFloat(value);
    if (isNaN(num)) return false;

    // Critical if 50% beyond range
    const range = ref.max - ref.min;
    const criticalLow = ref.min - range * 0.5;
    const criticalHigh = ref.max + range * 0.5;

    return num < criticalLow || num > criticalHigh;
  };

  // Get tooltip information for parameter
  const getTooltipInfo = (param) => {
    const tooltips = {
      glucose: "Fasting blood sugar levels. High values may indicate diabetes.",
      hba1c: "Average blood sugar over 2-3 months. Key diabetes marker.",
      troponin: "Cardiac enzyme. Elevated in heart attacks.",
      creatinine: "Kidney function marker. High values indicate kidney issues.",
      alt: "Liver enzyme. Elevated in liver damage.",
      ast: "Liver enzyme. Elevated in liver or heart conditions.",
      ldl: "Bad cholesterol. High levels increase heart disease risk.",
      hdl: "Good cholesterol. Higher is better for heart health.",
      systolicBP: "Top blood pressure number. Should be under 120.",
      diastolicBP: "Bottom blood pressure number. Should be under 80.",
      bun: "Blood urea nitrogen. Kidney function indicator.",
      crp: "Inflammation marker. High in infections/inflammation.",
    };
    return (
      tooltips[param.id] ||
      `Normal range: ${param.min} - ${param.max} ${param.unit}`
    );
  };

  const isFormValid = filledCount >= 10;

  /* ------------------------------
       FILE UPLOAD HANDLERS
  --------------------------------*/
  const handleFileUpload = async (file) => {
    if (!file) return;

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (!validTypes.includes(file.type)) {
      error("Only JPG, PNG, and PDF files are supported");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      error("File must be less than 10MB");
      return;
    }

    setUploadedFile(file);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("reportImage", file);

      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"
        }/patients/extract-lab-data`,
        { method: "POST", body: formData }
      );

      if (!response.ok) throw new Error("OCR processing failed");

      const data = await response.json();

      if (data.data?.extractedData) {
        Object.entries(data.data.extractedData).forEach(([k, v]) => {
          if (v !== null) handleParameterChange(k, v.toString());
        });

        success(
          `Extracted ${Object.keys(data.data.extractedData).length} fields`
        );
      } else {
        error("Unable to extract data from the report");
      }
    } catch (err) {
      error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div className="max-w-6xl mx-auto py-6">
      {/* HEADER */}
      <div className="bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 rounded-2xl shadow-xl mb-6 card-hover">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">
              Clinical Parameters
            </h2>
            <p className="text-sm text-blue-100 mt-2">
              {filledCount} / {REFERENCE_RANGES.length} fields completed
              {filledCount < 10 && (
                <span className="text-yellow-300 ml-2 font-semibold">
                  (Min 10 required)
                </span>
              )}
            </p>
          </div>

          <button
            onClick={loadDemoData}
            className="px-5 py-2.5 text-sm font-medium text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Auto-fill Healthy Patient
          </button>
        </div>
      </div>

      {/* FILE UPLOAD */}
      <div className="bg-linear-to-br from-white to-blue-50 shadow-lg rounded-xl border border-blue-200 p-6 mb-8 card-hover">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <FileImage className="w-5 h-5 text-blue-600 float-animation" />
          Upload Lab Report (Optional)
        </h3>

        {!uploadedFile ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            className={`p-8 border-2 border-dashed rounded-xl text-center transition ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 hover:border-blue-400"
            }`}
          >
            {isProcessing ? (
              <div className="flex flex-col items-center gap-3">
                <Spinner size="lg" />
                <p className="text-slate-600">Processing report...</p>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="font-medium text-slate-700">
                  Drop your report here
                </p>
                <p className="text-sm text-slate-500 mb-4">
                  or click below (PDF / JPG / PNG)
                </p>

                <input
                  type="file"
                  id="filePicker"
                  className="hidden"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileUpload(e.target.files[0])}
                />
                <label
                  htmlFor="filePicker"
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Select File
                </label>
              </>
            )}
          </div>
        ) : (
          <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3">
              <FileImage className="w-10 h-10 text-blue-600" />
              <div>
                <p className="font-semibold">{uploadedFile.name}</p>
                <p className="text-sm text-slate-600">
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>

            <button
              onClick={() => setUploadedFile(null)}
              className="p-2 hover:bg-blue-100 rounded-lg transition"
            >
              <X className="w-5 h-5 text-slate-700" />
            </button>
          </div>
        )}
      </div>

      {/* INPUT GRID */}
      <div className="bg-linear-to-br from-white via-slate-50 to-indigo-50 p-8 shadow-xl rounded-2xl border border-slate-200 card-hover">
        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {REFERENCE_RANGES.map((param) => (
            <div key={param.id} className="relative">
              <div className="flex justify-between mb-1">
                <div className="tooltip-container">
                  <label className="text-sm font-semibold text-slate-700 cursor-help">
                    {param.label}
                  </label>
                  <div className="tooltip tooltip-multiline">
                    {getTooltipInfo(param)}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {getStatusIcon(param.id)}
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                    {param.unit}
                  </span>
                </div>
              </div>

              <div className="relative">
                <input
                  type="number"
                  value={clinicalData[param.id]}
                  onChange={(e) =>
                    handleParameterChange(param.id, e.target.value)
                  }
                  placeholder={`${param.min} - ${param.max}`}
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition ${getInputClassName(
                    param.id
                  )}`}
                />
                {isCritical(param.id, clinicalData[param.id]) && (
                  <div className="critical-badge">!</div>
                )}
              </div>

              {validation[param.id] === "warning" && (
                <p className="text-xs text-orange-600 mt-1">
                  Outside normal range
                </p>
              )}

              {validation[param.id] === "invalid" && (
                <p className="text-xs text-rose-600 mt-1">Invalid value</p>
              )}
            </div>
          ))}
        </div>

        {/* FOOTER BUTTONS */}
        <div className="flex justify-between mt-10 pt-6 border-t border-slate-200">
          <Button variant="secondary" onClick={onBack}>
            <ChevronLeft className="mr-2 w-4 h-4" /> Back
          </Button>

          <Button
            onClick={async () => {
              setIsSaving(true);
              try {
                await saveClinicalParameters();
                success("Clinical parameters saved successfully!");
                onNext();
              } catch (err) {
                error("Failed to save parameters: " + err.message);
                console.error(err);
              } finally {
                setIsSaving(false);
              }
            }}
            disabled={!isFormValid || isSaving}
          >
            {isSaving ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              <>
                Analyze Data <Activity className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClinicalDataEntry;
