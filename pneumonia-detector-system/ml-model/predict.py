"""
predict.py
----------
Single-image prediction utility.
"""

import os
import sys
import cv2
import numpy as np
from tensorflow.keras.models import load_model

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "pneumonia_densenet_model.h5")
IMG_SIZE = 224
CLASSES = ["Normal", "Pneumonia"]


def predict_image(image_path: str, model=None):
    """
    Predict whether a chest X-ray shows Pneumonia.

    Returns
    -------
    dict  { "prediction": str, "confidence": float }
    """
    if model is None:
        model = load_model(MODEL_PATH)

    img = cv2.imread(image_path, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError(f"Cannot read image: {image_path}")

    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
    img = img.astype("float32") / 255.0
    img = np.expand_dims(img, axis=0)  # (1, 224, 224, 3)

    # Keep compatibility for grayscale models.
    input_shape = getattr(model, "input_shape", None)
    channels = input_shape[-1] if isinstance(input_shape, tuple) and len(input_shape) >= 4 else None
    if channels == 1:
        img = np.mean(img, axis=-1, keepdims=True)

    pred = np.array(model.predict(img, verbose=0)).squeeze()

    if pred.ndim == 0 or (pred.ndim == 1 and pred.shape[0] == 1):
        prob = float(pred if pred.ndim == 0 else pred[0])
        label = CLASSES[int(prob > 0.5)]
        confidence = float(prob) if label == "Pneumonia" else float(1 - prob)
    elif pred.ndim == 1 and pred.shape[0] >= 2:
        idx = int(np.argmax(pred[:2]))
        label = CLASSES[idx]
        confidence = float(pred[idx])
    else:
        raise ValueError(f"Unexpected model output shape: {np.array(pred).shape}")

    return {"prediction": label, "confidence": round(confidence, 4)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python predict.py <image_path>")
        sys.exit(1)
    result = predict_image(sys.argv[1])
    print(result)
