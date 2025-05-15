// import { useEffect, useRef, useState } from 'react';
// import { useSearchParams } from 'react-router-dom';
// import axios from 'axios';
// import { useDispatch, useSelector } from 'react-redux';
// import addStream from '../redux-elements/actions/addStream';
// import updateCallStatus from '../redux-elements/actions/updateCallStatus';
// import createPeerConnection from '../webRTCutilities/createPeerConnection';
// import socketConnection from '../webRTCutilities/socketConnection';
// import ChatWindow from './ChatWindow';
// import ActionButtons from './ActionButtons';
// import './VideoComponents.css';

// export default function MainVideoPage() {
//   const dispatch = useDispatch();
//   const { audio, video, haveCreatedOffer, answer } = useSelector(s => s.callStatus);
//   const streams = useSelector(s => s.streams);
//   const [searchParams] = useSearchParams();
//   const [apptInfo, setApptInfo] = useState({});
//   const streamsRef = useRef(null);
//   const pendingIce = useRef([]);
//   const socketRef = useRef(null);
//   const smallFeedEl = useRef(null);
//   const largeFeedEl = useRef(null);

//   // 1️⃣ INIT
//   useEffect(() => {
//     let mounted = true;
//     (async () => {
//       const token = searchParams.get('token');
//       // Validate link
//       const { data } = await axios.post('process.env.REACT_APP_API_URL/validate-link', { token });
//       if (!mounted) return;
//       setApptInfo(data);

//       // Connect socket
//       const socket = socketConnection(token);
//       socketRef.current = socket;

//       // Listeners
//       socket.on('answerToClient', ans => {
//         dispatch(updateCallStatus('answer', ans));
//       });
//       socket.on('iceToClient', ({ iceC }) => {
//         const pc = streamsRef.current?.remote1?.peerConnection;
//         if (pc?.remoteDescription) {
//           pc.addIceCandidate(iceC).catch(console.error);
//         } else {
//           pendingIce.current.push(iceC);
//         }
//       });
//       socket.on('toggleVideo', ({ off }) => {
//         largeFeedEl.current.style.display = off ? 'none' : 'block';
//       });
//       socket.on('toggleAudio', ({ muted }) => {
//         largeFeedEl.current.muted = muted;
//       });

//       // Get media
//       const localStream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true,
//       });
//       if (!mounted) return;
//       smallFeedEl.current.srcObject = localStream;
//       dispatch(updateCallStatus('haveMedia', true));
//       dispatch(addStream('localStream', localStream));
//       dispatch(updateCallStatus('audio', 'enabled'));
//       dispatch(updateCallStatus('video', 'enabled'));

//       // PeerConnection
//       const { peerConnection, remoteStream } = await createPeerConnection(iceC => {
//         socket.emit('iceToServer', { who: 'client', iceC });
//       });
//       localStream.getTracks().forEach(t => peerConnection.addTrack(t, localStream));
//       dispatch(addStream('remote1', remoteStream, peerConnection));
//       largeFeedEl.current.srcObject = remoteStream;
//     })();

//     return () => {
//       mounted = false;
//       socketRef.current?.disconnect();
//     };
//   }, [dispatch, searchParams]);

//   // Keep streamsRef
//   useEffect(() => {
//     if (streams.remote1) streamsRef.current = streams;
//   }, [streams]);

//   // 2️⃣ SEND OFFER
//   useEffect(() => {
//     if (
//       audio === 'enabled' &&
//       video === 'enabled' &&
//       !haveCreatedOffer &&
//       streamsRef.current?.remote1?.peerConnection
//     ) {
//       (async () => {
//         const pc = streamsRef.current.remote1.peerConnection;
//         const offer = await pc.createOffer();
//         await pc.setLocalDescription(offer);
//         socketRef.current.emit('newOffer', { offer });
//         dispatch(updateCallStatus('haveCreatedOffer', true));
//       })().catch(console.error);
//     }
//   }, [audio, video, haveCreatedOffer, dispatch]);

//   // 3️⃣ APPLY ANSWER & FLUSH ICE
//   useEffect(() => {
//     if (answer && haveCreatedOffer) {
//       const pc = streamsRef.current.remote1.peerConnection;
//       pc.setRemoteDescription(answer).then(() => {
//         pendingIce.current.forEach(c => pc.addIceCandidate(c));
//         pendingIce.current = [];
//       });
//     }
//   }, [answer, haveCreatedOffer]);

//   return (
//     <div className="video-chat-wrapper">
//       <video ref={largeFeedEl} className="remote-video" autoPlay playsInline />
//       <video ref={smallFeedEl} className="local-video" autoPlay playsInline muted />
//       <ChatWindow />
//       <ActionButtons smallFeedEl={smallFeedEl} largeFeedEl={largeFeedEl} />
//     </div>
//   );
// }

