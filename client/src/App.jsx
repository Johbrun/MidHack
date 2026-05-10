import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import AnnouncementBanner from './components/AnnouncementBanner';
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

export default function App() {
  return (
    <ThemeProvider>
    <BrowserRouter>
      <OnboardingProvider>
      <AuthProvider>
        <CartProvider>
          <OnboardingModal />
          <AnnouncementBanner />
          <div className="geo-bg" />
          <Navbar />
          <div className="relative z-10">
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
          </div>
        </CartProvider>
      </AuthProvider>
      </OnboardingProvider>
    </BrowserRouter>
    </ThemeProvider>
  );
}
