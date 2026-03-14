import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineHeart, HiOutlineStatusOnline, HiOutlineShieldCheck, HiOutlineChip } from 'react-icons/hi';
import VitalsCard from '../components/VitalsCard';
import VitalsChart from '../components/VitalsChart';
import DeviceStatus from '../components/DeviceStatus';
import { onVitalsUpdate, onVitalsLog, onDeviceStatus, onLatestPrediction } from '../services/firebaseService';

const DEVICE_ID = 'esp8266-001';

const formatMetric = (value, digits = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(digits) : '—';
};

export default function DashboardPage() {
  const [vitals, setVitals] = useState({ heartRate: null, spo2: null });
  const [vitalsLog, setVitalsLog] = useState([]);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [latestPrediction, setLatestPrediction] = useState(null);

  useEffect(() => {
    const unsubVitals = onVitalsUpdate(DEVICE_ID, setVitals);
    const unsubVitalsLog = onVitalsLog(DEVICE_ID, setVitalsLog);
    const unsubDevice = onDeviceStatus(DEVICE_ID, setDeviceInfo);
    const unsubLatestPrediction = onLatestPrediction(setLatestPrediction);

    return () => {
      unsubVitals();
      unsubVitalsLog();
      unsubDevice();
      unsubLatestPrediction();
    };
  }, []);

  const cards = [
    { title: 'Heart Rate', value: formatMetric(vitals?.heart_rate ?? vitals?.heartRate), unit: 'bpm', icon: HiOutlineHeart, color: 'rose' },
    { title: 'SpO2 Level', value: formatMetric(vitals?.spo2), unit: '%', icon: HiOutlineStatusOnline, color: 'cyan' },
    {
      title: 'Last Prediction',
      value: latestPrediction?.prediction || '—',
      icon: HiOutlineShieldCheck,
      color: 'purple',
      subtitle: latestPrediction ? `${(Number(latestPrediction.confidence) * 100).toFixed(0)}% confidence` : '',
    },
    { title: 'Device Status', value: String(deviceInfo?.status).toLowerCase() === 'connected' ? 'Connected' : 'Offline', icon: HiOutlineChip, color: 'emerald' },
  ];

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[--color-text-primary]">Dashboard</h1>
        <p className="text-sm text-[--color-text-secondary]">Live vitals from ESP8266 + MAX30100 and latest AI summary</p>
      </div>

      {/* Stats Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
      >
        {cards.map((c) => (
          <VitalsCard key={c.title} {...c} />
        ))}
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <VitalsChart
          title="Heart Rate Over Time"
          data={vitalsLog}
          dataKey="heart_rate"
          color="#ff8a65"
          unit=" bpm"
        />
        <VitalsChart
          title="SpO2 Over Time"
          data={vitalsLog}
          dataKey="spo2"
          color="#ff6b4a"
          unit="%"
        />
      </div>

      {/* Device Status */}
      <DeviceStatus
        status={deviceInfo?.status}
        lastActive={deviceInfo?.last_active}
      />
    </div>
  );
}
