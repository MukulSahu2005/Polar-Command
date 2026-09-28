import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppShell, ProtectedRoute } from '@/components/layout';
import LoginPage from '@/features/auth/LoginPage';
import DashboardPage from '@/features/dashboard/DashboardPage';
import DigitalTwinPage from '@/features/digital-twin/DigitalTwinPage';
import OperationsPage from '@/features/operations/OperationsPage';
import AlertsPage from '@/features/alerts/AlertsPage';
import SimulationPage from '@/features/simulation/SimulationPage';
import NotFoundPage from '@/pages/NotFoundPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#0F172A',
            border: '1px solid #E2E8F0',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppShell>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/digital-twin" element={<DigitalTwinPage />} />
                  <Route path="/operations" element={<OperationsPage />} />
                  <Route path="/alerts" element={<AlertsPage />} />
                  <Route path="/simulation" element={<SimulationPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </AppShell>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
