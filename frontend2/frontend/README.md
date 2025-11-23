# MediGuard AI - Frontend (Intelligent Triage Assistant)

**MediGuard AI** is a web-based intelligent triage assistant designed to help clinicians quickly assess disease risk by analyzing 24 clinical blood test parameters. The frontend provides an intuitive, step-by-step dashboard for entering patient demographics, clinical data, viewing data normalization results, and receiving multi-disease predictions with detailed medical explainability.

---

## 🩺 Project Overview

MediGuard AI serves as a crucial second opinion for triage nurses and clinicians, enabling:

- **Efficient patient routing** based on AI-driven disease risk predictions
- **Medical explainability** through parameter-level insights (e.g., "Glucose is critically high")
- **Data transparency** by showing how raw clinical inputs are normalized and evaluated

The system predicts multiple diseases including:

- Type 2 Diabetes Mellitus
- Acute Coronary Syndrome / Cardiovascular Disease
- Acute Liver Failure / Hepatitis
- Chronic Kidney Disease (Stage 4-5)
- Metabolic Syndrome

---

## 🚀 Features

### 1. **Patient Information Entry**

- Capture essential demographics: Name, Age, Gender, Blood Group, Mobile
- Clean, user-friendly form validation

### 2. **Clinical Data Entry (24 Parameters)**

- Input raw clinical values across multiple categories:
  - **Metabolic**: Glucose, HbA1c, Insulin
  - **Lipid Profile**: Cholesterol, LDL, HDL, Triglycerides
  - **Blood Count**: Hemoglobin, Platelets, WBC, RBC, Hematocrit
  - **Blood Indices**: MCV, MCH, MCHC
  - **Vitals**: BMI, Blood Pressure (SBP/DBP), Heart Rate
  - **Liver Markers**: ALT, AST
  - **Kidney Markers**: Creatinine
  - **Cardiac Markers**: Troponin
  - **Inflammation**: C-reactive Protein (CRP)
- **Demo Data** auto-fill for testing severe medical cases

### 3. **Data Normalization & Analysis**

- Visual table showing:
  - Observed raw values
  - Normal reference ranges
  - Binary normalization status (0 = Normal, 1 = Abnormal)
- Color-coded status indicators for quick assessment

### 4. **Disease Prediction Dashboard**

- **Probability Scores** for each predicted disease (0-99%)
- **Expandable Disease Cards** with two layers of explainability:
  - **Contributing Factors**: High-level clinical reasons (e.g., "Critical Glucose", "HbA1c indicates diabetes")
  - **Parameter Evidence**: Detailed, parameter-by-parameter insights (e.g., "Glucose is critically high at 760 mg/dL (expected 70-140 mg/dL)")
- **No-Risk Confirmation** when all parameters are within safe ranges

### 5. **Medical Explainability Engine**

- Automatic severity classification: `critical-high`, `very-high`, `high`, `low`, `very-low`, `critical-low`
- Disease-specific parameter mapping to show relevant lab values
- Human-readable descriptions of why each parameter triggered a flag

---

## 🛠️ Tech Stack

