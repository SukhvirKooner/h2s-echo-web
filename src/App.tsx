import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ToastViewport } from './components/ui/Toast';
import { useStore } from './store/useStore';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { WorkersPage } from './pages/WorkersPage';
import { WorkerDetailPage } from './pages/WorkerDetailPage';
import { ShiftsPage } from './pages/ShiftsPage';
import { ShiftDetailPage } from './pages/ShiftDetailPage';
import { CartridgesPage, CartridgeDetailPage } from './pages/CartridgesPage';
import { RecordsPage } from './pages/RecordsPage';
import { VerificationPage } from './pages/VerificationPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { LifecyclePage } from './pages/LifecyclePage';
import { ReportsPage } from './pages/ReportsPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { AuditPage } from './pages/AuditPage';
import { SystemPage } from './pages/SystemPage';

function Protected({ children }: { children: React.ReactNode }) {
  const user = useStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <Protected>
              <AppLayout />
            </Protected>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="workers" element={<WorkersPage />} />
          <Route path="workers/:id" element={<WorkerDetailPage />} />
          <Route path="shifts" element={<ShiftsPage />} />
          <Route path="shifts/:id" element={<ShiftDetailPage />} />
          <Route path="cartridges" element={<CartridgesPage />} />
          <Route path="cartridges/:id" element={<CartridgeDetailPage />} />
          <Route path="records" element={<RecordsPage />} />
          <Route path="verification" element={<VerificationPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="lifecycle" element={<LifecyclePage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="monitoring" element={<MonitoringPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="system" element={<SystemPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {/* Toasts on login page too */}
      <ToastViewport />
    </BrowserRouter>
  );
}
