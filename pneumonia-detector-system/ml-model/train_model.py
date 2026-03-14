"""
train_model.py
--------------
Build a 3-block CNN for binary pneumonia classification,
train it with early stopping, and save the model + plots.
"""

import os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import (
    Conv2D, MaxPooling2D, Flatten, Dense, Dropout, BatchNormalization, Input,
)
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from tensorflow.keras.optimizers import Adam

from preprocessing import preprocess

# ── Hyper-parameters ─────────────────────────────────────────────
IMG_SIZE = 224
EPOCHS = 25
BATCH_SIZE = 32
LEARNING_RATE = 1e-4
MODEL_SAVE_PATH = os.path.join("model", "pneumonia_model.h5")


def build_model():
    """3-block Conv → ReLU → MaxPool CNN followed by Dense layers."""
    model = Sequential([
        Input(shape=(IMG_SIZE, IMG_SIZE, 1)),

        # Block 1
        Conv2D(32, (3, 3), activation="relu", padding="same"),
        BatchNormalization(),
        MaxPooling2D((2, 2)),

        # Block 2
        Conv2D(64, (3, 3), activation="relu", padding="same"),
        BatchNormalization(),
        MaxPooling2D((2, 2)),

        # Block 3
        Conv2D(128, (3, 3), activation="relu", padding="same"),
        BatchNormalization(),
        MaxPooling2D((2, 2)),

        # Classifier head
        Flatten(),
        Dense(256, activation="relu"),
        Dropout(0.5),
        Dense(1, activation="sigmoid"),       # binary output
    ])

    model.compile(
        optimizer=Adam(learning_rate=LEARNING_RATE),
        loss="binary_crossentropy",
        metrics=["accuracy"],
    )
    return model


def plot_history(history, out_dir="model"):
    """Save accuracy and loss curves."""
    os.makedirs(out_dir, exist_ok=True)

    # Accuracy
    plt.figure()
    plt.plot(history.history["accuracy"], label="Train Accuracy")
    plt.plot(history.history["val_accuracy"], label="Val Accuracy")
    plt.title("Model Accuracy")
    plt.xlabel("Epoch")
    plt.ylabel("Accuracy")
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "accuracy.png"))
    plt.close()

    # Loss
    plt.figure()
    plt.plot(history.history["loss"], label="Train Loss")
    plt.plot(history.history["val_loss"], label="Val Loss")
    plt.title("Model Loss")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.legend()
    plt.tight_layout()
    plt.savefig(os.path.join(out_dir, "loss.png"))
    plt.close()
    print(f"[INFO] Plots saved to {out_dir}/")


def main():
    # 1. Load data
    X_train, X_val, X_test, y_train, y_val, y_test = preprocess()

    # 2. Build model
    model = build_model()
    model.summary()

    os.makedirs(os.path.dirname(MODEL_SAVE_PATH), exist_ok=True)

    callbacks = [
        EarlyStopping(monitor="val_loss", patience=5, restore_best_weights=True),
        ModelCheckpoint(MODEL_SAVE_PATH, monitor="val_accuracy", save_best_only=True, verbose=1),
    ]

    # 3. Train
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=EPOCHS,
        batch_size=BATCH_SIZE,
        callbacks=callbacks,
    )

    # 4. Save plots
    plot_history(history)

    # 5. Quick evaluation on test set
    loss, acc = model.evaluate(X_test, y_test, verbose=0)
    print(f"\n[RESULT] Test Accuracy: {acc:.4f}  |  Test Loss: {loss:.4f}")


if __name__ == "__main__":
    main()
