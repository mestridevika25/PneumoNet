import { motion } from 'framer-motion';

const formatTimestamp = (value) => {
  if (!value) return 'N/A';
  if (value?.toDate) return value.toDate().toLocaleString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
};

export default function DeviceStatus({ status, lastActive }) {
  const isConnected = String(status).toLowerCase() === 'connected';

  const formatted = formatTimestamp(lastActive);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-5 flex items-center gap-4"
    >
      <div className={`relative w-4 h-4 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}>
        {isConnected && (
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-[--color-text-primary]">
          ESP8266:&nbsp;
          <span className={isConnected ? 'text-emerald-600' : 'text-red-600'}>
            {isConnected ? 'Connected' : 'Offline'}
          </span>
        </p>
        <p className="text-xs text-[--color-text-secondary]">
          Sensor: MAX30100
        </p>
        <div className="mt-2 text-xs text-[--color-text-secondary]">
          Last reading: <span className="text-[--color-text-primary]">{formatted}</span>
        </div>
      </div>
    </motion.div>
  );
}
