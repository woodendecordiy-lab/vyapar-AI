/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import VoiceCalculator from './components/VoiceCalculator';
import BillScanner from './components/BillScanner';
import VoiceToBillGenerator from './components/VoiceToBillGenerator';
import KhataBook from './components/KhataBook';
import Subscription from './components/Subscription';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isSubscribed } = useAuth();
  if (!user || !isSubscribed) {
    return <Navigate to="/subscription" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="calculator" element={<VoiceCalculator />} />
          <Route path="scanner" element={<ProtectedRoute><BillScanner /></ProtectedRoute>} />
          <Route path="generator" element={<ProtectedRoute><VoiceToBillGenerator /></ProtectedRoute>} />
          <Route path="khata" element={<ProtectedRoute><KhataBook /></ProtectedRoute>} />
          <Route path="subscription" element={<Subscription />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
