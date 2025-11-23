# ml/src/data_preparation.py
import pandas as pd
from sklearn.model_selection import train_test_split


def load_raw_data(path: str) -> pd.DataFrame:
    """Load raw CSV data"""
    return pd.read_csv(path)


def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    General cleaning:
    - drop duplicates
    - strip column names
    - convert all numeric columns safely
    """
    df = df.copy()

    # Strip whitespace from columns
    df.columns = [c.strip() for c in df.columns]

    # Convert numerics
    for col in df.columns:
        df[col] = pd.to_numeric(df[col], errors="ignore")

    df = df.drop_duplicates()

    return df


def split_data(df: pd.DataFrame, target: str, test_size: float = 0.2):
    """Return X_train, X_test, y_train, y_test"""
    X = df.drop(columns=[target])
    y = df[target]

    return train_test_split(X, y, test_size=test_size, random_state=42)
