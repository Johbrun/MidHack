import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import FloatingMenu from './components/FloatingMenu';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Instructions from './pages/Instructions';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import SendCredits from './pages/SendCredits';
import TopUp from './pages/TopUp';
import AdminDashboard from './pages/AdminDashboard';
import Scoreboard from './pages/Scoreboard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div className="geo-bg" />
          <Navbar />
          <FloatingMenu />
          <div className="relative z-10">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/instructions" element={<Instructions />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/scoreboard" element={<Scoreboard />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/send" element={<ProtectedRoute><SendCredits /></ProtectedRoute>} />
              <Route path="/topup" element={<ProtectedRoute><TopUp /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
