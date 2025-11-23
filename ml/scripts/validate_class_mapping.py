# scripts/validate_class_mapping.py
import joblib, json, os, sys
MODEL = "models/mediguard_xgb.joblib"
CLASS_MAP = "metadata/class_mapping.json"
if not os.path.exists(MODEL):
    print("Model not found. Run main.py first.")
    sys.exit(1)
if not os.path.exists(CLASS_MAP):
    print("Class mapping not found.")
    sys.exit(1)
model = joblib.load(MODEL)
classes = getattr(model, "classes_", None)
with open(CLASS_MAP,"r",encoding="utf-8") as f:
    mapping = json.load(f)
print("Model.classes_:", classes)
print("Current metadata/class_mapping.json:", mapping)
if classes is None:
    print("Model has no classes_. Ensure you used XGBClassifier wrapper.")
else:
    orig_names = [mapping.get(str(i), str(i)) for i in range(len(mapping))]
    suggested = {}
    for out_idx, model_label in enumerate(classes):
        try:
            li = int(model_label)
            suggested[str(out_idx)] = orig_names[li] if li < len(orig_names) else str(model_label)
        except Exception:
            suggested[str(out_idx)] = str(model_label)
    print("Suggested mapping aligned to model.classes_:", suggested)
    ans = input("Overwrite metadata/class_mapping.json with suggested mapping? (y/N): ").strip().lower()
    if ans == "y":
        with open(CLASS_MAP,"w",encoding="utf-8") as fh:
            json.dump(suggested, fh, indent=2)
        print("Updated mapping.")
