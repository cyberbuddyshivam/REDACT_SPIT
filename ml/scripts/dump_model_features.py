import joblib

model_path = "models/mediguard_xgb.joblib"
model = joblib.load(model_path)

print("\nMODEL FEATURE NAMES IN ORDER:")
print(model.get_booster().feature_names)
