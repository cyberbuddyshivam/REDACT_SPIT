import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import classification_report, accuracy_score
from xgboost import XGBClassifier
from sklearn.utils.class_weight import compute_class_weight

# Paths
DATA_PATH = "data/raw/data1.csv"
MODEL_PATH = "models/model.joblib"
CLASS_MAP_PATH = "metadata/class_mapping.json"
FEATURE_META_PATH = "metadata/features_metadata.json"

def load_dataset():
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATA_PATH}")
    df = pd.read_csv(DATA_PATH)
    return df

def build_feature_metadata(df, features):
    meta = {}
    for col in features:
        min_v = float(df[col].min())
        max_v = float(df[col].max())
        if min_v == max_v:
            max_v += 1
        meta[col] = {"min": min_v, "max": max_v}
    return meta

def train_model():
    print("\n=== 🔥 BALANCED TRAINING STARTED ===\n")

    df = load_dataset()

    # Target column
    target = "Disease"

    # Features = all except Disease
    features = [c for c in df.columns if c != target]

    X = df[features]
    y = df[target]

    # Encode class labels
    classes = sorted(y.unique())
    class_to_idx = {c: i for i, c in enumerate(classes)}
    idx_to_class = {i: c for c, i in class_to_idx.items()}
    y_idx = y.map(class_to_idx)

    # Compute class weights (fix imbalance)
    weights = compute_class_weight(
        class_weight="balanced",
        classes=np.array(list(class_to_idx.values())),
        y=y_idx.values
    )
    class_weights = {i: w for i, w in enumerate(weights)}

    print("Class Weights:", class_weights)

    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_idx, test_size=0.2, random_state=42, stratify=y_idx
    )

    # Scale all numeric features using min-max
    scaler = MinMaxScaler()
    scaler.fit(X_train)

    # Save feature metadata
    feature_meta = build_feature_metadata(df, features)
    os.makedirs("metadata", exist_ok=True)
    with open(FEATURE_META_PATH, "w") as f:
        json.dump(feature_meta, f, indent=2)

    # Scale
    X_train_scaled = scaler.transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train XGBoost with class weights
    model = XGBClassifier(
        n_estimators=500,
        learning_rate=0.05,
        max_depth=6,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="multi:softprob",
        num_class=len(classes),
        eval_metric="mlogloss",
        tree_method="hist",
        scale_pos_weight=None
    )

    # Apply sample weights
    sample_weights = np.array([class_weights[val] for val in y_train])

    model.fit(
        X_train_scaled,
        y_train,
        sample_weight=sample_weights
    )

    # Evaluate
    preds = model.predict(X_test_scaled)
    acc = accuracy_score(y_test, preds)

    print("\n=== RESULTS ===")
    print("Accuracy:", acc)
    print("\nClassification Report:\n", classification_report(y_test, preds))

    # Save Model + Class Mapping
    os.makedirs("models", exist_ok=True)
    joblib.dump(model, MODEL_PATH)

    with open(CLASS_MAP_PATH, "w") as f:
        json.dump(idx_to_class, f, indent=2)

    print("\n🎉 Training Complete!")
    print("📁 Saved model:", MODEL_PATH)
    print("📁 Saved class mapping:", CLASS_MAP_PATH)
    print("📁 Saved feature metadata:", FEATURE_META_PATH)

if __name__ == "__main__":
    train_model()
