import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { prettyDate, rupees } from '../utils';

const EMPTY = { name: '', type: 'standard', pricePerNight: 3000, capacity: 2, quantity: 1, description: '', amenities: 'Free Wi-Fi' };

export default function Admin() {
  const [tab, setTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState('');

  const load = () => {
    api.allBookings().then((d) => setBookings(d.bookings)).catch((e) => setMsg(e.message));
    api.getRooms({}).then((d) => setRooms(d.rooms));
  };
  useEffect(load, []);

  const confirmed = bookings.filter((b) => b.status === 'confirmed');
  const revenue = confirmed.reduce((s, b) => s + b.totalPrice, 0);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function addRoom(e) {
    e.preventDefault();
    try {
      await api.createRoom({ ...form, pricePerNight: +form.pricePerNight, capacity: +form.capacity, quantity: +form.quantity,
        amenities: form.amenities.split(',').map((s) => s.trim()).filter(Boolean) });
      setForm(EMPTY); setMsg('Room added'); load();
    } catch (err) { setMsg(err.message); }
  }
  async function remove(id) {
    if (!window.confirm('Remove this room from the website?')) return;
    await api.deleteRoom(id); load();
  }

  return (
    <main className="wrap">
      <h1>Admin dashboard</h1>
      <div className="stats">
        <div><b>{confirmed.length}</b><span>Active bookings</span></div>
        <div><b>{rupees(revenue)}</b><span>Booked revenue</span></div>
        <div><b>{rooms.reduce((s, r) => s + r.quantity, 0)}</b><span>Rooms in hotel</span></div>
      </div>
      <div className="filters">
        <button className={`chip ${tab === 'bookings' ? 'on' : ''}`} onClick={() => setTab('bookings')}>Bookings</button>
        <button className={`chip ${tab === 'rooms' ? 'on' : ''}`} onClick={() => setTab('rooms')}>Rooms</button>
      </div>
      {msg && <p className="note">{msg}</p>}

      {tab === 'bookings' ? (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Guest</th><th>Room</th><th>Dates</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {bookings.length === 0 && <tr><td colSpan="5" className="muted">No bookings yet.</td></tr>}
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td>{b.user?.name}<div className="muted small">{b.user?.email}</div></td>
                  <td>{b.room?.name}</td>
                  <td>{prettyDate(b.checkIn)} → {prettyDate(b.checkOut)}</td>
                  <td>{rupees(b.totalPrice)}</td>
                  <td><span className={`pill ${b.status === 'cancelled' ? 'muted' : ''}`}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="admin-rooms">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Room</th><th>Price</th><th>Sleeps</th><th>Count</th><th></th></tr></thead>
              <tbody>{rooms.map((r) => (
                <tr key={r._id}><td>{r.name}<div className="muted small">{r.type}</div></td><td>{rupees(r.pricePerNight)}</td>
                  <td>{r.capacity}</td><td>{r.quantity}</td><td><button className="link danger" onClick={() => remove(r._id)}>Remove</button></td></tr>
              ))}</tbody>
            </table>
          </div>
          <form className="book-box" onSubmit={addRoom}>
            <h2 className="h3">Add a room</h2>
            <label>Name<input value={form.name} onChange={set('name')} required /></label>
            <label>Type<select value={form.type} onChange={set('type')}>{['standard', 'deluxe', 'suite', 'family'].map((t) => <option key={t}>{t}</option>)}</select></label>
            <div className="row3">
              <label>₹ / night<input type="number" min="0" value={form.pricePerNight} onChange={set('pricePerNight')} required /></label>
              <label>Sleeps<input type="number" min="1" value={form.capacity} onChange={set('capacity')} required /></label>
              <label>How many<input type="number" min="1" value={form.quantity} onChange={set('quantity')} required /></label>
            </div>
            <label>Description<input value={form.description} onChange={set('description')} /></label>
            <label>Amenities (comma separated)<input value={form.amenities} onChange={set('amenities')} /></label>
            <button className="btn">Add room</button>
          </form>
        </div>
      )}
    </main>
  );
}
