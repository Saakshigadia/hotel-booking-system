import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../AuthContext';
import RoomArt from '../components/RoomArt';
import { isoDay, nights, prettyDate, rupees } from '../utils';

export default function RoomDetails() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [form, setForm] = useState({
    checkIn: params.get('checkIn') || isoDay(7),
    checkOut: params.get('checkOut') || isoDay(9),
    guests: Number(params.get('guests')) || 1,
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => { api.getRoom(id).then((d) => setRoom(d.room)).catch((e) => setError(e.message)); }, [id]);

  const n = nights(form.checkIn, form.checkOut);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function book(e) {
    e.preventDefault();
    if (!user) return navigate('/login', { state: { from: { pathname: `/rooms/${id}` } } });
    setBusy(true); setError('');
    try {
      const { booking } = await api.createBooking({ roomId: id, ...form, guests: Number(form.guests) });
      setDone(booking);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  if (!room) return <main className="wrap">{error ? <p className="alert">{error}</p> : <p className="muted">Loading…</p>}</main>;

  if (done) return (
    <main className="wrap narrow">
      <div className="confirm">
        <p className="eyebrow">Booking confirmed</p>
        <h1>See you soon, {user.name.split(' ')[0]}.</h1>
        <p>{room.name} · {prettyDate(done.checkIn)} to {prettyDate(done.checkOut)} · {done.nights} night{done.nights > 1 ? 's' : ''} · {done.guests} guest{done.guests > 1 ? 's' : ''}</p>
        <p className="total">Total {rupees(done.totalPrice)}, pay at the hotel</p>
        <Link className="btn" to="/bookings">View my bookings</Link>
      </div>
    </main>
  );

  return (
    <main className="wrap detail">
      <div>
        <Link to="/" className="back">← All rooms</Link>
        <RoomArt type={room.type} className="hero-art" />
        <h1>{room.name}</h1>
        <p className="lead">{room.description}</p>
        <h2 className="h3">What's included</h2>
        <ul className="amenities">{room.amenities.map((a) => <li key={a}>{a}</li>)}</ul>
        <p className="muted">Sleeps up to {room.capacity}. Check-in from 2 pm, check-out by 11 am.</p>
      </div>
      <form className="book-box" onSubmit={book}>
        <p><b className="price">{rupees(room.pricePerNight)}</b> <span className="muted">/ night</span></p>
        <label>Check-in<input type="date" value={form.checkIn} min={isoDay(0)} onChange={set('checkIn')} required /></label>
        <label>Check-out<input type="date" value={form.checkOut} min={form.checkIn} onChange={set('checkOut')} required /></label>
        <label>Guests<select value={form.guests} onChange={set('guests')}>
          {Array.from({ length: room.capacity }, (_, i) => i + 1).map((g) => <option key={g}>{g}</option>)}
        </select></label>
        {n > 0 && (
          <div className="summary">
            <span>{rupees(room.pricePerNight)} × {n} night{n > 1 ? 's' : ''}</span>
            <b>{rupees(room.pricePerNight * n)}</b>
          </div>
        )}
        {error && <p className="alert">{error}</p>}
        <button className="btn btn-lg" disabled={busy || n < 1}>{busy ? 'Booking…' : user ? 'Confirm booking' : 'Log in to book'}</button>
        <p className="muted small center">Free cancellation until check-in day.</p>
      </form>
    </main>
  );
}
