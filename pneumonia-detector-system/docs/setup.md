# Setup Guide

## Prerequisites

- **Node.js** ≥ 18 and npm
- **Python** ≥ 3.9
- **Arduino IDE** (for IoT firmware)
- **Firebase** project (free Spark plan works)

---

## 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) → Create a new project.
2. Enable **Authentication** → Email/Password sign-in method.
3. Create a **Firestore Database** (start in test mode for dev).
4. Create a **Realtime Database** (for IoT vitals).
5. Enable **Storage** (for X-ray images).
6. Go to **Project Settings → General → Your apps** → Register a web app.
7. Copy the Firebase config values.

---

## 2. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Edit .env with your Firebase config values
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

---

## 3. ML Model Setup

```bash
cd ml-model
pip install -r requirements.txt
```

### Train the Model

1. Download the [Chest X-Ray Pneumonia Dataset](https://www.kaggle.com/datasets/paultimothymooney/chest-xray-pneumonia).
2. Extract to `ml-model/dataset/` so the structure is:
   ```
   dataset/train/NORMAL/
   dataset/train/PNEUMONIA/
   dataset/test/NORMAL/
   dataset/test/PNEUMONIA/
   ```
3. Run training:
   ```bash
   python train_model.py
   ```
4. Evaluate:
   ```bash
   python evaluate_model.py
   ```

### Start the Prediction API

```bash
python api_server.py
```

API runs at http://localhost:8000. Test with:
```bash
curl -X POST -F "file=@test_xray.jpg" http://localhost:8000/predict
```

---

## 4. IoT Setup (ESP8266 + MAX30100)

### Hardware Wiring

| MAX30100 Pin | ESP8266 Pin |
|--------------|-------------|
| SDA          | D2 (GPIO4)  |
| SCL          | D1 (GPIO5)  |
| VIN          | 3.3V        |
| GND          | GND         |

### Firmware Upload

1. Open `iot/esp8266_max30100.ino` in Arduino IDE.
2. Install board: **ESP8266** via Boards Manager.
3. Install libraries via Library Manager:
   - `MAX30100_PulseOximeter`
   - `FirebaseESP8266`
4. Edit the sketch — set your WiFi SSID/password and Firebase credentials.
5. Select Board: **NodeMCU 1.0 (ESP-12E Module)**.
6. Upload and open Serial Monitor (115200 baud).

---

## 5. Deployment

### Frontend → Firebase Hosting

```bash
cd frontend
npm run build
npx firebase-tools deploy --only hosting
```

### ML API → Render / Railway

1. Push `ml-model/` to a Git repo.
2. Deploy to [Render](https://render.com) or [Railway](https://railway.app).
3. Set environment: Python 3.11, start command: `uvicorn api_server:app --host 0.0.0.0 --port $PORT`.
4. Update `VITE_ML_API_URL` in the frontend `.env` with the deployed URL.
