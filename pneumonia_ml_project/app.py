from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
import cv2

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"])

# load trained model
model = tf.keras.models.load_model("models/pneumonia_densenet_model.h5")

@app.route("/predict", methods=["POST"])
def predict():

    # get image
    image = request.files["image"]

    # get sensor values from frontend
    heart_rate = int(request.form["heart_rate"])
    spo2 = int(request.form["spo2"])

    # convert image to numpy
    img = cv2.imdecode(
        np.frombuffer(image.read(), np.uint8),
        cv2.IMREAD_COLOR
    )

    # preprocess image
    img = cv2.resize(img, (224,224))
    img = img / 255.0
    img = np.reshape(img, (1,224,224,3))

    # ML prediction
    prediction = model.predict(img)[0][0]

    if prediction > 0.5:
        xray_result = "PNEUMONIA"
    else:
        xray_result = "NORMAL"

    # decision logic
    if xray_result == "PNEUMONIA":
        final_result = "Pneumonia detected"

    elif xray_result == "NORMAL" and spo2 < 94:
        final_result = "Possible early infection"

    elif xray_result == "NORMAL" and 60 <= heart_rate <= 100:
        final_result = "Healthy"

    else:
        final_result = "Monitor patient"

    # send response
    return jsonify({
        "xray_result": xray_result,
        "heart_rate": heart_rate,
        "spo2": spo2,
        "confidence": float(prediction),
        "final_result": final_result
    })


if __name__ == "__main__":
    app.run(debug=True)