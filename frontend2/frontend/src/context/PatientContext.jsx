import React, { createContext, useState, useEffect } from "react";
import { REFERENCE_RANGES } from "../data/ReferenceRanges";
import { saveParameters } from "../services/api";

export const PatientContext = createContext();

export const PatientProvider = ({ children }) => {
  const [demographics, setDemographics] = useState({
    name: "",
    age: "",
    gender: "Male",
    bloodGroup: "A+",
    mobile: "",
  });

  const [clinicalData, setClinicalData] = useState({});
  const [savedParameterId, setSavedParameterId] = useState(null);

  // Initialize clinical data with empty strings
  useEffect(() => {
    const initial = {};
    REFERENCE_RANGES.forEach((p) => (initial[p.id] = ""));
    setClinicalData(initial);
  }, []);

  const updateDemographics = (field, value) => {
    setDemographics((prev) => ({ ...prev, [field]: value }));
  };

  const updateClinicalData = (id, value) => {
    setClinicalData((prev) => ({ ...prev, [id]: value }));
  };

  // Save clinical parameters to backend
  const saveClinicalParameters = async (patientId = null) => {
    try {
      // Filter out empty values and convert to numbers
      const parametersToSave = {};
      Object.entries(clinicalData).forEach(([key, value]) => {
        if (value && value !== "") {
          parametersToSave[key] = parseFloat(value);
        }
      });

      // Only save if we have at least some parameters
      if (Object.keys(parametersToSave).length > 0) {
        const response = await saveParameters({
          patientId,
          parameters: parametersToSave,
        });

        setSavedParameterId(response.data._id);
        console.log("Parameters saved successfully:", response.data);
        return response.data;
      }
    } catch (error) {
      console.error("Error saving parameters:", error.message);
      throw error;
    }
  };

  const loadDemoData = () => {
    setClinicalData({
      bmi: "23",
      glucose: "95",
      hba1c: "5.1",
      insulin: "12",
      cholesterol: "170",
      ldl: "90",
      hdl: "55",
      triglycerides: "120",
      troponin: "0.01",
      alt: "22",
      ast: "21",
      bilirubin: "0.7",
      creatinine: "0.9",
      bun: "14",
      crp: "2",
      hemoglobin: "14.5",
      hematocrit: "44",
      rbc: "4.8",
      mcv: "90",
      wbc: "7.0",
      platelets: "260",
      systolicBP: "118",
      diastolicBP: "78",
      cholesterolHDLRatio: "3.1",
    });
  };

  const resetPatientData = () => {
    setDemographics({
      name: "",
      age: "",
      gender: "Male",
      bloodGroup: "A+",
      mobile: "",
    });
    const initial = {};
    REFERENCE_RANGES.forEach((p) => (initial[p.id] = ""));
    setClinicalData(initial);
    setSavedParameterId(null);
  };

  return (
    <PatientContext.Provider
      value={{
        demographics,
        updateDemographics,
        clinicalData,
        updateClinicalData,
        loadDemoData,
        resetPatientData,
        saveClinicalParameters,
        savedParameterId,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};
