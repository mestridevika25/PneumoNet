import { useEffect, useState } from 'react';
import DeviceStatus from '../components/DeviceStatus';
import {
  onDeviceStatus,
} from '../services/firebaseService';

const DEVICE_ID = 'esp8266-001';

const formatTimestamp = (value) => {
  if (!value) return 'N/A';
  if (value?.toDate) return value.toDate().toLocaleString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
};

export default function DeviceMonitorPage() {
  const [deviceInfo, setDeviceInfo] = useState(null);

  useEffect(() => {
    const unsub = onDeviceStatus(DEVICE_ID, setDeviceInfo);

    return () => {
      unsub();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[--color-text-primary]">Device Status</h1>
        <p className="text-sm text-[--color-text-secondary]">ESP8266 telemetry status and latest reading timestamp</p>
      </div>

      <DeviceStatus
        status={deviceInfo?.status}
        lastActive={deviceInfo?.last_active}
      />

      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-[--color-text-primary] mb-3">Device Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[--color-text-secondary] text-xs">Device</p>
            <p className="text-[--color-text-primary]">ESP8266 NodeMCU</p>
          </div>
          <div>
            <p className="text-[--color-text-secondary] text-xs">Sensor</p>
            <p className="text-[--color-text-primary]">MAX30100</p>
          </div>
          <div>
            <p className="text-[--color-text-secondary] text-xs">Device ID</p>
            <p className="text-[--color-text-primary] font-mono">{DEVICE_ID}</p>
          </div>
          <div>
            <p className="text-[--color-text-secondary] text-xs">Last reading timestamp</p>
            <p className="text-[--color-text-primary]">
              {formatTimestamp(deviceInfo?.last_active)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
