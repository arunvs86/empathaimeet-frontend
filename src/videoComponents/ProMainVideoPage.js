// import { useEffect, useRef } from 'react';
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

// export default function ProMainVideoPage() {
//   const dispatch = useDispatch();
//   const { offer, haveCreatedAnswer } = useSelector(s => s.callStatus);
//   const streams = useSelector(s => s.streams);
//   const [searchParams] = useSearchParams();
//   const streamsRef = useRef(null);
//   const pendingIce = useRef([]);
//   const socketRef = useRef(null);
//   const smallFeedEl = useRef(null);
//   const largeFeedEl = useRef(null);

//   useEffect(() => {
//     let mounted = true;
//     (async () => {
//       const token = searchParams.get('token');
//       await axios.post('process.env.REACT_APP_API_URL/validate-link', { token });

//       const socket = socketConnection(token);
//       socketRef.current = socket;

//       // Listen for offer
//       socket.on('newOfferWaiting', ({ offer }) => {
//         dispatch(updateCallStatus('offer', offer));
//       });
//       // Listen for ICE
//       socket.on('iceToClient', ({ iceC }) => {
//         const pc = streamsRef.current?.remote1?.peerConnection;
//         if (pc?.remoteDescription) {
//           pc.addIceCandidate(iceC).catch(console.error);
//         } else {
//           pendingIce.current.push(iceC);
//         }
//       });
//       // Listen for toggles
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

//       // PeerConnection
//       const { peerConnection, remoteStream } = await createPeerConnection(iceC => {
//         socket.emit('iceToServer', { who: 'professional', iceC });
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

//   useEffect(() => {
//     if (streams.remote1) streamsRef.current = streams;
//   }, [streams]);

//   // Answer when offer arrives
//   useEffect(() => {
//     if (!offer || !streamsRef.current?.remote1?.peerConnection || haveCreatedAnswer) return;
//     (async () => {
//       const pc = streamsRef.current.remote1.peerConnection;
//       await pc.setRemoteDescription(offer);
//       pendingIce.current.forEach(c => pc.addIceCandidate(c).catch(console.error));
//       pendingIce.current = [];

//       const answer = await pc.createAnswer();
//       await pc.setLocalDescription(answer);
//       socketRef.current.emit('newAnswer', { answer });
//       dispatch(updateCallStatus('haveCreatedAnswer', true));
//       dispatch(updateCallStatus('answer', answer));
//     })().catch(console.error);
//   }, [offer, haveCreatedAnswer, dispatch]);

//   return (
//     <div className="video-chat-wrapper">
//       <video ref={largeFeedEl} className="remote-video" autoPlay playsInline />
//       <video ref={smallFeedEl} className="local-video" autoPlay playsInline muted />
//       <ChatWindow />
//       <ActionButtons smallFeedEl={smallFeedEl} largeFeedEl={largeFeedEl} />
//     </div>
//   );
// }

import { useEffect, useRef } from 'react';
// import { useSearchParams } from 'react-router-dom';
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

export default function ProMainVideoPage() {
  const dispatch = useDispatch();
  const { offer, haveCreatedAnswer } = useSelector(s => s.callStatus);
  const streams = useSelector(s => s.streams);
  const [searchParams] = useSearchParams();

  const location = useLocation();
// location.hash might look like "#/join-video?token=eyJ..."
let token;
if (location.hash.includes('?')) {
  const query = location.hash.split('?')[1];             // "token=eyJ..."
  token = new URLSearchParams(query).get('token');       // "eyJ..."
}

  const streamsRef = useRef(null);
  const pendingIce = useRef([]);
  const socketRef = useRef(null);

  const smallFeedEl = useRef(null);
  const largeFeedEl = useRef(null);

  // 1) INIT
  useEffect(() => {
    let mounted = true;

    (async () => {
      // const token = searchParams.get('token');
      await axios.post(  `${process.env.REACT_APP_API_URL}/validate-link`,
         { token });

      // Connect Socket.IO
      const socket = socketConnection(token);
      socketRef.current = socket;

      // Listen for client offer
      socket.on('newOfferWaiting', ({ offer }) => {
        console.log('[PRO] got SDP offer', offer);
        dispatch(updateCallStatus('offer', offer));
      });

      // Listen for ICE
      socket.on('iceToClient', ({ iceC }) => {
        console.log('[PRO] got ICE', iceC);
        const pc = streamsRef.current?.remote1?.peerConnection;
        if (pc?.remoteDescription) {
          pc.addIceCandidate(iceC).catch(console.error);
        } else {
          pendingIce.current.push(iceC);
        }
      });

      // VIDEO toggle listener
      socket.on('toggleVideo', ({ off }) => {
        console.log('[PRO] toggleVideo remote:', off);
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
        socket.emit('iceToServer', { who: 'professional', iceC });
      });
      localStream.getTracks().forEach(track =>
        peerConnection.addTrack(track, localStream)
      );
      dispatch(addStream('remote1', remoteStream, peerConnection));
      largeFeedEl.current.srcObject = remoteStream;
      largeFeedEl.current.style.display = 'block';
      console.log('[DEBUG] remote video attached and shown');
    })();

    return () => {
      mounted = false;
      socketRef.current?.disconnect();
    };
  }, [dispatch, searchParams]);

  // keep streamsRef
  useEffect(() => {
    if (streams.remote1) streamsRef.current = streams;
  }, [streams]);

  // 2) ANSWER & FLUSH ICE
  useEffect(() => {
    if (!offer || haveCreatedAnswer || !streamsRef.current?.remote1?.peerConnection)
      return;
    ;(async () => {
      const pc = streamsRef.current.remote1.peerConnection;
      console.log('[PRO] setting remote description');
      await pc.setRemoteDescription(offer);

      pendingIce.current.forEach(c => pc.addIceCandidate(c).catch(console.error));
      pendingIce.current = [];

      console.log('[PRO] creating SDP answer');
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      console.log('[PRO] sending SDP answer');
      socketRef.current.emit('newAnswer', { answer });
      dispatch(updateCallStatus('haveCreatedAnswer', true));
      dispatch(updateCallStatus('answer', answer));
    })().catch(console.error);
  }, [offer, haveCreatedAnswer, dispatch]);

  return (
    <div className="video-chat-wrapper">
      <video
        ref={largeFeedEl}
        className="remote-video"
        autoPlay
        playsInline
      />
      <video
        ref={smallFeedEl}
        className="local-video"
        autoPlay
        playsInline
        muted
      />
      <ChatWindow />
      <ActionButtons
        socket={socketRef.current}
        smallFeedEl={smallFeedEl}
        largeFeedEl={largeFeedEl}
      />
    </div>
  );
}
