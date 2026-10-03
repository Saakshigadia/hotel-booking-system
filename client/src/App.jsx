import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Protected from './components/Protected';
import Home from './pages/Home';
import RoomDetails from './pages/RoomDetails';
import Login from './pages/Login';
import MyBookings from './pages/MyBookings';
import Admin from './pages/Admin';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rooms/:id" element={<RoomDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/bookings" element={<Protected><MyBookings /></Protected>} />
        <Route path="/admin" element={<Protected admin><Admin /></Protected>} />
        <Route path="*" element={<main className="wrap"><h1>Page not found</h1></main>} />
      </Routes>
      <footer className="foot">Saakshi Stays · Hotel booking system built with MongoDB, Express, React and Node.js</footer>
    </>
  );
}
