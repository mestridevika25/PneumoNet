import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineUpload, HiOutlinePhotograph } from 'react-icons/hi';
import PredictionResult from '../components/PredictionResult';
import { predictXray } from '../services/mlService';
import {
  addPrediction,
  getPatients,
  listenToSensorData,
  updatePatient,
} from '../services/firebaseService';

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
  const [liveHR, setLiveHR] = useState(0);
  const [liveSpO2, setLiveSpO2] = useState(0);
  const [liveFinger, setLiveFinger] = useState(false);
  const [capturedHR, setCapturedHR] = useState(null);
  const [capturedSpO2, setCapturedSpO2] = useState(null);
  const [captured, setCaptured] = useState(false);
  const capturedHRRef = useRef(null);
  const capturedSpO2Ref = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const submitInFlightRef = useRef(false);

  useEffect(() => {
    Promise.all([getPatients()])
      .then(([rows]) => {
        setPatients(rows);
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

  useEffect(() => {
    const unsubscribe = listenToSensorData((data) => {
      setLiveHR(Number(data.heartRate) || 0);
      setLiveSpO2(Number(data.spO2) || 0);
      setLiveFinger(Boolean(data.fingerDetected));
    });

    return () => unsubscribe();
  }, []);

  const selectedPatient = patients.find((p) => (p.patient_id || p.id) === selectedPatientId) || null;

  const handleFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setCaptured(false);
    setCapturedHR(null);
    setCapturedSpO2(null);
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
      const heartRate = Number(capturedHRRef.current ?? capturedHR ?? 0);
      const spo2 = Number(capturedSpO2Ref.current ?? capturedSpO2 ?? 0);
      const prediction = await predictXray(file, heartRate, spo2);
      const predictionTimestamp = Date.now();

      const imageUrl = await fileToDataUrl(file);

      await updatePatient(selectedPatientId, {
        last_hr: heartRate,
        last_spo2: spo2,
        last_prediction: prediction.final_result,
        xray_image: imageUrl,
      });

      try {
        await addPrediction({
          result: prediction.final_result,
          finalResult: prediction.final_result,
          xrayResult: prediction.xray_result,
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
        heart_rate: prediction.heart_rate,
        spo2: prediction.spo2,
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
            <p className="text-lg font-semibold text-[--color-text-primary]">{liveFinger && liveHR > 0 ? liveHR.toFixed(1) : '—'} bpm</p>
          </div>
          <div className="rounded-xl border border-white/10 p-3">
            <p className="text-xs text-[--color-text-secondary]">SpO2 (from Firebase)</p>
            <p className="text-lg font-semibold text-[--color-text-primary]">{liveFinger && liveSpO2 > 0 ? liveSpO2.toFixed(1) : '—'}%</p>
          </div>
        </div>

        <div className="mt-4">
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              if (captured) {
                setCaptured(false);
                setFile(null);
                setPreview(null);
                capturedHRRef.current = null;
                capturedSpO2Ref.current = null;
                return;
              }
              setCapturedHR(liveHR);
              setCapturedSpO2(liveSpO2);
              setCaptured(true);
              capturedHRRef.current = liveHR;
              capturedSpO2Ref.current = liveSpO2;
            }}
            disabled={!liveFinger || liveHR === 0}
            title={!liveFinger || liveHR === 0 ? 'Place finger on sensor to capture' : ''}
          >
            {captured ? '✓ Captured — Re-capture' : '📌 Capture Reading'}
          </button>

          {(!liveFinger || liveHR === 0) && (
            <p className="text-xs text-[--color-text-secondary] mt-2">Place finger on sensor to capture</p>
          )}

          {captured && capturedHR !== null && capturedSpO2 !== null && (
            <p className="text-xs text-emerald-400 mt-2">
              ✓ Vitals captured: HR {Number(capturedHR).toFixed(1)} bpm | SpO2 {Number(capturedSpO2).toFixed(1)} %
            </p>
          )}
        </div>
      </div>

      {captured && capturedHRRef.current !== null ? (
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
      ) : (
        <p className="text-sm text-[--color-text-secondary]">Step 1: Capture vitals above before uploading X-ray</p>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {file && !result && (
        <>
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

          {capturedHR === null && (
            <p className="text-xs text-[--color-text-secondary] mt-2">Capture vitals before running prediction</p>
          )}
        </>
      )}

      {result && (
        <>
          <PredictionResult
            prediction={result.final_result}
            confidence={result.confidence}
            imageUrl={result.imageUrl}
            heartRate={result.heart_rate}
            spo2={result.spo2}
          />

          <div className="glass-card p-4 text-sm text-[--color-text-primary]">
            <p>Prediction: {result.final_result}</p>
            <p>Confidence: {Math.round(Number(result.confidence) * 100)}%</p>
          </div>
        </>
      )}
    </div>
  );
}
