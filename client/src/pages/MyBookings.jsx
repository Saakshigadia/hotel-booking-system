import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { prettyDate, rupees } from '../utils';

export default function MyBookings() {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState('');
  const load = () => api.myBookings().then((d) => setBookings(d.bookings)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function cancel(id) {
    if (!window.confirm('Cancel this booking?')) return;
    try { await api.cancelBooking(id); load(); } catch (e) { setError(e.message); }
  }

  return (
    <main className="wrap narrow">
      <h1>My bookings</h1>
      {error && <p className="alert">{error}</p>}
      {!bookings ? <p className="muted">Loading…</p> : bookings.length === 0 ? (
        <p className="muted">No bookings yet. <Link to="/">Find a room</Link></p>
      ) : bookings.map((b) => (
        <div key={b._id} className={`booking ${b.status}`}>
          <div>
            <h3>{b.room?.name}</h3>
            <p className="muted">{prettyDate(b.checkIn)} → {prettyDate(b.checkOut)} · {b.nights} night{b.nights > 1 ? 's' : ''} · {b.guests} guest{b.guests > 1 ? 's' : ''}</p>
          </div>
          <div className="booking-side">
            <b>{rupees(b.totalPrice)}</b>
            {b.status === 'confirmed'
              ? (new Date(b.checkIn) > new Date() && <button className="link danger" onClick={() => cancel(b._id)}>Cancel</button>)
              : <span className="pill muted">Cancelled</span>}
          </div>
        </div>
      ))}
    </main>
  );
}
