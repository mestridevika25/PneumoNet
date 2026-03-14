import axios from 'axios';

const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';

export const predictXray = async ({ file, patientId, heartRate, spo2 }) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('patient_id', String(patientId ?? ''));
  formData.append('heart_rate', String(heartRate ?? ''));
  formData.append('spo2', String(spo2 ?? ''));

  const response = await axios.post(`${ML_API_URL}/predict`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });

  return response.data; // { prediction, confidence }
};

export const checkApiHealth = async () => {
  try {
    const response = await axios.get(`${ML_API_URL}/health`, { timeout: 5000 });
    return response.data;
  } catch {
    return { status: 'offline', model_loaded: false };
  }
};
