import time
import os
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, field_validator
from typing import Optional
from contextlib import asynccontextmanager

# ── Model globals ──────────────────────────────────────────────────────────────
MODEL = None
MODEL_VERSION = os.getenv("MODEL_VERSION", "1.0.0")
MODEL_PATH = os.getenv("MODEL_PATH", "/app/model/model.pkl")

FEATURE_COLUMNS = [
    "no_of_dependents",
    "income_annum",
    "loan_amount",
    "loan_term",
    "cibil_score",
    "residential_assets_value",
    "commercial_assets_value",
    "luxury_assets_value",
    "bank_asset_value",
]

FEATURE_DISPLAY_NAMES = {
    "no_of_dependents": "dependents",
    "income_annum": "income",
    "loan_amount": "loan_amount",
    "loan_term": "loan_term",
    "cibil_score": "credit_score",
    "residential_assets_value": "residential_assets",
    "commercial_assets_value": "commercial_assets",
    "luxury_assets_value": "luxury_assets",
    "bank_asset_value": "bank_assets",
}

COLUMN_DEFAULTS = {
    "no_of_dependents": 0,
    "residential_assets_value": 0,
    "commercial_assets_value": 0,
    "luxury_assets_value": 0,
    "bank_asset_value": 0,
    # NOTE: these four MUST have a real reference value, otherwise the
    # perturbation in compute_shap_approximation replaces the feature with
    # itself (baseline == perturbed_prob), silently zeroing out the impact
    # of what are usually the most decisive features in a credit model.
    # Replace these with the actual mean/median from your training set.
    "income_annum": 5_000_000,
    "loan_amount": 15_000_000,
    "loan_term": 10,
    "cibil_score": 600,
}


# ── Lifespan ───────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global MODEL
    if not os.path.exists(MODEL_PATH):
        raise RuntimeError(f"Model file not found at {MODEL_PATH}")
    with open(MODEL_PATH, "rb") as f:
        MODEL = joblib.load(f)
    print(f"[startup] Model loaded from {MODEL_PATH}")
    yield
    MODEL = None


# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Loan Approval Prediction API",
    description="Predicts loan approval using a pre-trained ML model.",
    version=MODEL_VERSION,
    lifespan=lifespan,
)


# ── Schema ─────────────────────────────────────────────────────────────────────
class LoanRequest(BaseModel):
    no_of_dependents: Optional[int] = None
    income_annum: float
    loan_amount: float
    loan_term: int
    cibil_score: int
    residential_assets_value: Optional[float] = None
    commercial_assets_value: Optional[float] = None
    luxury_assets_value: Optional[float] = None
    bank_asset_value: Optional[float] = None

    @field_validator("cibil_score")
    @classmethod
    def validate_cibil(cls, v):
        if not (300 <= v <= 900):
            raise ValueError("cibil_score must be between 300 and 900")
        return v

    @field_validator("income_annum", "loan_amount")
    @classmethod
    def validate_positive(cls, v):
        if v <= 0:
            raise ValueError("Value must be greater than 0")
        return v

    @field_validator("loan_term")
    @classmethod
    def validate_loan_term(cls, v):
        if v <= 0:
            raise ValueError("loan_term must be greater than 0")
        return v


# ── Helpers ────────────────────────────────────────────────────────────────────
def build_feature_vector(req: LoanRequest) -> pd.DataFrame:
    """Build a 1-row DataFrame aligned to FEATURE_COLUMNS, filling defaults."""
    raw = req.model_dump()
    row = {}
    for col in FEATURE_COLUMNS:
        val = raw.get(col)
        if val is None:
            val = COLUMN_DEFAULTS.get(col, 0)
        row[col] = val
    return pd.DataFrame([row], columns=FEATURE_COLUMNS)


def run_model_inference(model, X: pd.DataFrame):
    """
    Runs both predict() and predict_proba() and returns them consistently.

    IMPORTANT — class mapping for this model:
        class 0 -> approved
        class 1 -> rejected

    pred      -> class predicted by the model (0 = approved, 1 = rejected)
    proba_row -> full probability array for the single row: [prob_class0, prob_class1]
                 e.g. [[90, 10]] means 90% chance of approved (class 0) and
                 10% chance of rejected (class 1).

    We trust `pred` as the source of truth for the decision (it's what the
    model itself would return in production). The probability we report as
    "confidence" is always the value at the index matching `pred` in
    proba_row — i.e. whichever of the two probabilities is higher is the one
    correlated with the predicted class, since predict() and predict_proba()
    are guaranteed to agree on which class "wins".
    """
    pred = int(model.predict(X)[0])           # 0 = approved, 1 = rejected
    proba_row = model.predict_proba(X)[0]      # [prob_class0, prob_class1]

    prob_class0 = float(proba_row[0])  # probability of approved
    prob_class1 = float(proba_row[1])  # probability of rejected

    approved = bool(pred == 0)

    # Probability of approval is always prob_class0, regardless of which
    # class was predicted — this is what gets reported as "probability".
    approved_prob = prob_class0

    # Confidence = probability associated with whichever class was actually
    # predicted (the higher of the two, correlated by index with `pred`).
    confidence = float(proba_row[pred])

    return {
        "pred": pred,
        "approved": approved,
        "approved_prob": approved_prob,
        "confidence": confidence,
        "prob_class0": prob_class0,
        "prob_class1": prob_class1,
    }


