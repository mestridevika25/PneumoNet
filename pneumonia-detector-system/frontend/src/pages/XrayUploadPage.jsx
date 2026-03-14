import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineUpload, HiOutlinePhotograph } from 'react-icons/hi';
import PredictionResult from '../components/PredictionResult';
import {
  addPrediction,
  getPatients,
  getCurrentVitals,
  updatePatient,
} from '../services/firebaseService';

const ML_API_URL = 'http://localhost:8000/predict';

const fileToDataUrl = (inputFile) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to process X-ray image.'));
    reader.readAsDataURL(inputFile);
  });

export default function XrayUploadPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [currentVitals, setCurrentVitals] = useState({ heartRate: null, spo2: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const submitInFlightRef = useRef(false);

  useEffect(() => {
    Promise.all([getPatients(), getCurrentVitals()])
      .then(([rows, vitals]) => {
        setPatients(rows);
        setCurrentVitals(vitals);
        const patientFromState = location.state?.patientId;
        const patientFromQuery = searchParams.get('patient');
        if (patientFromState) {
          setSelectedPatientId(patientFromState);
        } else if (patientFromQuery) {
          setSelectedPatientId(patientFromQuery);
        } else if (rows.length) {
          setSelectedPatientId(rows[0].patient_id || rows[0].id);
        }
      })
      .catch(() => {
        setPatients([]);
      });
  }, [location.state, searchParams]);

  const selectedPatient = patients.find((p) => (p.patient_id || p.id) === selectedPatientId) || null;

  const refreshVitals = async () => {
    const vitals = await getCurrentVitals();
    setCurrentVitals(vitals);
    return vitals;
  };

  const handleFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError('');
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleSubmit = async () => {
    if (loading || submitInFlightRef.current) return;
    if (!file || !selectedPatientId) return;

    submitInFlightRef.current = true;
    setLoading(true);
    setError('');
    try {
      const vitals = await refreshVitals();
      const heartRate = Number(vitals?.heartRate);
      const spo2 = Number(vitals?.spo2);

      if (!Number.isFinite(heartRate) || !Number.isFinite(spo2)) {
        throw new Error('Current HR and SpO2 are unavailable from Firebase. Please check the device stream.');
      }

      const formData = new FormData();
      formData.append('image', file);
      formData.append('heart_rate', String(heartRate));
      formData.append('spo2', String(spo2));
      formData.append('patient_id', String(selectedPatientId));

      const response = await fetch(ML_API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let detail = 'Prediction failed. ML API may be offline.';
        try {
          const body = await response.json();
          detail = body?.detail || detail;
        } catch {
          // Keep generic detail when response body is not JSON.
        }
        throw new Error(detail);
      }

      const prediction = await response.json();
      const predictionTimestamp = Date.now();

      const imageUrl = await fileToDataUrl(file);

      await updatePatient(selectedPatientId, {
        last_hr: heartRate,
        last_spo2: spo2,
        last_prediction: prediction.prediction,
        xray_image: imageUrl,
      });

      try {
        await addPrediction({
          result: prediction.prediction,
          confidence: prediction.confidence,
          xrayUrl: imageUrl,
          patientId: selectedPatientId,
          patientName: selectedPatient?.name || '',
          hr: heartRate,
          spo2,
          timestamp: predictionTimestamp,
        });
      } catch {
        setError('Prediction generated, but saving to Firebase failed. Check Realtime Database rules/connection.');
      }

      setResult({
        ...prediction,
        imageUrl: preview,
        heartRate,
        spo2,
      });
    } catch (err) {
      setError(err.message || 'Prediction failed. ML API may be offline.');
    } finally {
      submitInFlightRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[--color-text-primary]">X-Ray Upload</h1>
        <p className="text-sm text-[--color-text-secondary]">Select patient, capture live vitals, upload chest X-ray, and run AI prediction</p>
      </div>

      <div className="glass-card p-4">
        <label htmlFor="patient-select" className="block text-sm text-[--color-text-secondary] mb-2">
          Select Patient
        </label>
        <select
          id="patient-select"
          className="input-dark"
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
          disabled={!patients.length}
        >
          {patients.length ? (
            patients.map((patient) => {
              const id = patient.patient_id || patient.id;
              return <option key={id} value={id}>{patient.name} ({id})</option>;
            })
          ) : (
            <option value="">No patients found</option>
          )}
        </select>

        <div className="mt-3 text-sm text-[--color-text-primary]">
          Selected Patient: {selectedPatient ? selectedPatient.name : '—'}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <div className="rounded-xl border border-white/10 p-3">
            <p className="text-xs text-[--color-text-secondary]">Heart Rate (from Firebase)</p>
            <p className="text-lg font-semibold text-[--color-text-primary]">{currentVitals.heartRate ?? '—'} bpm</p>
          </div>
          <div className="rounded-xl border border-white/10 p-3">
            <p className="text-xs text-[--color-text-secondary]">SpO2 (from Firebase)</p>
            <p className="text-lg font-semibold text-[--color-text-primary]">{currentVitals.spo2 ?? '—'}%</p>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        className={`glass-card p-10 text-center cursor-pointer transition-all
          ${dragActive ? 'border-[--color-primary] bg-cyan-500/5 glow-cyan' : 'border-dashed border-white/10'}
          border-2 rounded-2xl`}
        onClick={() => document.getElementById('xray-file-input').click()}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="mx-auto max-h-64 rounded-xl border border-white/10" />
        ) : (
          <div className="space-y-3">
            <HiOutlinePhotograph className="w-12 h-12 mx-auto text-[--color-text-secondary]" />
            <p className="text-[--color-text-secondary]">Drag &amp; drop an X-ray image or click to browse</p>
            <p className="text-xs text-[--color-text-secondary]/60">PNG, JPG, JPEG supported</p>
          </div>
        )}
        <input
          id="xray-file-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </motion.div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {file && !result && (
        <button
          id="predict-btn"
          onClick={handleSubmit}
          disabled={loading || !selectedPatientId}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <HiOutlineUpload className="w-5 h-5" />
              Run AI Prediction
            </>
          )}
        </button>
      )}

      {result && (
        <>
          <PredictionResult
            prediction={result.prediction}
            confidence={result.confidence}
            imageUrl={result.imageUrl}
            heartRate={result.heartRate}
            spo2={result.spo2}
          />

          <div className="glass-card p-4 text-sm text-[--color-text-primary]">
            <p>Prediction: {result.prediction}</p>
            <p>Confidence: {Math.round(Number(result.confidence) * 100)}%</p>
          </div>
        </>
      )}
    </div>
  );
}
