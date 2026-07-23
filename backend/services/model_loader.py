from typing import Optional

import joblib


class ModelLoader:
    _model = None
    _version: Optional[str] = None
    _features = [
        "amount",
        "time_of_day",
        "merchant_category",
        "location_mismatch",
        "transaction_velocity",
        "account_age_days",
    ]

    @classmethod
    def load(cls, model_path: str, version: str):
        cls._model = joblib.load(model_path)
        cls._version = version
        print(f"Loaded model {version} from {model_path}")

    @classmethod
    def predict(cls, features: dict) -> tuple[bool, float]:
        if cls._model is None:
            raise ValueError("No model loaded")
        X = [[features[f] for f in cls._features]]
        prediction = cls._model.predict(X)[0]
        confidence = cls._model.predict_proba(X)[0].max()
        return bool(prediction), round(float(confidence), 4)

    @classmethod
    def is_loaded(cls) -> bool:
        return cls._model is not None

    @classmethod
    def get_version(cls) -> Optional[str]:
        return cls._version
