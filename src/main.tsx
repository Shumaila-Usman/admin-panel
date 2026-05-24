import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import RestaurantsPage from './pages/RestaurantsPage';
import RestaurantFormPage from './pages/RestaurantFormPage';
import RestaurantUsersPage from './pages/RestaurantUsersPage';
import OrdersPage from './pages/OrdersPage';
import LiveOrdersPage from './pages/LiveOrdersPage';
import CustomersPage from './pages/CustomersPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { admin, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#666' }}>
        Loading...
      </div>
    );
  }
  if (!admin) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { admin } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={admin ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="restaurants" element={<RestaurantsPage />} />
        <Route path="restaurants/new" element={<RestaurantFormPage />} />
        <Route path="restaurants/:id/edit" element={<RestaurantFormPage />} />
        <Route path="restaurants/:restaurantId/users" element={<RestaurantUsersPage />} />
        <Route path="restaurants/:restaurantId/orders" element={<OrdersPage />} />
        <Route path="restaurants/:restaurantId/customers" element={<CustomersPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="live-orders" element={<LiveOrdersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
