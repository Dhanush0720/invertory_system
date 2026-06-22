import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage'; // Keep login eager — users hit this first

// Lazy-load all authenticated pages — slashes initial JS bundle by ~60%
const Dashboard         = lazy(() => import('./pages/Dashboard'));
const InventoryPage     = lazy(() => import('./pages/InventoryPage'));
const DistributionsPage = lazy(() => import('./pages/DistributionsPage'));
const UsersPage         = lazy(() => import('./pages/UsersPage'));
const MasterDataPage    = lazy(() => import('./pages/MasterDataPage'));
const AuditLogsPage     = lazy(() => import('./pages/AuditLogsPage'));

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <p style={{ color: 'var(--text2)', fontSize: 13 }}>Loading…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

const PrivateRoute = ({ children, adminOnly }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={
              <Suspense fallback={<PageLoader />}><Dashboard /></Suspense>
            } />
            <Route path="inventory" element={
              <Suspense fallback={<PageLoader />}><InventoryPage /></Suspense>
            } />
            <Route path="distributions" element={
              <Suspense fallback={<PageLoader />}><DistributionsPage /></Suspense>
            } />
            <Route path="users" element={
              <PrivateRoute adminOnly>
                <Suspense fallback={<PageLoader />}><UsersPage /></Suspense>
              </PrivateRoute>
            } />
            <Route path="master" element={
              <PrivateRoute adminOnly>
                <Suspense fallback={<PageLoader />}><MasterDataPage /></Suspense>
              </PrivateRoute>
            } />
            <Route path="audit-logs" element={
              <PrivateRoute adminOnly>
                <Suspense fallback={<PageLoader />}><AuditLogsPage /></Suspense>
              </PrivateRoute>
            } />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
