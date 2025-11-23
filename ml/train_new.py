import pandas as pd
import joblib
import json
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

FEATURES = [
    "BMI", "Glucose", "HbA1c", "Insulin", "Cholesterol", "LDL", "HDL",
    "Triglycerides", "Troponin", "ALT", "AST", "Bilirubin", "Creatinine",
    "BUN", "CRP", "Hemoglobin", "Hematocrit", "RBC", "MCV", "WBC",
    "Platelets", "SystolicBP", "DiastolicBP", "Cholesterol_HDL_Ratio"
]

TARGET = "Disease"

df = pd.read_csv("data/raw/data1.csv")

X = df[FEATURES]
y = df[TARGET]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

clf = RandomForestClassifier(
    n_estimators=500,
    max_depth=15,
    random_state=42,
    class_weight="balanced"
)

clf.fit(X_train, y_train)

# Save model
os.makedirs("models", exist_ok=True)
joblib.dump(clf, "models/model.joblib")

# Save class mapping
class_mapping = {i: c for i, c in enumerate(clf.classes_)}
os.makedirs("metadata", exist_ok=True)
with open("metadata/class_mapping.json", "w") as f:
    json.dump(class_mapping, f)

print("🎉 Training done! Model updated successfully.")
