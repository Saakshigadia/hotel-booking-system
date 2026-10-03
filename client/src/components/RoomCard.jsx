import { Link } from 'react-router-dom';
import RoomArt from './RoomArt';
import { rupees } from '../utils';

export default function RoomCard({ room, search }) {
  const soldOut = room.available === 0;
  const q = search.checkIn && search.checkOut ? `?checkIn=${search.checkIn}&checkOut=${search.checkOut}&guests=${search.guests}` : '';
  return (
    <article className={`room-card ${soldOut ? 'is-sold' : ''}`}>
      <RoomArt type={room.type} />
      <div className="room-body">
        <div className="room-top">
          <h3>{room.name}</h3>
          <span className="pill">{room.type}</span>
        </div>
        <p className="muted">{room.description}</p>
        <p className="meta">Up to {room.capacity} guest{room.capacity > 1 ? 's' : ''} · {room.amenities?.slice(0, 3).join(' · ')}</p>
        <div className="room-foot">
          <div>
            <b className="price">{rupees(room.pricePerNight)}</b><span className="muted"> / night</span>
            {room.totalPrice != null && <div className="muted small">{rupees(room.totalPrice)} for {room.nights} night{room.nights > 1 ? 's' : ''}</div>}
          </div>
          {soldOut
            ? <span className="sold">Sold out</span>
            : <Link className="btn" to={`/rooms/${room._id}${q}`}>
                {room.available != null && room.available <= 2 ? `Only ${room.available} left` : 'View & book'}
              </Link>}
        </div>
      </div>
    </article>
  );
}
