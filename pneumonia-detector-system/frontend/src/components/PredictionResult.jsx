import { motion } from 'framer-motion';

export default function PredictionResult({ prediction, confidence, imageUrl, heartRate, spo2 }) {
  if (!prediction) return null;

  const normalizedPrediction = String(prediction).toLowerCase();
  const isPneumonia = normalizedPrediction === 'pneumonia' || normalizedPrediction === 'pneumonia detected';
  const predictionColorClass = isPneumonia
    ? 'text-rose-400'
    : normalizedPrediction === 'healthy'
      ? 'text-emerald-400'
      : normalizedPrediction === 'possible early infection'
        ? 'text-orange-400'
        : normalizedPrediction === 'monitor patient'
          ? 'text-amber-400'
          : 'text-[--color-text-primary]';
  const pct = (Number(confidence) * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <h3 className="text-sm font-semibold text-[--color-text-secondary] mb-4">Prediction Result</h3>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Image preview */}
        {imageUrl && (
          <div className="w-full md:w-48 h-48 rounded-xl overflow-hidden border border-white/10">
            <img src={imageUrl} alt="X-Ray" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Result */}
        <div className="flex-1 flex flex-col justify-center gap-4">
          <div>
            <p className="text-xs text-[--color-text-secondary] mb-1">Prediction</p>
            <p className={`text-2xl font-bold ${predictionColorClass}`}>
              {prediction}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-white/10 p-3">
              <p className="text-[--color-text-secondary] text-xs">Heart Rate</p>
              <p className="text-[--color-text-primary] font-semibold">{heartRate ?? '—'} bpm</p>
            </div>
            <div className="rounded-xl border border-white/10 p-3">
              <p className="text-[--color-text-secondary] text-xs">SpO2</p>
              <p className="text-[--color-text-primary] font-semibold">{spo2 ?? '—'}%</p>
            </div>
          </div>

          {/* Confidence bar */}
          <div>
            <div className="flex justify-between text-xs text-[--color-text-secondary] mb-1">
              <span>Confidence</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${isPneumonia
                  ? 'bg-gradient-to-r from-rose-500 to-red-400'
                  : 'bg-gradient-to-r from-emerald-500 to-green-400'
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
