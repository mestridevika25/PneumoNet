import {
  getDatabase, ref as rtdbRef, onValue, get, set, push, update, remove,
} from 'firebase/database';
import { rtdb } from './firebase';

const DEFAULT_DEVICE_ID = 'esp8266-001';
const database = getDatabase();
const vitalsHistory = [];

const asList = (snapshotValue) => {
  if (!snapshotValue || typeof snapshotValue !== 'object') return [];

  return Object.entries(snapshotValue).map(([id, value]) => ({
    id,
    ...(value && typeof value === 'object' ? value : {}),
  }));
};

const sortByTimestampDesc = (rows) => [...rows].sort((a, b) => Number(b.timestamp ?? 0) - Number(a.timestamp ?? 0));

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeVital = (raw = {}) => {
  const heartRate = toNumber(raw.heart_rate ?? raw.heartRate);
  const spo2 = toNumber(raw.spo2 ?? raw.SpO2);
  const timestamp =
    raw.timestamp?.toDate?.() ??
    (typeof raw.timestamp === 'number' ? new Date(raw.timestamp) : null) ??
    (raw.last_active ? new Date(raw.last_active) : null);

  return {
    heartRate,
    spo2,
    timestamp,
    deviceId: raw.deviceId ?? raw.device_id ?? null,
  };
};

const pickLatestReading = (source, preferredDeviceId = DEFAULT_DEVICE_ID) => {
  if (!source || typeof source !== 'object') return null;

  if (preferredDeviceId && source[preferredDeviceId] && typeof source[preferredDeviceId] === 'object') {
    return source[preferredDeviceId];
  }

  const entries = Object.values(source).filter((entry) => entry && typeof entry === 'object');
  if (!entries.length) return null;

  return entries.sort((a, b) => {
    const tsA = Number(a.timestamp ?? a.last_active ?? 0);
    const tsB = Number(b.timestamp ?? b.last_active ?? 0);
    return tsB - tsA;
  })[0];
};

/* ───────── Patients (Realtime DB) ───────── */
const patientsRef = rtdbRef(database, 'patients');

export const addPatient = async (data) => {
  const timestamp = Date.now();
  const payload = {
    ...data,
    age: toNumber(data.age),
    last_hr: toNumber(data.last_hr) ?? 0,
    last_spo2: toNumber(data.last_spo2) ?? 0,
    last_prediction: data.last_prediction ?? 'None',
    last_visit: timestamp,
    timestamp,
  };

  const patientDoc = push(patientsRef);
  await set(patientDoc, payload);
  await update(patientDoc, { patient_id: patientDoc.key });
  return { id: patientDoc.key };
};

export const getPatients = async () => {
  const snap = await get(patientsRef);
  if (!snap.exists()) return [];
  return sortByTimestampDesc(asList(snap.val()));
};

export const getPatient = async (id) => {
  if (!id) return null;
  const snap = await get(rtdbRef(database, `patients/${id}`));
  return snap.exists() ? { id, ...snap.val() } : null;
};

export const updatePatient = (id, data) =>
  update(rtdbRef(database, `patients/${id}`), { ...data, age: toNumber(data.age), last_visit: Date.now() });

export const deletePatient = (id) =>
  remove(rtdbRef(database, `patients/${id}`));

export const onPatientsSnapshot = (callback) => {
  return onValue(patientsRef, (snap) => {
    if (!snap.exists()) {
      callback([]);
      return;
    }
    callback(sortByTimestampDesc(asList(snap.val())));
  });
};

/* ───────── Predictions (Realtime DB) ───────── */
const predsRef = rtdbRef(database, 'predictions');

export const addPrediction = (data) =>
  Promise.resolve().then(async () => {
    const predDoc = push(predsRef);
    const timestamp = toNumber(data.timestamp) ?? Date.now();
    const patientId = data.patientId ?? data.patient_id ?? null;
    const patientName = data.patientName ?? data.patient_name ?? '';
    const result = data.result ?? data.prediction ?? null;
    const confidence = toNumber(data.confidence);
    const hr = toNumber(data.hr ?? data.heart_rate);
    const spo2 = toNumber(data.spo2);
    const xrayUrl = data.xrayUrl ?? data.image_url ?? '';

    const payload = {
      patientId,
      patientName,
      result,
      confidence,
      hr,
      spo2,
      xrayUrl,
      timestamp,
    };

    await set(predDoc, payload);

    if (patientId) {
      await update(rtdbRef(database, `patients/${patientId}`), {
        last_hr: hr,
        last_spo2: spo2,
        last_prediction: result ?? 'None',
        xray_image: xrayUrl,
        last_visit: timestamp,
      });
    }

    await set(rtdbRef(rtdb, 'predictions/latest'), {
        id: predDoc.key,
        prediction: result,
        confidence,
        heart_rate: hr,
        spo2,
        patientId,
        timestamp,
      }).catch(() => {});

    return { id: predDoc.key };
  });

