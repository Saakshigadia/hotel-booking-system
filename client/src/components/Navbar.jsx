import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { isDemo } from '../api/client';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="nav">
      {isDemo && <div className="demo-bar">Demo mode: bookings are saved in your browser only. Admin login: admin@saakshistays.test / admin123</div>}
      <div className="nav-in">
        <Link to="/" className="brand"><span aria-hidden="true">🏨</span> Saakshi Stays</Link>
        <nav>
          <NavLink to="/" end>Rooms</NavLink>
          {user && <NavLink to="/bookings">My bookings</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
          {user
            ? <button className="link" onClick={() => { signOut(); navigate('/'); }}>Log out</button>
            : <NavLink to="/login" className="btn btn-sm">Log in</NavLink>}
        </nav>
      </div>
    </header>
  );
}
