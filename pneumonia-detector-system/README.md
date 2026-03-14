# 🫁 PneumoAI — AI + IoT Based Pneumonia Detection System

An intelligent healthcare monitoring system that combines **Machine Learning**, **IoT vital monitoring**, and a **modern React dashboard** for real-time pneumonia detection and patient vitals tracking.

---

## ✨ Features

- **AI-Powered Diagnosis** — Upload chest X-rays and get instant pneumonia predictions via a CNN model
- **Real-Time Vitals** — Heart Rate and SpO2 monitoring via ESP8266 + MAX30100 sensor
- **Cloud Storage** — Firebase Firestore, Realtime Database, and Storage
- **Modern Dashboard** — Glassmorphism, dark theme, Framer Motion animations
- **Patient Management** — Full CRUD with Firestore
- **Secure Authentication** — Firebase Email/Password auth with protected routes

---

## 🏗️ Architecture

```
IoT Layer          Cloud Layer              Frontend Layer
───────────        ─────────────            ──────────────
MAX30100 ──→       Firebase Realtime DB     React + Vite
ESP8266    ──→     Firestore               TailwindCSS
WiFi       ──→     Firebase Storage         Framer Motion
                    Firebase Auth            Recharts

ML Layer
───────────
Chest X-ray CNN ──→ FastAPI API ──→ Dashboard
```

See [docs/architecture.md](docs/architecture.md) for detailed data flow.

---

## 📂 Project Structure

```
pneumonia-detector-system/
├── frontend/           # React + Vite dashboard
│   ├── src/
│   │   ├── components/ # Sidebar, Navbar, VitalsCard, VitalsChart, etc.
│   │   ├── pages/      # Dashboard, Patients, XrayUpload, Predictions, DeviceMonitor
│   │   ├── services/   # Firebase init, Firestore CRUD, ML API calls
│   │   └── context/    # AuthContext
│   └── .env.example
├── ml-model/           # Python ML pipeline
│   ├── preprocessing.py
│   ├── train_model.py
│   ├── evaluate_model.py
│   ├── predict.py
│   ├── api_server.py   # FastAPI prediction server
│   └── requirements.txt
├── iot/                # ESP8266 firmware
│   └── esp8266_max30100.ino
├── backend/            # Firebase config & rules
│   ├── firebaseConfig.js
│   └── firestore.rules
├── docs/               # Documentation
│   ├── architecture.md
│   └── setup.md
└── README.md
```

---

## 🚀 Quick Start

### 1. Frontend

```bash
cd frontend
cp .env.example .env   # fill in Firebase credentials
npm install
npm run dev            # → http://localhost:5173
```

### 2. ML API

```bash
cd ml-model
pip install -r requirements.txt

# Train (requires dataset — see docs/setup.md)
python train_model.py

# Start API
python api_server.py   # → http://localhost:8000
```

### 3. IoT

Open `iot/esp8266_max30100.ino` in Arduino IDE, set WiFi + Firebase credentials, and upload to ESP8266.

---

## 📖 Full Setup

See [docs/setup.md](docs/setup.md) for the complete step-by-step guide covering Firebase configuration, model training, IoT wiring, and deployment.

---

## 🛠️ Tech Stack

| Layer      | Technologies                                      |
|------------|----------------------------------------------------|
| Frontend   | React, Vite, TailwindCSS, Framer Motion, Recharts |
| Backend    | Firebase Auth, Firestore, RT Database, Storage     |
| ML         | Python, TensorFlow/Keras, FastAPI, OpenCV          |
| IoT        | ESP8266 NodeMCU, MAX30100, Arduino                 |

---

## 📄 License

MIT
