import { useEffect, useState } from 'react';
import { deletePrediction, getPredictions, getPatients } from '../services/firebaseService';

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [preds, patients] = await Promise.all([getPredictions(), getPatients()]);
        const patientMap = new Map(patients.map((p) => [p.patient_id || p.id, p.name]));
        const validPatientIds = new Set(patientMap.keys());

        const orphanPredictions = preds.filter((prediction) => {
          const patientId = prediction.patientId ?? prediction.patient_id;
          return !patientId || !validPatientIds.has(patientId);
        });

        if (orphanPredictions.length) {
          await Promise.all(orphanPredictions.map((prediction) => deletePrediction(prediction.id)));
        }

        const validPredictions = preds.filter((prediction) => {
          const patientId = prediction.patientId ?? prediction.patient_id;
          return patientId && validPatientIds.has(patientId);
        });

        const normalizedPredictions = validPredictions.map((prediction) => ({
          ...prediction,
          patientId: prediction.patientId ?? prediction.patient_id,
          patientName: prediction.patientName
            ?? prediction.patient_name
            ?? (patientMap.get(prediction.patientId ?? prediction.patient_id) ?? ''),
          finalResult: prediction.finalResult ?? prediction.final_result ?? prediction.result ?? prediction.prediction,
          hr: prediction.hr ?? prediction.heart_rate,
          xrayUrl: prediction.xrayUrl ?? prediction.image_url ?? '',
          timestamp: Number(prediction.timestamp ?? 0),
        }));

        const uniquePredictions = normalizedPredictions.filter(
          (value, index, self) =>
            index === self.findIndex(
              (item) => item.patientId === value.patientId && Number(item.timestamp ?? 0) === Number(value.timestamp ?? 0),
            ),
        );

        setPredictions(
          uniquePredictions
            .sort((a, b) => Number(b.timestamp ?? 0) - Number(a.timestamp ?? 0))
            .map((prediction) => ({ ...prediction })),
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[--color-text-primary]">Predictions</h1>
        <p className="text-sm text-[--color-text-secondary]">Prediction result, confidence, vitals, and X-ray preview</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[--color-primary] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : predictions.length === 0 ? (
        <div className="glass-card p-12 text-center text-[--color-text-secondary]">
          No predictions yet. Upload an X-ray to get started.
        </div>
      ) : (
        <div className="space-y-0">
          {predictions.map((p) => {
            const predictionText = p.finalResult || p.prediction || '—';
            const normalizedResult = String(predictionText).toLowerCase();
            const resultColorClass = normalizedResult === 'pneumonia detected' || normalizedResult === 'pneumonia'
              ? 'text-rose-400'
              : normalizedResult === 'healthy' || normalizedResult === 'normal'
                ? 'text-emerald-400'
                : normalizedResult === 'possible early infection'
                  ? 'text-orange-400'
                  : normalizedResult === 'monitor patient'
                    ? 'text-amber-400'
                    : 'text-[--color-text-primary]';
            const confidence = Number(p.confidence);
            const hrValue = Number(p.hr);
            const spo2Value = Number(p.spo2);
            return (
              <div key={`${p.patientId}-${p.timestamp ?? 0}`} className="glass-card p-5 mb-5">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-xs text-[--color-text-secondary]">Patient</p>
                      <p className="text-[--color-text-primary] font-semibold">{p.patientName}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-white/10 p-3">
                        <p className="text-xs text-[--color-text-secondary]">Prediction Result</p>
                        <p className={`font-semibold ${resultColorClass}`}>
                          {predictionText}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/10 p-3">
                        <p className="text-xs text-[--color-text-secondary]">Confidence Score</p>
                        <p className="font-semibold text-[--color-text-primary]">
                          {Number.isFinite(confidence) ? `${(confidence * 100).toFixed(1)}%` : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-white/10 p-3">
                        <p className="text-xs text-[--color-text-secondary]">Heart Rate at Prediction</p>
                        <p className="font-semibold text-[--color-text-primary]">
                          {Number.isFinite(hrValue) && hrValue > 0 ? `${hrValue} bpm` : '— bpm'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/10 p-3">
                        <p className="text-xs text-[--color-text-secondary]">SpO2 at Prediction</p>
                        <p className="font-semibold text-[--color-text-primary]">
                          {Number.isFinite(spo2Value) && spo2Value > 0 ? `${spo2Value}%` : '—%'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="w-full lg:w-56">
                    <p className="text-xs text-[--color-text-secondary] mb-2">X-ray preview</p>
                    {p.xrayUrl ? (
                      <img src={p.xrayUrl} alt="X-Ray" className="w-full h-56 rounded-xl object-cover border border-white/10" />
                    ) : (
                      <div className="h-56 rounded-xl border border-white/10 flex items-center justify-center text-[--color-text-secondary] text-sm">
                        No image available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
