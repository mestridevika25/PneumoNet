import tensorflow as tf
import numpy as np
import cv2

# load trained model
model = tf.keras.models.load_model("models/pneumonia_densenet_model.h5")

# example sensor values
heart_rate = 95
spo2 = 92

# read x-ray image
img = cv2.imread("sample_xray.jpeg")

img = cv2.resize(img,(224,224))
img = img / 255.0
img = np.reshape(img,(1,224,224,3))

# make prediction
prediction = model.predict(img)[0][0]

# x-ray classification
if prediction > 0.5:
    xray_result = "PNEUMONIA"
else:
    xray_result = "NORMAL"

print("X-ray Result:", xray_result)

# apply decision logic
if xray_result == "PNEUMONIA":
    final_result = "Pneumonia detected"

elif xray_result == "NORMAL" and spo2 < 94:
    final_result = "Possible early infection"

elif xray_result == "NORMAL" and 60 <= heart_rate <= 100:
    final_result = "Healthy"

else:
    final_result = "Monitor patient condition"

print("Final Diagnosis:", final_result)
print("Confidence:", prediction)