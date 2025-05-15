// import { io } from 'socket.io-client';

// let socket;
// const socketConnection = (jwt)=>{
//     console.log(jwt)

//     //check to see if the socket is already connected
//     if(socket && socket.connected){
//         //if so, then just return it so whoever needs it, can use it
//         return socket;
//     }else{
//         //its not connected... connect!
//         socket = io.connect('process.env.REACT_APP_API_URL',{
//             auth: {
//                 jwt
//             }
//         });
//         return socket;
//     }
// }

// export default socketConnection;

import { io } from 'socket.io-client';

export default function socketConnection(token) {
  return io(  `${process.env.REACT_APP_API_URL}/validate-link`,
   {
    auth: { jwt: token },
    secure: true,
    rejectUnauthorized: false, // dev certs only
  });
}