| Technology         | Purpose                                  |
| ------------------ | ---------------------------------------- |
| **React 19**       | UI framework with hooks and context      |
| **Vite**           | Fast build tool and dev server           |
| **Tailwind CSS 4** | Utility-first styling                    |
| **Lucide React**   | Modern icon library                      |
| **Context API**    | Global state management for patient data |

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx              # Reusable button component
│   │   │   └── InputField.jsx          # Form input component
│   │   ├── layout/
│   │   │   └── Navbar.jsx              # Progress indicator navbar
│   │   └── medical/
│   │       ├── DiseaseCard.jsx         # Expandable disease prediction card
│   │       └── ResultsTable.jsx        # Parameter normalization table
│   ├── context/
│   │   └── PatientContext.jsx          # Global patient data state
│   ├── data/
│   │   ├── DiseaseRules.jsx            # Disease prediction logic rules
│   │   └── ReferenceRanges.jsx         # 24 clinical parameter definitions
│   ├── hooks/
│   │   └── usePrediction.js            # Disease prediction hook with explainability
│   ├── pages/
│   │   ├── PatientInfo.jsx             # Step 1: Demographics entry
│   │   ├── ClinicalDataEntry.jsx       # Step 2: Lab values input
│   │   ├── AnalysisResults.jsx         # Step 3: Normalization view
│   │   └── DiseasePrediction.jsx       # Step 4: Prediction results
│   ├── utils/
│   │   └── formatting.js               # Value normalization utilities
│   ├── App.jsx                         # Main application orchestrator
│   ├── main.jsx                        # React entry point
│   └── index.css                       # Global styles
├── public/                             # Static assets
├── index.html                          # HTML template
├── vite.config.js                      # Vite configuration
├── tailwind.config.js                  # Tailwind CSS configuration
├── eslint.config.js                    # ESLint rules
└── package.json                        # Dependencies and scripts
```

---

## ⚙️ Installation & Setup

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd MediGuard/frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

---

## 📝 Available Scripts

| Command           | Description                            |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Start Vite development server with HMR |
| `npm run build`   | Build production-ready bundle          |
| `npm run preview` | Preview production build locally       |
| `npm run lint`    | Run ESLint for code quality checks     |

---

## 🔧 Configuration

### Reference Ranges

Clinical parameter definitions are stored in `src/data/ReferenceRanges.jsx`. Each parameter includes:

```javascript
{
  id: "glucose",
  label: "Glucose",
  unit: "mg/dL",
  min: 70,
  max: 140,
  category: "Metabolic"
}
```

### Prediction Logic

Disease prediction rules are implemented in `src/hooks/usePrediction.js`, featuring:

- Rule-based probability scoring
- Disease-specific parameter mapping
- Severity-aware explainability
- Automatic fallback to top abnormal parameters

---

## 🎨 UI/UX Highlights

- **Step-by-step workflow** with visual progress indicator
- **Responsive design** optimized for desktop and tablet
- **Color-coded risk levels**: Green (normal), Orange (moderate), Red (critical)
- **Expandable cards** for progressive disclosure of medical details
- **Accessibility-friendly** with semantic HTML and ARIA labels

---

## 🔗 Integration with Backend

The frontend is designed to work independently with client-side prediction logic, but can be extended to integrate with a backend API for:

- Persistent patient record storage
- ML model-based predictions
- Historical data analytics
- Multi-user authentication

**Expected API Contract** (if backend integration is added):

```javascript
POST /api/v1/patients/predict
Body: {
  demographics: { name, age, gender, bloodGroup, mobile },
  clinicalData: { glucose, hba1c, troponin, ... }
}
Response: {
  predictions: [
    {
      name: "Type 2 Diabetes Mellitus",
      probability: 75,
      reasons: [...],
      parameterFactors: [...]
    }
  ]
}
```

---

## 🧪 Testing the Application

### Using Demo Data

1. Navigate to Step 2 (Clinical Data Entry)
2. Click **"Auto-fill Severe Case (Demo)"** button
3. Proceed through normalization to prediction
4. Observe multiple high-risk disease predictions with detailed factors

### Manual Testing Scenarios

- **Normal Patient**: Enter all values within reference ranges → Expect "No Critical Risks Detected"
- **Diabetic Patient**: High glucose (>200) + HbA1c (>6.5) → Expect diabetes prediction
- **Cardiac Risk**: Troponin > 0.04 → Expect cardiovascular disease alert

---

## 🚧 Future Enhancements

- [ ] Connect to ML model API for real-time predictions
- [ ] Add patient history tracking and comparison
- [ ] Implement PDF export for medical reports
- [ ] Add multi-language support
- [ ] Integrate with Electronic Health Records (EHR) systems
- [ ] Add authentication and role-based access control
- [ ] Implement SHAP-based feature importance visualization

---

## 📄 License

This project is part of the MediGuard AI system. Refer to the main project license for details.

---

## 👥 Contributors

Built as part of the **MediGuard AI: Intelligent Triage Assistant** project.

---

## 📞 Support

For issues, questions, or contributions, please open an issue in the repository or contact the development team.