export const deletePrediction = (id) =>
  remove(rtdbRef(database, `predictions/${id}`));

export const deletePredictionsByPatient = async (patientId) => {
  if (!patientId) return;

  const snap = await get(predsRef);
  if (!snap.exists()) return;

  const rows = asList(snap.val());
  const targets = rows.filter((row) => (row.patientId ?? row.patient_id) === patientId);

  if (!targets.length) return;

  await Promise.all(targets.map((row) => deletePrediction(row.id)));
};

export const getPredictions = async () => {
  const snap = await get(predsRef);
  if (!snap.exists()) return [];
  return sortByTimestampDesc(asList(snap.val()));
};

export const getLatestPredictionByPatient = async (patientId) => {
  if (!patientId) return null;
  const patient = await getPatient(patientId);
  if (!patient) return null;
  return {
    prediction: patient.last_prediction ?? 'None',
    heart_rate: toNumber(patient.last_hr),
    spo2: toNumber(patient.last_spo2),
    patient_id: patientId,
  };
};

export const onPredictionsSnapshot = (callback) => {
  return onValue(predsRef, (snap) => {
    if (!snap.exists()) {
      callback([]);
      return;
    }
    callback(sortByTimestampDesc(asList(snap.val())));
  });
};

/* ───────── Vitals (Realtime DB) ───────── */
export const onVitalsUpdate = (_deviceId, callback) => {
  const vitalsPath = rtdbRef(database, '/device_vitals');

  return onValue(vitalsPath, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }

    callback(normalizeVital(snap.val() || {}));
  });
};

export const onVitalsLog = (_deviceId, callback) => {
  const logPath = rtdbRef(database, '/device_vitals');

  return onValue(logPath, (snap) => {
    if (!snap.exists()) {
      callback([]);
      return;
    }

    const vital = normalizeVital(snap.val() || {});
    if (vital.heartRate === null && vital.spo2 === null) {
      callback([]);
      return;
    }

    vitalsHistory.push(vital);

    const entries = vitalsHistory
      .slice(-50)
      .map((entry, idx) => ({
        ...entry,
        time: entry.timestamp ? entry.timestamp.toLocaleTimeString() : `T-${idx + 1}`,
        heart_rate: entry.heartRate,
      }));

    callback(entries);
  });
};

export const getCurrentVitals = async () => {
  const snap = await get(rtdbRef(database, '/device_vitals'));
  if (!snap.exists()) return { heartRate: null, spo2: null, timestamp: null, deviceId: null };
  return normalizeVital(snap.val() || {});
};

/* ───────── Devices ───────── */
export const onDeviceStatus = (deviceId, callback) => {
  const effectiveDeviceId = deviceId || DEFAULT_DEVICE_ID;
  const devicePath = rtdbRef(rtdb, 'devices');

  return onValue(devicePath, (snap) => {
    if (!snap.exists()) {
      callback({
        status: 'offline',
        last_active: null,
        signal_strength: null,
        sensor_health: 'MAX30100',
      });
      return;
    }

    const payload = pickLatestReading(snap.val(), effectiveDeviceId) || {};
    callback({
      status: payload.status ?? 'offline',
      last_active: payload.lastHeartbeat ?? payload.last_active ?? payload.timestamp ?? null,
      signal_strength: payload.signalStrength ?? payload.signal_strength ?? null,
      sensor_health: payload.sensorHealth ?? payload.sensor_health ?? 'MAX30100',
    });
  });
};

export const onLatestPrediction = (callback) => {
  const latestPath = rtdbRef(rtdb, 'predictions/latest');

  return onValue(latestPath, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    const data = snap.val();
    callback(data || null);
  });
};

