import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import NudgeBanner from './components/NudgeBanner';
import AnnouncementBanner from './components/AnnouncementBanner';
import FreezeOverlay from './components/FreezeOverlay';
import ProtectedRoute from './components/ProtectedRoute';
import OnboardingModal from './components/OnboardingModal';
import { OnboardingProvider } from './context/OnboardingContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import { Navigate } from 'react-router-dom';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import SendCredits from './pages/SendCredits';
import TopUp from './pages/TopUp';
import AdminDashboard from './pages/AdminDashboard';
import Subscription from './pages/Subscription';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <OnboardingProvider>
      <AuthProvider>
        <CartProvider>
          <OnboardingModal />
          <AnnouncementBanner />
          <FreezeOverlay />
          <NudgeBanner />
          <Navbar />
          <main className="min-h-[60vh]">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/me" element={<Navigate to="/dashboard" replace />} />
              <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
              <Route path="/send" element={<ProtectedRoute><SendCredits /></ProtectedRoute>} />
              <Route path="/topup" element={<ProtectedRoute><TopUp /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </main>
          <Footer />
        </CartProvider>
      </AuthProvider>
      </OnboardingProvider>
    </BrowserRouter>
  );
}
