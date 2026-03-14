import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 text-xs border border-[--color-border] shadow-sm">
      <p className="text-[--color-text-secondary]">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function VitalsChart({ data = [], title, dataKey, color = '#06b6d4', unit = '' }) {
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-[--color-text-primary] mb-4">{title}</h3>
      {hasData ? (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(234,234,234,1)" />
            <XAxis dataKey="time" tick={{ fill: '#6b6b6b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b6b6b', fontSize: 11 }} axisLine={false} tickLine={false} unit={unit} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${dataKey})`}
              dot={false}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[260px] flex items-center justify-center text-sm text-[--color-text-secondary] border border-[--color-border] rounded-xl bg-[#fffaf8]">
          Waiting for device telemetry...
        </div>
      )}
    </div>
  );
}
