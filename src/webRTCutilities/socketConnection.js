import { io } from 'socket.io-client';

export default function socketConnection(token) {
  const backend = "https://empathaimeet.onrender.com";  

  if (!backend) {
    console.error('⚠️ VITE_API_URL is not defined');
    return null;
  }

  return io(backend, {
    // path: '/socket.io',           // default, you can omit if untouched
    transports: ['websocket'],    // skip polling if you only want WS
    auth: { jwt: token },
  });
}

