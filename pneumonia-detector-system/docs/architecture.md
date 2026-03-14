# System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLOUD LAYER                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Firebase     │  │  Firestore   │  │  Firebase    │              │
│  │  Auth         │  │  Database    │  │  Storage     │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                  │                       │
│  ┌──────┴─────────────────┴──────────────────┴───────┐              │
│  │              Firebase Realtime DB                  │              │
│  └──────────────────────┬────────────────────────────┘              │
└─────────────────────────┼───────────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    ┌────▼────┐     ┌─────▼─────┐    ┌─────▼─────┐
    │   IoT   │     │  Frontend │    │   ML API  │
    │  Layer  │     │   Layer   │    │   Layer   │
    └────┬────┘     └─────┬─────┘    └─────┬─────┘
         │                │                │
    ESP8266 +        React Vite       FastAPI +
    MAX30100         Dashboard        TF/Keras CNN
```

## Data Flow

### IoT → Firebase
1. MAX30100 sensor reads Heart Rate and SpO2
2. ESP8266 connects to WiFi
3. Data pushed to Firebase Realtime Database every 5 seconds
4. Device status updated in `/devices/` node

### User → ML Prediction
1. User uploads chest X-ray via React dashboard
2. Image sent to FastAPI prediction server
3. CNN model processes the image (224×224 grayscale)
4. Returns `{ prediction, confidence }` JSON
5. Result stored in Firestore `predictions` collection
6. Image stored in Firebase Storage

### Firebase → Frontend (Real-time)
1. React dashboard subscribes to Firebase listeners
2. Vitals cards update in real-time
3. Charts re-render with new data points
4. Device status indicator reflects connectivity

## Database Schema

### Firestore Collections

| Collection    | Fields                                             |
|---------------|----------------------------------------------------|
| `patients`    | name, age, gender, timestamp                       |
| `predictions` | patient_id, prediction, confidence, image_url, timestamp |

### Realtime Database Nodes

| Path                        | Fields                            |
|-----------------------------|-----------------------------------|
| `/vitals/{device_id}`       | heart_rate, spo2, device_id, timestamp |
| `/vitals_log/{device_id}/`  | heart_rate, spo2, device_id (push) |
| `/devices/{device_id}`      | status, last_active               |
