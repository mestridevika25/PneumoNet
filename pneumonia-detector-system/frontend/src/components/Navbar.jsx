import { useAuth } from '../context/AuthContext';
import { HiOutlineBell } from 'react-icons/hi';

export default function Navbar() {
  const { user } = useAuth();
  const firstName = user?.displayName?.trim() || 'Shreyas';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[--color-border] px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-[--color-text-primary]">
          Welcome back, {firstName}
        </h2>
        <p className="text-xs text-[--color-text-secondary]">
          Pneumonia Detection and Vital Monitoring Workflow
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 rounded-xl hover:bg-[#FFE7E1] text-[--color-text-secondary] hover:text-[--color-primary-dark] transition-colors">
          <HiOutlineBell className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[--color-primary] to-[--color-primary-dark] flex items-center justify-center text-white text-sm font-bold">
          {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
}
