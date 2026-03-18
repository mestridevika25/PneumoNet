import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineHeart, HiOutlineStatusOnline, HiOutlineShieldCheck, HiOutlineChip } from 'react-icons/hi';
import VitalsCard from '../components/VitalsCard';
import VitalsChart from '../components/VitalsChart';
import DeviceStatus from '../components/DeviceStatus';
import {
  onVitalsUpdate,
  onVitalsLog,
  onDeviceStatus,
  onLatestPrediction,
  listenToSensorData,
} from '../services/firebaseService';

const DEVICE_ID = 'esp8266-001';

const formatMetric = (value, digits = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(digits) : '—';
};

export default function DashboardPage() {
  const [, setVitals] = useState({ heartRate: null, spo2: null });
  const [, setVitalsLog] = useState([]);
  const [, setDeviceInfo] = useState(null);
  const [latestPrediction, setLatestPrediction] = useState(null);
  const [sensor, setSensor] = useState({
    heartRate: 0,
    spO2: 0,
    fingerDetected: false,
    status: 'no_finger',
    timestamp: 0,
  });
  const [hrHistory, setHrHistory] = useState([]);
  const [spo2History, setSpo2History] = useState([]);

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

  useEffect(() => {
    const unsubscribe = listenToSensorData((data) => {
      setSensor(data);

      if (data.fingerDetected && data.heartRate > 0) {
        const time = new Date().toLocaleTimeString();

        setHrHistory((prev) => [
          ...prev.slice(-19),
          { time, value: data.heartRate },
        ]);

        setSpo2History((prev) => [
          ...prev.slice(-19),
          { time, value: data.spO2 },
        ]);
      }
    });

    return () => unsubscribe();
  }, []);

  const cards = [
    {
      title: 'Heart Rate',
      value: sensor.fingerDetected ? formatMetric(sensor.heartRate, 1) : '—',
      unit: 'bpm',
      icon: HiOutlineHeart,
      color: 'rose',
    },
    {
      title: 'SpO2 Level',
      value: sensor.fingerDetected ? formatMetric(sensor.spO2, 1) : '—',
      unit: '%',
      icon: HiOutlineStatusOnline,
      color: 'cyan',
    },
    {
      title: 'Last Prediction',
      value: latestPrediction?.prediction || '—',
      icon: HiOutlineShieldCheck,
      color: 'purple',
      subtitle: latestPrediction ? `${(Number(latestPrediction.confidence) * 100).toFixed(0)}% confidence` : '',
    },
    {
      title: 'Device Status',
      value: sensor.fingerDetected ? 'Online' : 'Offline',
      icon: HiOutlineChip,
      color: sensor.fingerDetected ? 'emerald' : 'rose',
    },
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
          data={hrHistory}
          dataKey="value"
          color="#ff8a65"
          unit=" bpm"
        />
        <VitalsChart
          title="SpO2 Over Time"
          data={spo2History}
          dataKey="value"
          color="#ff6b4a"
          unit="%"
        />
      </div>

      {/* Device Status */}
      <DeviceStatus
        status={sensor.fingerDetected ? 'online' : 'offline'}
        lastActive={sensor.timestamp}
        lastReading={
          sensor.fingerDetected
            ? `${formatMetric(sensor.heartRate, 1)} bpm / ${formatMetric(sensor.spO2, 1)}%`
            : 'N/A'
        }
      />
    </div>
  );
}
