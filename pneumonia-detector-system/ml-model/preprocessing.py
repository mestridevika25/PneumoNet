"""
preprocessing.py
-----------------
Load chest X-ray images, resize to 224×224, normalise pixel values,
and split into train / validation / test sets.

Expected dataset layout:
    dataset/
        train/
            NORMAL/
            PNEUMONIA/
        test/
            NORMAL/
            PNEUMONIA/
"""

import os
import cv2
import numpy as np
from sklearn.model_selection import train_test_split

IMG_SIZE = 224
CLASSES = ["NORMAL", "PNEUMONIA"]


def load_images_from_directory(directory: str):
    """Read every image in *directory*, resize, and return arrays + labels."""
    images, labels = [], []
    for idx, cls in enumerate(CLASSES):
        cls_dir = os.path.join(directory, cls)
        if not os.path.isdir(cls_dir):
            print(f"[WARNING] Directory not found: {cls_dir}")
            continue
        for fname in os.listdir(cls_dir):
            fpath = os.path.join(cls_dir, fname)
            try:
                img = cv2.imread(fpath, cv2.IMREAD_GRAYSCALE)
                if img is None:
                    continue
                img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
                images.append(img)
                labels.append(idx)
            except Exception as exc:
                print(f"[SKIP] {fpath}: {exc}")
    return np.array(images), np.array(labels)


def preprocess(dataset_path: str = "dataset", val_split: float = 0.2):
    """
    Returns
    -------
    X_train, X_val, X_test, y_train, y_val, y_test
        All images are float32 in [0, 1] with shape (N, 224, 224, 1).
    """
    train_dir = os.path.join(dataset_path, "train")
    test_dir = os.path.join(dataset_path, "test")

    print("[INFO] Loading training images …")
    X_train_full, y_train_full = load_images_from_directory(train_dir)

    print("[INFO] Loading test images …")
    X_test, y_test = load_images_from_directory(test_dir)

    # Normalise to [0, 1] and add channel dimension
    X_train_full = X_train_full.astype("float32") / 255.0
    X_test = X_test.astype("float32") / 255.0

    X_train_full = np.expand_dims(X_train_full, axis=-1)
    X_test = np.expand_dims(X_test, axis=-1)

    # Train / validation split
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_full, y_train_full, test_size=val_split, random_state=42, stratify=y_train_full
    )

    print(f"[INFO] Train: {X_train.shape[0]}  Val: {X_val.shape[0]}  Test: {X_test.shape[0]}")
    return X_train, X_val, X_test, y_train, y_val, y_test


if __name__ == "__main__":
    X_train, X_val, X_test, y_train, y_val, y_test = preprocess()
    print("Preprocessing complete.")
