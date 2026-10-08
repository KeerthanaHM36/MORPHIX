import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ServiceRequestsPage } from './pages/ServiceRequestsPage';
import { ServiceRequestDetailPage } from './pages/ServiceRequestDetailPage';
import { ExceptionsPage } from './pages/ExceptionsPage';
import { SimulationLabPage } from './pages/SimulationLabPage';
import { TechnicianPortalPage } from './pages/TechnicianPortalPage';
import { MachinesPage } from './pages/MachinesPage';
import { InventoryPage } from './pages/InventoryPage';
import { TechniciansPage } from './pages/TechniciansPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { CustomerServicePortalPage } from './pages/CustomerServicePortalPage';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0f1d', color: '#94a3b8' }}>
        Initializing MORPHIX Command Interface...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main style={{ flex: 1 }}>{children}</main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route
            path="/"
            element={
              <ProtectedLayout>
                <DashboardPage />
              </ProtectedLayout>
            }
          />
          
          <Route
            path="/customer-portal"
            element={
              <ProtectedLayout>
                <CustomerServicePortalPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/service-requests"
            element={
              <ProtectedLayout>
                <ServiceRequestsPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/service-requests/:id"
            element={
              <ProtectedLayout>
                <ServiceRequestDetailPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/exceptions"
            element={
              <ProtectedLayout>
                <ExceptionsPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/simulation"
            element={
              <ProtectedLayout>
                <SimulationLabPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/technician-portal"
            element={
              <ProtectedLayout>
                <TechnicianPortalPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/machines"
            element={
              <ProtectedLayout>
                <MachinesPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/inventory"
            element={
              <ProtectedLayout>
                <InventoryPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/technicians"
            element={
              <ProtectedLayout>
                <TechniciansPage />
              </ProtectedLayout>
            }
          />

          <Route
            path="/audit-logs"
            element={
              <ProtectedLayout>
                <AuditLogsPage />
              </ProtectedLayout>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
