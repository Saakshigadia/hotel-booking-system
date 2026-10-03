// Single place the UI talks to the backend.
// In demo mode (npm run build:demo) the same functions use mockApi.js instead,
// which stores everything in the browser so the site works without a server.
import axios from 'axios';
import * as mock from './mockApi';

const http = axios.create({ baseURL: `${import.meta.env.VITE_API_URL || ''}/api` });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Turn axios errors into plain Errors with the server's message.
const call = (p) => p.then((r) => r.data).catch((e) => {
  throw new Error(e.response?.data?.message || 'Could not reach the server');
});

const real = {
  register: (body) => call(http.post('/auth/register', body)),
  login: (body) => call(http.post('/auth/login', body)),
  me: () => call(http.get('/auth/me')),
  getRooms: (params) => call(http.get('/rooms', { params })),
  getRoom: (id) => call(http.get(`/rooms/${id}`)),
  createRoom: (body) => call(http.post('/rooms', body)),
  deleteRoom: (id) => call(http.delete(`/rooms/${id}`)),
  createBooking: (body) => call(http.post('/bookings', body)),
  myBookings: () => call(http.get('/bookings/mine')),
  cancelBooking: (id) => call(http.patch(`/bookings/${id}/cancel`)),
  allBookings: () => call(http.get('/bookings')),
};

export const isDemo = import.meta.env.VITE_DEMO === 'true';
export const api = isDemo ? mock : real;
