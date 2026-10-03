import { useEffect, useState } from 'react';
import { api } from '../api/client';
import RoomCard from '../components/RoomCard';
import { isoDay } from '../utils';

const TYPES = ['', 'standard', 'deluxe', 'suite', 'family'];

export default function Home() {
  const [search, setSearch] = useState({ checkIn: isoDay(7), checkOut: isoDay(9), guests: 2, type: '' });
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = (s = search) => {
    setLoading(true); setError('');
    api.getRooms(s).then((d) => setRooms(d.rooms)).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (e) => setSearch({ ...search, [k]: e.target.value });
  const pickType = (t) => { const s = { ...search, type: t }; setSearch(s); load(s); };

  return (
    <>
      <section className="hero">
        <div className="hero-in">
          <p className="eyebrow">Boutique hotel · Kolkata</p>
          <h1>Stays worth remembering.</h1>
          <p className="lead">Check live availability and book a room in under a minute.</p>
          <form className="search" onSubmit={(e) => { e.preventDefault(); load(); }}>
            <label>Check-in<input type="date" value={search.checkIn} min={isoDay(0)} onChange={set('checkIn')} required /></label>
            <label>Check-out<input type="date" value={search.checkOut} min={search.checkIn} onChange={set('checkOut')} required /></label>
            <label>Guests<select value={search.guests} onChange={set('guests')}>{[1, 2, 3, 4].map((n) => <option key={n}>{n}</option>)}</select></label>
            <button className="btn btn-lg" type="submit">Check availability</button>
          </form>
        </div>
      </section>

      <main className="wrap">
        <div className="filters" role="group" aria-label="Room type">
          {TYPES.map((t) => (
            <button key={t || 'all'} className={`chip ${search.type === t ? 'on' : ''}`} onClick={() => pickType(t)} aria-pressed={search.type === t}>
              {t || 'All rooms'}
            </button>
          ))}
        </div>
        {error && <p className="alert">{error}</p>}
        {loading ? <p className="muted">Finding rooms…</p> : (
          rooms.length
            ? <div className="room-grid">{rooms.map((r) => <RoomCard key={r._id} room={r} search={search} />)}</div>
            : <p className="muted">No rooms match. Try fewer guests or another room type.</p>
        )}
      </main>
    </>
  );
}
