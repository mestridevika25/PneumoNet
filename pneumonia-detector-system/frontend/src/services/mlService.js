import axios from 'axios';

const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';

export const predictXray = async (imageFile, heartRate = 0, spO2 = 0) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('heart_rate', Math.round(heartRate || 0));
  formData.append('spo2', Math.round(spO2 || 0));

  const response = await axios.post(`${ML_API_URL}/predict`, formData, { timeout: 30000 });

  return response.data;
};

export const checkApiHealth = async () => {
  try {
    const response = await axios.get(`${ML_API_URL}/health`, { timeout: 5000 });
    return response.data;
  } catch {
    return { status: 'offline', model_loaded: false };
  }
};
