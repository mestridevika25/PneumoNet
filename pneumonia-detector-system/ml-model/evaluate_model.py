"""
evaluate_model.py
-----------------
Load the saved model and evaluate on the test set.
Prints classification report and confusion matrix.
"""

import os
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix
from tensorflow.keras.models import load_model

from preprocessing import preprocess

MODEL_PATH = os.path.join("model", "pneumonia_model.h5")
CLASSES = ["NORMAL", "PNEUMONIA"]


def main():
    _, _, X_test, _, _, y_test = preprocess()

    if not os.path.exists(MODEL_PATH):
        print(f"[ERROR] Model not found at {MODEL_PATH}. Train first.")
        return

    model = load_model(MODEL_PATH)
    print("[INFO] Model loaded successfully.")

    # Predict
    y_pred_prob = model.predict(X_test, verbose=0)
    y_pred = (y_pred_prob > 0.5).astype("int32").flatten()

    # Metrics
    print("\n── Classification Report ──")
    print(classification_report(y_test, y_pred, target_names=CLASSES))

    print("── Confusion Matrix ──")
    cm = confusion_matrix(y_test, y_pred)
    print(cm)

    loss, acc = model.evaluate(X_test, y_test, verbose=0)
    print(f"\nTest Accuracy : {acc:.4f}")
    print(f"Test Loss     : {loss:.4f}")


if __name__ == "__main__":
    main()