// import { useEffect, useRef, useState } from 'react';
// import { useLocation } from 'react-router-dom';
// // import { useSearchParams } from 'react-router-dom';
// import axios from 'axios';
// import { useDispatch, useSelector } from 'react-redux';
// import addStream from '../redux-elements/actions/addStream';
// import updateCallStatus from '../redux-elements/actions/updateCallStatus';
// import createPeerConnection from '../webRTCutilities/createPeerConnection';
// import socketConnection from '../webRTCutilities/socketConnection';
// import ChatWindow from './ChatWindow';
// import ActionButtons from './ActionButtons';
// import './VideoComponents.css';

// export default function MainVideoPage() {
//   const dispatch = useDispatch();
//   const { audio, video, haveCreatedOffer, answer } = useSelector(s => s.callStatus);
//   const streams = useSelector(s => s.streams);
//   // const [searchParams] = useSearchParams();

//   const streamsRef = useRef(null);
//   const pendingIce = useRef([]);
//   const socketRef = useRef(null);

//   const smallFeedEl = useRef(null);
//   const largeFeedEl = useRef(null);

//   const location = useLocation();

//   let token;
//       if (location.hash.includes('?')) {
//         const query = location.hash.split('?')[1];             // "token=eyJ..."
//         token = new URLSearchParams(query).get('token');       // "eyJ..."
//       }

//   // 1) INIT: validate token, connect socket, set up listeners, get media, build PC
//   useEffect(() => {
//     let mounted = true;

//     (async () => {
//       // const token = searchParams.get('token');
//       // location.hash might look like "#/join-video?token=eyJ..."
      
//       // Validate link
//       const { data } = await axios.post(
//         'process.env.REACT_APP_API_URL/validate-link',
//         { token }
//       );
//       if (!mounted) return;

//       // Connect Socket.IO
//       const socket = socketConnection(token);
//       socketRef.current = socket;

//       // SDP answer listener
//       socket.on('answerToClient', ans => {
//         console.log('[CLIENT] got answer', ans);
//         dispatch(updateCallStatus('answer', ans));
//       });

//       // ICE candidate listener
//       socket.on('iceToClient', ({ iceC }) => {
//         console.log('[CLIENT] got ICE', iceC);
//         const pc = streamsRef.current?.remote1?.peerConnection;
//         if (pc?.remoteDescription) {
//           pc.addIceCandidate(iceC).catch(console.error);
//         } else {
//           pendingIce.current.push(iceC);
//         }
//       });

//       // VIDEO toggle listener
//       socket.on('toggleVideo', ({ off }) => {
//         console.log('[CLIENT] toggleVideo remote:', off);
//         largeFeedEl.current.style.display = off ? 'none' : 'block';
//       });

//       // Get local media (start enabled)
//       const localStream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true,
//       });
//       if (!mounted) return;
//       smallFeedEl.current.srcObject = localStream;

//       dispatch(updateCallStatus('haveMedia', true));
//       dispatch(addStream('localStream', localStream));
//       dispatch(updateCallStatus('audio', 'enabled'));
//       dispatch(updateCallStatus('video', 'enabled'));

//       // Build PeerConnection
//       const { peerConnection, remoteStream } = await createPeerConnection(iceC => {
//         socket.emit('iceToServer', { who: 'client', iceC });
//       });
//       localStream.getTracks().forEach(track =>
//         peerConnection.addTrack(track, localStream)
//       );
//       dispatch(addStream('remote1', remoteStream, peerConnection));
//       largeFeedEl.current.srcObject = remoteStream;
//       largeFeedEl.current.style.display = 'block';
//       console.log('[DEBUG] remote video attached and shown');
//     })();

//     return () => {
//       mounted = false;
//       socketRef.current?.disconnect();
//     };
//   }, [dispatch, searchParams]);

//   // keep streamsRef for ICE & offer
//   useEffect(() => {
//     if (streams.remote1) streamsRef.current = streams;
//   }, [streams]);

//   // 2) SEND OFFER once media & PC are ready
//   useEffect(() => {
//     if (
//       audio === 'enabled' &&
//       video === 'enabled' &&
//       !haveCreatedOffer &&
//       streamsRef.current?.remote1?.peerConnection
//     ) {
//       ;(async () => {
//         const pc = streamsRef.current.remote1.peerConnection;
//         console.log('[CLIENT] creating SDP offer');
//         const offer = await pc.createOffer();
//         await pc.setLocalDescription(offer);
//         console.log('[CLIENT] sending SDP offer');
//         socketRef.current.emit('newOffer', { offer });
//         dispatch(updateCallStatus('haveCreatedOffer', true));
//       })().catch(console.error);
//     }
//   }, [audio, video, haveCreatedOffer, dispatch]);

//   // 3) APPLY ANSWER + FLUSH ICE
//   useEffect(() => {
//     if (answer && haveCreatedOffer) {
//       console.log('[CLIENT] applying SDP answer');
//       const pc = streamsRef.current.remote1.peerConnection;
//       pc.setRemoteDescription(answer).then(() => {
//         pendingIce.current.forEach(c => pc.addIceCandidate(c).catch(console.error));
//         pendingIce.current = [];
//         console.log('[CLIENT] ICE buffer flushed');
//       });
//     }
//   }, [answer, haveCreatedOffer]);

