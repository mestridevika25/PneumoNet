import { motion } from 'framer-motion';

const glowMap = {
  cyan: 'glow-cyan',
  purple: 'glow-purple',
  rose: 'glow-rose',
  emerald: 'glow-emerald',
};

const borderColors = {
  cyan: 'border-[#ffd6cc]',
  purple: 'border-[#ffd6cc]',
  rose: 'border-[#ffd6cc]',
  emerald: 'border-[#ffd6cc]',
};

const iconBg = {
  cyan: 'bg-[#fff1ed] text-[#ff8a65]',
  purple: 'bg-[#fff1ed] text-[#ff8a65]',
  rose: 'bg-[#fff1ed] text-[#ff8a65]',
  emerald: 'bg-[#fff1ed] text-[#ff8a65]',
};

export default function VitalsCard({ title, value, unit, icon: Icon, color = 'cyan', subtitle }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card glass-card-hover p-5 ${glowMap[color]} ${borderColors[color]} border`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${iconBg[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs text-[--color-text-secondary] font-medium">{subtitle || 'Live'}</span>
      </div>
      <p className="text-2xl font-bold text-[--color-text-primary]">
        {value ?? '—'}
        {unit && <span className="text-sm ml-1 font-normal text-[--color-text-secondary]">{unit}</span>}
      </p>
      <p className="text-xs text-[--color-text-secondary] mt-2">{title}</p>
    </motion.div>
  );
}
