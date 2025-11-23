import sys
sys.path.insert(0, 'src')
from disease_predictor import DiseasePredictor
try:
    p = DiseasePredictor()
    print('Predictor initialized successfully')
    print('Number of features:', len(p.features))
except Exception as e:
    print('Error initializing predictor:', e)
    raise
