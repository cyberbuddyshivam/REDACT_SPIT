import Tesseract from "tesseract.js";

/**
 * Parameter patterns for extracting clinical data from OCR text
 */
const PARAMETER_PATTERNS = {
  bmi: /(?:bmi|body\s*mass\s*index)[\s:]*(\d+\.?\d*)/i,
  glucose:
    /(?:glucose|fasting\s*glucose|blood\s*glucose|fbs)[\s:]*(\d+\.?\d*)/i,
  hba1c: /(?:hba1c|glycated\s*hemoglobin|glycohemoglobin)[\s:]*(\d+\.?\d*)/i,
  insulin: /(?:insulin|fasting\s*insulin)[\s:]*(\d+\.?\d*)/i,
  cholesterol: /(?:total\s*cholesterol|cholesterol)[\s:]*(\d+\.?\d*)/i,
  ldl: /(?:ldl|low\s*density\s*lipoprotein)[\s:]*(\d+\.?\d*)/i,
  hdl: /(?:hdl|high\s*density\s*lipoprotein)[\s:]*(\d+\.?\d*)/i,
  triglycerides: /(?:triglycerides?|tg)[\s:]*(\d+\.?\d*)/i,
  troponin: /(?:troponin|troponin[\s-]*[it])[\s:]*(\d+\.?\d*)/i,
  alt: /(?:alt|sgpt|alanine\s*aminotransferase)[\s:]*(\d+\.?\d*)/i,
  ast: /(?:ast|sgot|aspartate\s*aminotransferase)[\s:]*(\d+\.?\d*)/i,
  bilirubin: /(?:bilirubin|total\s*bilirubin)[\s:]*(\d+\.?\d*)/i,
  creatinine: /(?:creatinine|serum\s*creatinine)[\s:]*(\d+\.?\d*)/i,
  bun: /(?:bun|blood\s*urea\s*nitrogen|urea)[\s:]*(\d+\.?\d*)/i,
  crp: /(?:crp|c[\s-]*reactive\s*protein)[\s:]*(\d+\.?\d*)/i,
  hemoglobin: /(?:hemoglobin|hb|hgb)[\s:]*(\d+\.?\d*)/i,
  hematocrit: /(?:hematocrit|hct|pcv)[\s:]*(\d+\.?\d*)/i,
  rbc: /(?:rbc|red\s*blood\s*cells?|erythrocytes?)[\s:]*(\d+\.?\d*)/i,
  mcv: /(?:mcv|mean\s*corpuscular\s*volume)[\s:]*(\d+\.?\d*)/i,
  wbc: /(?:wbc|white\s*blood\s*cells?|leucocytes?)[\s:]*(\d+\.?\d*)/i,
  platelets: /(?:platelets?|plt)[\s:]*(\d+\.?\d*)/i,
  systolicBP: /(?:sbp|systolic|blood\s*pressure.*?(\d{2,3})\s*\/)/i,
  diastolicBP: /(?:dbp|diastolic|blood\s*pressure.*?\/\s*(\d{2,3}))/i,
  cholesterolHDLRatio:
    /(?:cholesterol[\s\/]*hdl\s*ratio|chol[\s\/]*hdl)[\s:]*(\d+\.?\d*)/i,
};

/**
 * Extract text from an image using Tesseract OCR
 * @param {Buffer|string} imagePath - Path to image or image buffer
 * @returns {Promise<string>} Extracted text
 */
export const extractTextFromImage = async (imagePath) => {
  try {
    const result = await Tesseract.recognize(imagePath, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });
    return result.data.text;
  } catch (error) {
    console.error("OCR extraction error:", error);
    throw new Error("Failed to extract text from image");
  }
};

/**
 * Parse clinical data from extracted OCR text
 * @param {string} text - OCR extracted text
 * @returns {Object} Parsed clinical parameter values
 */
export const parseClinicalData = (text) => {
  const extractedData = {};

  // Clean and normalize text
  const normalizedText = text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s.:\/]/g, "");

  // Extract each parameter
  for (const [parameter, pattern] of Object.entries(PARAMETER_PATTERNS)) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      const value = parseFloat(match[1]);
      if (!isNaN(value) && value > 0) {
        extractedData[parameter] = value;
      }
    }
  }

  return extractedData;
};

/**
 * Process uploaded lab report and extract clinical data
 * @param {Buffer|string} imagePath - Path to uploaded image
 * @returns {Promise<Object>} Extracted and parsed clinical data
 */
export const processLabReport = async (imagePath) => {
  try {
    console.log("Starting OCR text extraction...");
    const extractedText = await extractTextFromImage(imagePath);

    console.log("Parsing clinical data from text...");
    const clinicalData = parseClinicalData(extractedText);

    const extractedCount = Object.keys(clinicalData).length;
    console.log(`Successfully extracted ${extractedCount} parameters`);

    return {
      extractedData: clinicalData,
      rawText: extractedText,
      parametersFound: extractedCount,
    };
  } catch (error) {
    console.error("Lab report processing error:", error);
    throw error;
  }
};
