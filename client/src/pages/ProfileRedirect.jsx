import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProfileRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/profile/${user.id}`} replace />;
}
