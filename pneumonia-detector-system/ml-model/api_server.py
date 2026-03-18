"""
FastAPI prediction server for pneumonia detection.

Endpoints
---------
POST /predict   Upload chest X-ray image and receive:
                { prediction, confidence }
GET  /health    Basic health-check.

Run:
    uvicorn api_server:app --reload
"""

from __future__ import annotations

import io
import os

import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from tensorflow.keras.models import load_model

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "pneumonia_densenet_model.h5")
IMG_SIZE = 224
CLASSES = ["Normal", "Pneumonia"]

app = FastAPI(title="Pneumonia ML API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None


def load_ml_model():
    global model
    if not os.path.exists(MODEL_PATH):
        model = None
        print(f"[ERROR] Model file not found at: {MODEL_PATH}")
        return

    try:
        model = load_model(MODEL_PATH)
        print(f"[INFO] Model loaded from: {MODEL_PATH}")
    except Exception as exc:
        model = None
        print(f"[ERROR] Unable to load model from {MODEL_PATH}: {exc}")


def preprocess_image(file_bytes: bytes) -> np.ndarray:
    # Match training requirements: resize -> normalize -> numpy -> batch dimension.
    pil_img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    img = pil_img.resize((IMG_SIZE, IMG_SIZE))
    arr = np.array(img, dtype="float32") / 255.0
    arr = np.expand_dims(arr, axis=0)

    # Keep compatibility if the loaded model was trained on grayscale inputs.
    if model is not None:
        input_shape = getattr(model, "input_shape", None)
        channels = input_shape[-1] if isinstance(input_shape, tuple) and len(input_shape) >= 4 else None
        if channels == 1:
            arr = np.mean(arr, axis=-1, keepdims=True)

    return arr


def decode_prediction(raw_output: np.ndarray) -> tuple[str, float]:
    output = np.array(raw_output).squeeze()

    if output.ndim == 0:
        prob_pneumonia = float(output)
        label = CLASSES[int(prob_pneumonia > 0.5)]
        confidence = prob_pneumonia if label == "Pneumonia" else (1.0 - prob_pneumonia)
        return label, float(confidence)

    if output.ndim == 1 and output.shape[0] == 1:
        prob_pneumonia = float(output[0])
        label = CLASSES[int(prob_pneumonia > 0.5)]
        confidence = prob_pneumonia if label == "Pneumonia" else (1.0 - prob_pneumonia)
        return label, float(confidence)

    if output.ndim == 1 and output.shape[0] >= 2:
        best_idx = int(np.argmax(output[:2]))
        return CLASSES[best_idx], float(output[best_idx])

    raise ValueError(f"Unexpected model output shape: {np.array(raw_output).shape}")


def adjust_with_vitals(confidence: float, heart_rate: float, spo2: float) -> float:
    risk = float(confidence)
    if spo2 > 0 and spo2 < 94:
        risk += 0.15
    if spo2 > 0 and spo2 < 90:
        risk += 0.10
    if heart_rate > 0 and heart_rate > 100:
        risk += 0.05
    if heart_rate > 0 and heart_rate > 120:
        risk += 0.05
    return min(risk, 0.99)


@app.on_event("startup")
def startup_event():
    load_ml_model()


@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/predict")
async def predict(
    image: UploadFile = File(...),
    heartRate: float = Form(0),
    spO2: float = Form(0),
    patient_id: str = Form(...),
):
    if image is None:
        raise HTTPException(status_code=400, detail='Missing image file. Use field name "image".')

    if not patient_id:
        raise HTTPException(status_code=400, detail='Missing patient_id field.')

    if not np.isfinite(heartRate) or not np.isfinite(spO2):
        raise HTTPException(status_code=400, detail='heartRate and spO2 must be valid numbers.')

    if model is None:
        raise HTTPException(
            status_code=500,
            detail=f"Model is not loaded. Expected file at: {MODEL_PATH}",
        )

    try:
        file_bytes = await image.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded image is empty.")

        processed = preprocess_image(file_bytes)
        raw_pred = model.predict(processed, verbose=0)
        label, confidence = decode_prediction(raw_pred)
        original_confidence = float(confidence)
        adjusted_confidence = adjust_with_vitals(original_confidence, heartRate, spO2)
        final_prediction = "Pneumonia" if adjusted_confidence > 0.5 else "Normal"

        return {
            "prediction": final_prediction,
            "confidence": round(float(adjusted_confidence), 4),
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc
