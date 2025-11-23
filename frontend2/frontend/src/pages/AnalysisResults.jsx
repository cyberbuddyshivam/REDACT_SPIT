import React, { useContext } from "react";
import { FileText, ChevronLeft, Brain } from "lucide-react";
import { PatientContext } from "../context/PatientContext";
import { REFERENCE_RANGES } from "../data/ReferenceRanges";
import Button from "../components/common/Button";
import ResultsTable from "../components/medical/ResultsTable";

const AnalysisResults = ({ onNext, onBack }) => {
  const { clinicalData } = useContext(PatientContext);

  return (
    <div className="max-w-5xl mx-auto animate-fadeInSlide">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden card-hover">
        <div className="bg-linear-to-r from-violet-500 via-purple-500 to-fuchsia-500 px-8 py-6 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 drop-shadow-lg">
            <FileText className="text-white float-animation" /> Data Normalization
          </h2>
        </div>

        <ResultsTable
          referenceRanges={REFERENCE_RANGES}
          clinicalData={clinicalData}
        />

        <div className="p-8 flex justify-between bg-linear-to-r from-violet-50 via-purple-50 to-fuchsia-50 border-t border-purple-200">
          <Button variant="secondary" onClick={onBack} className="hover:scale-105 transition-transform duration-300">
            <ChevronLeft className="mr-2 w-4 h-4" /> Back
          </Button>
          <Button onClick={onNext} className="bg-linear-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            Generate Prediction <Brain className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
