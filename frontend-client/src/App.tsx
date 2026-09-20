import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderStatusPage } from './pages/OrderStatusPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { OrderHistoryPage } from './pages/OrderHistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { AuditPage } from './pages/AuditPage';
import { DigestPage } from './pages/DigestPage';
import { WishlistPage } from './pages/WishlistPage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { SupportFaqPage } from './pages/SupportFaqPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminRegisterPage } from './pages/AdminRegisterPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-sky-500 selection:text-white">
        <Header />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            {/* Discovery & Shopping */}
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<CatalogPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />

            {/* Cart & Checkout */}
            <Route path="/cart" element={<CartPage />} />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route path="/orders/:id/status" element={<OrderStatusPage />} />
            <Route path="/orders/:id/confirmation" element={<OrderConfirmationPage />} />

            {/* Auth & Security */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/admin/provision" element={<AdminRegisterPage />} />
            <Route path="/admin/register" element={<AdminRegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ForgotPasswordPage />} />

            {/* Protected Account Area */}
            <Route
              path="/account/orders"
              element={
                <ProtectedRoute>
                  <OrderHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Public Support & FAQs */}
            <Route path="/support" element={<SupportFaqPage />} />
            <Route path="/faq" element={<SupportFaqPage />} />

            {/* Administrator Only Area */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="ROLE_ADMIN">
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-health"
              element={
                <ProtectedRoute requiredRole="ROLE_ADMIN">
                  <SystemHealthPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit"
              element={
                <ProtectedRoute requiredRole="ROLE_ADMIN">
                  <AuditPage />
                </ProtectedRoute>
              }
            />
            <Route path="/digest" element={<DigestPage />} />

            {/* 404 Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
};
