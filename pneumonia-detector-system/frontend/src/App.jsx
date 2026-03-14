import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import XrayUploadPage from './pages/XrayUploadPage';
import PredictionsPage from './pages/PredictionsPage';
import DeviceMonitorPage from './pages/DeviceMonitorPage';

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Navbar />
        <main className="app-main-content">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout><DashboardPage /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients"
            element={
              <ProtectedRoute>
                <AppLayout><PatientsPage /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/xray-upload"
            element={
              <ProtectedRoute>
                <AppLayout><XrayUploadPage /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/predictions"
            element={
              <ProtectedRoute>
                <AppLayout><PredictionsPage /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/device-status"
            element={
              <ProtectedRoute>
                <AppLayout><DeviceMonitorPage /></AppLayout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
