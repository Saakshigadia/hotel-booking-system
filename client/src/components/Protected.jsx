import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Protected({ children, admin = false }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <p className="center muted">Loading…</p>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}