//   return (
//     <div className="video-chat-wrapper">
//       <video
//         ref={largeFeedEl}
//         className="remote-video"
//         autoPlay
//         playsInline
//       />
//       <video
//         ref={smallFeedEl}
//         className="local-video"
//         autoPlay
//         playsInline
//         muted
//       />
//       <ChatWindow />
//       <ActionButtons
//         socket={socketRef.current}
//         smallFeedEl={smallFeedEl}
//         largeFeedEl={largeFeedEl}
//       />
//     </div>
//   );
// }

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import addStream from '../redux-elements/actions/addStream';
import updateCallStatus from '../redux-elements/actions/updateCallStatus';
import createPeerConnection from '../webRTCutilities/createPeerConnection';
import socketConnection from '../webRTCutilities/socketConnection';
import ChatWindow from './ChatWindow';
import ActionButtons from './ActionButtons';
import './VideoComponents.css';

export default function MainVideoPage() {
  const dispatch = useDispatch();
  const { audio, video, haveCreatedOffer, answer } = useSelector(s => s.callStatus);
  const streams = useSelector(s => s.streams);

  const streamsRef = useRef(null);
  const pendingIce = useRef([]);
  const socketRef = useRef(null);

  const smallFeedEl = useRef(null);
  const largeFeedEl = useRef(null);

  const location = useLocation();
  let token;
  if (location.hash.includes('?')) {
    const query = location.hash.split('?')[1];
    token = new URLSearchParams(query).get('token');
  }

  // 1) INIT
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!token) {
        console.error('No token found in URL');
        return;
      }

      // Validate link
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/validate-link`,
        { token }
      );
      if (!mounted) return;

      // Connect Socket.IO
      const socket = socketConnection(token);
      socketRef.current = socket;

      socket.on('answerToClient', ans => {
        dispatch(updateCallStatus('answer', ans));
      });
      socket.on('iceToClient', ({ iceC }) => {
        const pc = streamsRef.current?.remote1?.peerConnection;
        if (pc?.remoteDescription) {
          pc.addIceCandidate(iceC).catch(console.error);
        } else {
          pendingIce.current.push(iceC);
        }
      });
      socket.on('toggleVideo', ({ off }) => {
        largeFeedEl.current.style.display = off ? 'none' : 'block';
      });

      // Get local media
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (!mounted) return;
      smallFeedEl.current.srcObject = localStream;

      dispatch(updateCallStatus('haveMedia', true));
      dispatch(addStream('localStream', localStream));
      dispatch(updateCallStatus('audio', 'enabled'));
      dispatch(updateCallStatus('video', 'enabled'));

      // Build PeerConnection
      const { peerConnection, remoteStream } = await createPeerConnection(iceC => {
        socket.emit('iceToServer', { who: 'client', iceC });
      });
      localStream.getTracks().forEach(track =>
        peerConnection.addTrack(track, localStream)
      );
      dispatch(addStream('remote1', remoteStream, peerConnection));
      largeFeedEl.current.srcObject = remoteStream;
      largeFeedEl.current.style.display = 'block';
    })();

    return () => {
      mounted = false;
      socketRef.current?.disconnect();
    };
  }, [dispatch, token]);

  // Keep streamsRef
  useEffect(() => {
    if (streams.remote1) streamsRef.current = streams;
  }, [streams]);

  // 2) SEND OFFER
  useEffect(() => {
    if (
      audio === 'enabled' &&
      video === 'enabled' &&
      !haveCreatedOffer &&
      streamsRef.current?.remote1?.peerConnection
    ) {
      (async () => {
        const pc = streamsRef.current.remote1.peerConnection;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current.emit('newOffer', { offer });
        dispatch(updateCallStatus('haveCreatedOffer', true));
      })().catch(console.error);
    }
  }, [audio, video, haveCreatedOffer, dispatch]);

  // 3) APPLY ANSWER + FLUSH ICE
  useEffect(() => {
    if (answer && haveCreatedOffer) {
      const pc = streamsRef.current.remote1.peerConnection;
      pc.setRemoteDescription(answer).then(() => {
        pendingIce.current.forEach(c => pc.addIceCandidate(c).catch(console.error));
        pendingIce.current = [];
      });
    }
  }, [answer, haveCreatedOffer]);

  return (
    <div className="video-chat-wrapper">
      <video ref={largeFeedEl} className="remote-video" autoPlay playsInline />
      <video ref={smallFeedEl} className="local-video" autoPlay playsInline muted />
      <ChatWindow />
      <ActionButtons
        socket={socketRef.current}
        smallFeedEl={smallFeedEl}
        largeFeedEl={largeFeedEl}
      />
    </div>
  );
}

