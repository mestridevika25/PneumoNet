import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.metrics import classification_report, confusion_matrix
import numpy as np

model = tf.keras.models.load_model("models/pneumonia_densenet_model.h5")

test_path = "dataset/chest_xray/test"

test_datagen = ImageDataGenerator(rescale=1./255)

test_generator = test_datagen.flow_from_directory(
    test_path,
    target_size=(224,224),
    batch_size=32,
    class_mode='binary',
    shuffle=False
)

predictions = model.predict(test_generator)

predicted_classes = (predictions > 0.5).astype(int)

true_classes = test_generator.classes

print("Classification Report")

print(classification_report(true_classes, predicted_classes))

print("Confusion Matrix")

print(confusion_matrix(true_classes, predicted_classes))