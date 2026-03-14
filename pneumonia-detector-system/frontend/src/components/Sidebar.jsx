import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineViewGrid, HiOutlineUsers, HiOutlineUpload,
  HiOutlineChartBar, HiOutlineStatusOnline, HiOutlineLogout, HiOutlineMenuAlt2,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/',            icon: HiOutlineViewGrid,    label: 'Dashboard' },
  { to: '/patients',    icon: HiOutlineUsers,       label: 'Patients' },
  { to: '/xray-upload', icon: HiOutlineUpload,      label: 'X-Ray Upload' },
  { to: '/predictions', icon: HiOutlineChartBar,    label: 'Predictions' },
  { to: '/device-status', icon: HiOutlineStatusOnline, label: 'Device Status' },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const nextWidth = collapsed ? '70px' : '240px';
    document.documentElement.style.setProperty('--app-sidebar-width', nextWidth);
  }, [collapsed]);

  return (
    <aside
      className="app-sidebar z-40 flex flex-col"
      style={{
        background: '#FFF5F2',
        borderRight: '1px solid #EAEAEA',
      }}
    >
      {/* Brand */}
      <div className="px-3 py-4 border-b border-[--color-border]">
        <div className="flex items-center justify-between gap-2">
          {!collapsed && (
            <div>
              <h1 className="text-lg font-extrabold gradient-text tracking-tight sidebar-brand-title">
                PnuemoNet
              </h1>
              <p className="text-xs text-[--color-text-secondary] mt-1 sidebar-brand-subtitle">
                Doctor Dashboard
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            className="rounded-xl p-2 text-[--color-primary] hover:bg-[#FFE7E1] transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <HiOutlineMenuAlt2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="sidebar-nav flex-1 px-2 py-4 space-y-[14px] overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `sidebar-item relative group flex items-center ${collapsed ? 'justify-center' : 'justify-start'} text-sm font-semibold transition-all duration-200
              ${isActive
                ? 'sidebar-item-active'
                : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-[21px] h-[21px] flex-shrink-0 text-[--color-primary]" />
                {!collapsed && <span className="sidebar-label">{label}</span>}
                {collapsed && (
                  <span className="pointer-events-none absolute left-[78px] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-[#333333] px-2 py-1 text-xs text-white opacity-0 shadow-md group-hover:opacity-100 transition-opacity">
                    {label}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className={`${collapsed ? 'hidden' : 'ml-auto'} w-1.5 h-1.5 rounded-full bg-[--color-primary]`}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-[--color-border]">
        <button
          onClick={logout}
          className={`w-full rounded-xl text-sm font-semibold transition-all ${collapsed ? 'px-3 py-3' : 'px-4 py-3'}
          text-[--color-text-secondary] hover:text-[--color-accent] hover:bg-[#FFE7E1]`}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-3`}>
            <HiOutlineLogout className="w-5 h-5" />
            {!collapsed && <span>Sign Out</span>}
          </div>
        </button>
      </div>
    </aside>
  );
}
