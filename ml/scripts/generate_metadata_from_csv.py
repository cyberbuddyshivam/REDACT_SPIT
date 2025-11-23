# scripts/generate_metadata_from_csv.py
import os, json, pandas as pd
CSV_PATH = "data/raw/data1.csv"
OUT_META = "metadata/features_meta.json"
OUT_ORDER = "metadata/feature_order.json"
OUT_CLASS = "metadata/class_mapping.json"
os.makedirs("metadata", exist_ok=True)
df = pd.read_csv(CSV_PATH)
# find target column
target_col = None
for c in df.columns:
    if c.lower() == "disease" or c.lower().endswith("disease") or c.lower() == "label":
        target_col = c
        break
if target_col is None:
    target_col = df.columns[-1]
features = [c for c in df.columns if c != target_col]
meta = {}
for f in features:
    col = pd.to_numeric(df[f], errors='coerce')
    mn = float(col.min(skipna=True)) if not col.isna().all() else 0.0
    mx = float(col.max(skipna=True)) if not col.isna().all() else 1.0
    if 0.0 <= mn and mx <= 1.0:
        meta[f] = {"min": 0.0, "max": 1.0, "unit": ""}
    else:
        meta[f] = {"min": mn, "max": mx, "unit": ""}
with open(OUT_META,"w",encoding="utf-8") as fh:
    json.dump(meta, fh, indent=2)
with open(OUT_ORDER,"w",encoding="utf-8") as fh:
    json.dump(features, fh, indent=2)
# class mapping inference
labels = list(pd.Series(df[target_col].astype(str).unique()))
is_numeric = all(l.isdigit() for l in labels)
class_map = {}
if is_numeric:
    for i in range(len(labels)):
        class_map[str(i)] = f"Disease_{i}"
else:
    for i,lab in enumerate(labels):
        class_map[str(i)] = lab
with open(OUT_CLASS,"w",encoding="utf-8") as fh:
    json.dump(class_map, fh, indent=2)
print("Wrote metadata/features_meta.json, metadata/feature_order.json, metadata/class_mapping.json")
