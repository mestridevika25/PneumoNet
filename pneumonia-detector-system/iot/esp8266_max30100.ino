/*
 * ============================================================
 *  ESP8266 + MAX30100 — Pneumonia Detection IoT Vital Monitor
 * ============================================================
 *
 * Reads heart rate & SpO2 from a MAX30100 pulse oximeter sensor
 * and pushes the data to Firebase Realtime Database every 5 s.
 *
 * Libraries required (install via Arduino Library Manager):
 *   • MAX30100_PulseOximeter  (by OXullo Intersecans)
 *   • FirebaseESP8266         (by Mobizt)
 *
 * Board: ESP8266 (NodeMCU 1.0 / Wemos D1 Mini)
 *
 * Wiring:
 *   MAX30100  →  ESP8266
 *   SDA        →  D2 (GPIO4)
 *   SCL        →  D1 (GPIO5)
 *   VIN        →  3.3 V
 *   GND        →  GND
 * ============================================================
 */

#include <Wire.h>
#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>
#include "MAX30100_PulseOximeter.h"

// ─── USER CONFIG ─────────────────────────────────────────────
#define WIFI_SSID       "YOUR_WIFI_SSID"
#define WIFI_PASSWORD   "YOUR_WIFI_PASSWORD"

#define FIREBASE_HOST   "YOUR_PROJECT.firebaseio.com"
#define FIREBASE_AUTH   "YOUR_FIREBASE_DATABASE_SECRET"

#define DEVICE_ID       "esp8266-001"
#define REPORTING_MS    5000          // push every 5 seconds
// ─────────────────────────────────────────────────────────────

PulseOximeter pox;
FirebaseData   fbData;
FirebaseConfig fbConfig;
FirebaseAuth   fbAuth;

uint32_t lastReport = 0;
float    heartRate   = 0;
float    spO2        = 0;

// Callback fired when a pulse is detected
void onBeatDetected() {
    Serial.println("♥ Beat detected");
}

// ─── SETUP ──────────────────────────────────────────────────
void setup() {
    Serial.begin(115200);
    Serial.println("\n[BOOT] Pneumonia-IoT Vital Monitor");

    // ── Wi-Fi ───────────────────────────────────────────────
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("[WiFi] Connecting");
    while (WiFi.status() != WL_CONNECTED) {
        delay(300);
        Serial.print(".");
    }
    Serial.printf("\n[WiFi] Connected — IP: %s\n",
                  WiFi.localIP().toString().c_str());

    // ── Firebase ────────────────────────────────────────────
    fbConfig.host = FIREBASE_HOST;
    fbConfig.signer.tokens.legacy_token = FIREBASE_AUTH;
    Firebase.begin(&fbConfig, &fbAuth);
    Firebase.reconnectWiFi(true);
    Serial.println("[Firebase] Initialized");

    // ── MAX30100 ────────────────────────────────────────────
    Serial.print("[Sensor] Initializing MAX30100 … ");
    if (!pox.begin()) {
        Serial.println("FAILED! Check wiring.");
        while (1) { delay(1000); }
    }
    pox.setIRLedCurrent(MAX30100_LED_CURR_7_6MA);
    pox.setOnBeatDetectedCallback(onBeatDetected);
    Serial.println("OK");
}

// ─── LOOP ───────────────────────────────────────────────────
void loop() {
    pox.update();

    if (millis() - lastReport > REPORTING_MS) {
        heartRate = pox.getHeartRate();
        spO2      = pox.getSpO2();

        Serial.printf("[DATA] HR: %.1f bpm  |  SpO2: %.1f %%\n",
                      heartRate, spO2);

        // Build Firebase path
        String basePath = String("/vitals/") + DEVICE_ID;

        Firebase.setFloat(fbData, basePath + "/heart_rate", heartRate);
        Firebase.setFloat(fbData, basePath + "/spo2",       spO2);
        Firebase.setString(fbData, basePath + "/device_id",  DEVICE_ID);
        Firebase.setTimestamp(fbData, basePath + "/timestamp");

        // Also push to history log
        String logPath = String("/vitals_log/") + DEVICE_ID;
        FirebaseJson json;
        json.set("heart_rate", heartRate);
        json.set("spo2",       spO2);
        json.set("device_id",  DEVICE_ID);
        json.set(".sv",        "timestamp");   // server timestamp
        Firebase.pushJSON(fbData, logPath, json);

        // Device status
        Firebase.setString(fbData, "/devices/" + String(DEVICE_ID) + "/status", "connected");
        Firebase.setTimestamp(fbData, "/devices/" + String(DEVICE_ID) + "/last_active");

        lastReport = millis();
    }
}
