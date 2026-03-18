import serial
import requests
import time

# ── CONFIG ────────────────────────────────────────────────────
SERIAL_PORT = "COM3"        # Change to your ESP8266 port (check Arduino IDE → Tools → Port)
BAUD_RATE   = 115200
FB_HOST     = "ml-based-pneumonia-detector-default-rtdb.asia-southeast1.firebasedatabase.app"
FB_AUTH     = "jT1Tu78RbGtW93vyWtd8xVnPkxQKB7Vf7GPh5up2"
# ─────────────────────────────────────────────────────────────

FIREBASE_URL = f"https://{FB_HOST}/sensor.json?auth={FB_AUTH}"

def send_to_firebase(hr, spo2):
    finger = hr > 40 and spo2 > 70
    data = {
        "heartRate":      hr,
        "spO2":           spo2,
        "fingerDetected": finger,
        "status":         "active" if finger else "no_finger",
        "timestamp":      int(time.time())
    }
    try:
        r = requests.put(FIREBASE_URL, json=data, timeout=5)
        if r.status_code == 200:
            print(f"  Firebase OK → HR:{hr} SpO2:{spo2}")
        else:
            print(f"  Firebase error: {r.status_code}")
    except Exception as e:
        print(f"  Firebase exception: {e}")

print(f"Connecting to {SERIAL_PORT}...")
ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=2)
print("Connected. Reading sensor...\n")

while True:
    try:
        line = ser.readline().decode("utf-8", errors="ignore").strip()
        if not line:
            continue

        # Print everything from sensor
        print(line)

        # Only parse DATA lines
        if line.startswith("DATA:"):
            parts = line.split(":")
            if len(parts) == 3:
                hr   = float(parts[1])
                spo2 = float(parts[2])
                send_to_firebase(hr, spo2)

    except KeyboardInterrupt:
        print("\nStopped.")
        ser.close()
        break
    except Exception as e:
        print(f"Error: {e}")