def compute_shap_approximation(model, X: pd.DataFrame):
    """
    Lightweight feature-impact approximation via marginal contribution.

    For a StackingClassifier (LogisticRegression + RandomForest + XGBoost,
    final_estimator=LogisticRegression), we compute the marginal impact of
    each feature THREE times — once per base estimator — and average the
    three results. This gives a per-feature impact that reflects the
    consensus across all base models feeding into the meta-estimator,
    rather than only the final stacked probability.

    If `model` is not a StackingClassifier (or has no `estimators_`), we
    fall back to computing the impact directly on `model.predict_proba`.

    Impact is measured with respect to the "approved" class (class 0)
    probability, so a positive impact means the feature pushed the
    prediction toward approval.
    """

    def marginal_impacts(predict_proba_fn, X_row: pd.DataFrame):
        baseline = float(predict_proba_fn(X_row)[0][0])
        result = {}
        for col in FEATURE_COLUMNS:
            X_perturbed = X_row.copy()
            reference_val = COLUMN_DEFAULTS.get(col, X_row[col].values[0])
            X_perturbed[col] = reference_val
            perturbed_prob = float(predict_proba_fn(X_perturbed)[0][0])
            result[col] = float(baseline - perturbed_prob)
        return result

    base_estimators = getattr(model, "estimators_", None)

    if not base_estimators:
        # Not a stacking model (or not fitted with estimators_) — fall back
        # to a single pass on the model itself.
        impacts = marginal_impacts(model.predict_proba, X)
        return {k: round(v, 4) for k, v in impacts.items()}

    per_model_impacts = []
    for estimator in base_estimators:
        if not hasattr(estimator, "predict_proba"):
            continue
        per_model_impacts.append(marginal_impacts(estimator.predict_proba, X))

    if not per_model_impacts:
        # None of the base estimators expose predict_proba — fall back to
        # the stacked model's own probability.
        impacts = marginal_impacts(model.predict_proba, X)
        return {k: round(v, 4) for k, v in impacts.items()}

    averaged = {}
    for col in FEATURE_COLUMNS:
        values = [m[col] for m in per_model_impacts]
        averaged[col] = round(float(np.mean(values)), 4)

    return averaged


def build_explanation(impacts: dict, X: pd.DataFrame):
    factors = []
    for col, impact in impacts.items():
        factors.append({
            "feature": FEATURE_DISPLAY_NAMES.get(col, col),
            "raw_key": col,
            "value": (X[col].values[0].item() if hasattr(X[col].values[0], "item") else X[col].values[0]),
            "impact": impact,
            "direction": "positive" if impact > 0 else ("negative" if impact < 0 else "neutral"),
        })

    factors.sort(key=lambda f: abs(f["impact"]), reverse=True)

    return {
        "impact_direction": "positive impact increases approval probability; negative impact decreases it; values are the estimated change in approval probability if this feature were replaced by a neutral reference value",
        "factors": factors,
    }


def classify_risk(probability: float) -> str:
    if probability >= 0.80:
        return "low"
    elif probability >= 0.55:
        return "medium"
    return "high"


# ── Routes ─────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": MODEL is not None}


@app.post("/predict")
def predict(req: LoanRequest):
    if MODEL is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    start = time.perf_counter()

    X = build_feature_vector(req)

    try:
        result = run_model_inference(MODEL, X)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

    impacts = compute_shap_approximation(MODEL, X)
    explanation = build_explanation(impacts, X)

    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

    input_data = {k: (v.item() if hasattr(v, "item") else v) for k, v in X.iloc[0].to_dict().items()}

    return {
        "input": input_data,
        "decision": {
            "approved": result["approved"],
            "predicted_class": result["pred"],
            "probability": round(result["approved_prob"], 4),
            "risk": classify_risk(result["approved_prob"]),
        },
        "explanation": explanation,
        "metadata": {
            "model_version": MODEL_VERSION,
            "prediction_time_ms": elapsed_ms,
        },
    }