// import { useEffect, useRef, useState } from 'react';
// import axios from 'axios';
// import { useDispatch, useSelector } from 'react-redux';
// import addStream from '../redux-elements/actions/addStream';
// import updateCallStatus from '../redux-elements/actions/updateCallStatus';
// import createPeerConnection from '../webRTCutilities/createPeerConnection';
// import socketConnection from '../webRTCutilities/socketConnection';
// import ActionButtons from './ActionButtons';
// import './VideoComponents.css';

// export default function ProMainVideoPage() {
//   const dispatch = useDispatch();
//   const { offer, haveCreatedAnswer } = useSelector(s => s.callStatus);
//   const streams = useSelector(s => s.streams);

//   const rootRef = useRef(null);
//   const streamsRef = useRef(null);
//   const pendingIce = useRef([]);
//   const socketRef = useRef(null);
//   const smallFeedEl = useRef(null);
//   const largeFeedEl = useRef(null);
//   const remoteAudioEl = useRef(null);   // 🔊 hidden audio element

//   // handshake flags
//   const [iAmReady, setIAmReady] = useState(false);
//   const [clientJoined, setClientJoined] = useState(false);
//   const [clientReady, setClientReady] = useState(false);
//   const [canUnmute, setCanUnmute] = useState(true);

//   const API = "http://localhost:9000";

//   const token = (() => {
//     const sp = new URLSearchParams(window.location.search);
//     if (sp.has('token')) return sp.get('token');
//     const h = window.location.hash;
//     const idx = h.indexOf('?');
//     if (idx !== -1) {
//       const qp = new URLSearchParams(h.substring(idx + 1));
//       if (qp.has('token')) return qp.get('token');
//     }
//     return null;
//   })();

//   useEffect(() => {
//     if (!token) { console.error('No token found in URL'); return; }
//     let mounted = true;

//     (async () => {
//       await axios.post(`${API}/validate-link`, { token });

//       const socket = socketConnection(token);
//       socketRef.current = socket;

//       // handshake
//       socket.on('clientJoined', () => { console.log('[SOCKET] clientJoined'); setClientJoined(true); });
//       socket.on('clientReady',  () => { console.log('[SOCKET] clientReady');  setClientReady(true); });

//       // signaling
//       socket.on('newOfferWaiting', ({ offer }) => {
//         console.log('[SOCKET] newOfferWaiting');
//         dispatch(updateCallStatus('offer', offer));
//       });

//       socket.on('iceToClient', ({ iceC }) => {
//         const pc = streamsRef.current?.remote1?.peerConnection;
//         if (pc?.remoteDescription) pc.addIceCandidate(iceC).catch(console.error);
//         else pendingIce.current.push(iceC);
//       });

//       // ui state from remote
//       socket.on('toggleVideo', ({ off }) => {
//         if (!rootRef.current) return;
//         rootRef.current.classList.toggle('is-remote-video-off', !!off);
//       });
//       socket.on('toggleAudio', ({ muted }) => {
//         if (!rootRef.current) return;
//         rootRef.current.classList.toggle('is-remote-muted', !!muted);
//       });

//       // local media
//       const localStream = await navigator.mediaDevices.getUserMedia({
//         video: { width: { ideal: 1280 }, height: { ideal: 720 } },
//         audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
//       });
//       if (!mounted) return;

//       smallFeedEl.current.srcObject = localStream;
//       smallFeedEl.current.muted = true;
//       await smallFeedEl.current.play().catch(()=>{});

//       dispatch(updateCallStatus('haveMedia', true));
//       dispatch(addStream('localStream', localStream));
//       dispatch(updateCallStatus('audio', 'enabled'));
//       dispatch(updateCallStatus('video', 'enabled'));

//       if (largeFeedEl.current) largeFeedEl.current.muted = true;

//       // peer connection
//       const { peerConnection } = await createPeerConnection(
//         (iceC) => socket.emit('iceToServer', { who: 'pro', iceC }), // 🔁 standardized label
//         async (remoteStream) => {
//           if (!largeFeedEl.current) return;
//           largeFeedEl.current.controls = true;
//           largeFeedEl.current.muted = true;  // autoplay-safe
//           largeFeedEl.current.srcObject = remoteStream;
//           try { await largeFeedEl.current.play(); } catch {}

//           // 🔊 mirror to hidden audio
//           if (remoteAudioEl.current) {
//             remoteAudioEl.current.srcObject = remoteStream;
//             remoteAudioEl.current.muted = true;
//             try { await remoteAudioEl.current.play(); } catch {}
//           }

//           setCanUnmute(true);

//           // badges from track state
//           remoteStream.getTracks().forEach(tr => {
//             tr.onmute = () =>
//               rootRef.current?.classList.add(tr.kind === 'audio' ? 'is-remote-muted' : 'is-remote-video-off');
//             tr.onunmute = () =>
//               rootRef.current?.classList.remove(tr.kind === 'audio' ? 'is-remote-muted' : 'is-remote-video-off');
//           });
//         }
//       );

//       // Only addTrack — no transceivers
//       localStream.getTracks().forEach(track => {
//         peerConnection.addTrack(track, localStream);
//       });

//       // Debug
//       localStream.getTracks().forEach((t) => {
//         console.log('[PRO] local track', t.kind, t.readyState, 'enabled=', t.enabled);
//         t.onended = () => console.warn('[PRO] track ended', t.kind);
//         t.onmute = () => console.warn('[PRO] track muted', t.kind);
//         t.onunmute = () => console.warn('[PRO] track unmuted', t.kind);
//       });

//       dispatch(addStream('remote1', null, peerConnection));

//       console.log('[PRO] senders now:',
//         peerConnection.getSenders().map((s) => s.track && `${s.track.kind}:${s.track.readyState}:${s.track.enabled}`)
//       );

//       setTimeout(async () => {
//         const stats = await peerConnection.getStats();
//         stats.forEach((r) => {
//           if (r.type === 'outbound-rtp' && !r.isRemote) {
//             console.log('[PRO] outbound-rtp', r.kind, 'bytesSent=', r.bytesSent, 'framesEncoded=', r.framesEncoded);
//           }
//         });
//       }, 2000);

//       socket.emit('iAmReady');
//       setIAmReady(true);
//       console.log('[HANDSHAKE] pro iAmReady');
//     })();

//     return () => { mounted = false; socketRef.current?.disconnect(); };
//   }, [dispatch, token]);

//   useEffect(() => { if (streams.remote1) streamsRef.current = streams; }, [streams]);

//   // apply offer only when legal, then answer
//   useEffect(() => {
//     if (!offer || haveCreatedAnswer) return;
//     const pc = streamsRef.current?.remote1?.peerConnection;
//     if (!pc) return;

//     if (!iAmReady || !clientReady) { console.log('[NEGOTIATE] defer answer: not ready'); return; }
//     if (pc.currentRemoteDescription) { console.log('[SRD] offer skipped: already has remote'); return; }
//     if (pc.signalingState !== 'stable') { console.log('[SRD] offer skipped: state=', pc.signalingState); return; }

//     (async () => {
//       console.log('[NEGOTIATE] applying offer + creating answer');
//       await pc.setRemoteDescription(offer);

//       pendingIce.current.forEach(c => pc.addIceCandidate(c).catch(console.error));
//       pendingIce.current = [];

//       const answer = await pc.createAnswer();
//       await pc.setLocalDescription(answer);

//       socketRef.current.emit('newAnswer', { answer });
//       dispatch(updateCallStatus('haveCreatedAnswer', true));
//       dispatch(updateCallStatus('answer', answer));
//     })().catch(err => console.error('[SRD] offer failed', err));
//   }, [offer, haveCreatedAnswer, iAmReady, clientReady, dispatch]);

//   const unmuteRemote = async () => {
//     if (largeFeedEl.current) {
//       largeFeedEl.current.muted = false;
//       try { await largeFeedEl.current.play(); } catch {}
//     }
//     if (remoteAudioEl.current) {
//       remoteAudioEl.current.muted = false;
//       try { await remoteAudioEl.current.play(); } catch {}
//     }
//     setCanUnmute(false);
//   };

//   return (
//     <div ref={rootRef} className="vc-root">
//       <video ref={largeFeedEl} className="vc-remote" autoPlay playsInline />
//       <video ref={smallFeedEl} className="vc-local" autoPlay playsInline muted />
//       {/* 🔊 hidden audio element for reliable audio playback */}
//       <audio ref={remoteAudioEl} autoPlay playsInline style={{ display: 'none' }} />

//       {canUnmute && <button className="unmute-btn" onClick={unmuteRemote}>Unmute Remote</button>}

//       <div className="vc-badges">
//         <span className="vc-badge badge-muted">Remote Muted</span>
//         <span className="vc-badge badge-videooff">Remote Video Off</span>
//       </div>

//       <ActionButtons socket={socketRef.current} />
//     </div>
//   );
// }

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import addStream from '../redux-elements/actions/addStream';
import updateCallStatus from '../redux-elements/actions/updateCallStatus';
import createPeerConnection from '../webRTCutilities/createPeerConnection';
import socketConnection from '../webRTCutilities/socketConnection';
import ActionButtons from './ActionButtons';
import './VideoComponents.css';

export default function ProMainVideoPage() {
  const dispatch = useDispatch();
  const { offer, haveCreatedAnswer } = useSelector(s => s.callStatus);
  const streams = useSelector(s => s.streams);

  const rootRef = useRef(null);
  const streamsRef = useRef(null);
  const pendingIce = useRef([]);
  const socketRef = useRef(null);
  const smallFeedEl = useRef(null);
  const largeFeedEl = useRef(null);
  const remoteAudioEl = useRef(null);

  // handshake flags
  const [iAmReady, setIAmReady] = useState(false);
  const [clientJoined, setClientJoined] = useState(false);
  const [clientReady, setClientReady] = useState(false);
  const [canUnmute, setCanUnmute] = useState(true);

  const API = "https://empathaimeet.onrender.com";

  const token = (() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.has('token')) return sp.get('token');
    const h = window.location.hash;
    const idx = h.indexOf('?');
    if (idx !== -1) {
      const qp = new URLSearchParams(h.substring(idx + 1));
      if (qp.has('token')) return qp.get('token');
    }
    return null;
  })();

  // One-time "first gesture" handler: unmute + play
  useEffect(() => {
    const onFirstGesture = async () => {
      try {
        if (largeFeedEl.current) {
          largeFeedEl.current.muted = false;
          await largeFeedEl.current.play();
        }
        if (remoteAudioEl.current) {
          remoteAudioEl.current.muted = false;
          await remoteAudioEl.current.play();
        }
        setCanUnmute(false);
      } catch {}
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
    };
    window.addEventListener('pointerdown', onFirstGesture, { once: true });
    window.addEventListener('keydown', onFirstGesture, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onFirstGesture);
      window.removeEventListener('keydown', onFirstGesture);
    };
  }, []);

  useEffect(() => {
    if (!token) { console.error('No token found in URL'); return; }
    let mounted = true;

    (async () => {
      await axios.post(`${API}/validate-link`, { token });

      const socket = socketConnection(token);
      socketRef.current = socket;

      // handshake
      socket.on('clientJoined', () => { console.log('[SOCKET] clientJoined'); setClientJoined(true); });
      socket.on('clientReady',  () => { console.log('[SOCKET] clientReady');  setClientReady(true); });

      // signaling
      socket.on('newOfferWaiting', ({ offer }) => {
        console.log('[SOCKET] newOfferWaiting');
        dispatch(updateCallStatus('offer', offer));
      });

      socket.on('iceToClient', ({ iceC }) => {
        const pc = streamsRef.current?.remote1?.peerConnection;
        if (pc?.remoteDescription) pc.addIceCandidate(iceC).catch(console.error);
        else pendingIce.current.push(iceC);
      });

      // ui state from remote
      socket.on('toggleVideo', ({ off }) => rootRef.current?.classList.toggle('is-remote-video-off', !!off));
      socket.on('toggleAudio', ({ muted }) => rootRef.current?.classList.toggle('is-remote-muted', !!muted));

      // local media
      const localStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      if (!mounted) return;

      smallFeedEl.current.srcObject = localStream;
      smallFeedEl.current.muted = true;
      await smallFeedEl.current.play().catch(()=>{});

      dispatch(updateCallStatus('haveMedia', true));
      dispatch(addStream('localStream', localStream));
      dispatch(updateCallStatus('audio', 'enabled'));
      dispatch(updateCallStatus('video', 'enabled'));

      if (largeFeedEl.current) largeFeedEl.current.muted = true;

      // peer connection
      const { peerConnection } = await createPeerConnection(
        (iceC) => socket.emit('iceToServer', { who: 'pro', iceC }),
        async (remoteStream) => {
          if (!largeFeedEl.current) return;
          largeFeedEl.current.muted = true;  // autoplay-safe
          largeFeedEl.current.srcObject = remoteStream;
          try { await largeFeedEl.current.play(); } catch {}

          if (remoteAudioEl.current) {
            remoteAudioEl.current.srcObject = remoteStream;
            remoteAudioEl.current.muted = true;
            try { await remoteAudioEl.current.play(); } catch {}
          }

          setCanUnmute(true);

          remoteStream.getTracks().forEach(tr => {
            tr.onmute = () => rootRef.current?.classList.add(tr.kind === 'audio' ? 'is-remote-muted' : 'is-remote-video-off');
            tr.onunmute = () => rootRef.current?.classList.remove(tr.kind === 'audio' ? 'is-remote-muted' : 'is-remote-video-off');
          });
        }
      );

      localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
      dispatch(addStream('remote1', null, peerConnection));

      socket.emit('iAmReady');
      setIAmReady(true);
      console.log('[HANDSHAKE] pro iAmReady');
    })();

    return () => { mounted = false; socketRef.current?.disconnect(); };
  }, [dispatch, token]);

  useEffect(() => { if (streams.remote1) streamsRef.current = streams; }, [streams]);

  // apply offer only when legal, then answer
  useEffect(() => {
    if (!offer || haveCreatedAnswer) return;
    const pc = streamsRef.current?.remote1?.peerConnection;
    if (!pc) return;

    if (!iAmReady || !clientReady) { console.log('[NEGOTIATE] defer answer: not ready'); return; }
    if (pc.currentRemoteDescription) { console.log('[SRD] offer skipped: already has remote'); return; }
    if (pc.signalingState !== 'stable') { console.log('[SRD] offer skipped: state=', pc.signalingState); return; }

    (async () => {
      console.log('[NEGOTIATE] applying offer + creating answer');
      await pc.setRemoteDescription(offer);

      pendingIce.current.forEach(c => pc.addIceCandidate(c).catch(console.error));
      pendingIce.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current.emit('newAnswer', { answer });
      dispatch(updateCallStatus('haveCreatedAnswer', true));
      dispatch(updateCallStatus('answer', answer));
    })().catch(err => console.error('[SRD] offer failed', err));
  }, [offer, haveCreatedAnswer, iAmReady, clientReady, dispatch]);

  const unmuteRemote = async () => {
    if (largeFeedEl.current) {
      largeFeedEl.current.muted = false;
      try { await largeFeedEl.current.play(); } catch {}
    }
    if (remoteAudioEl.current) {
      remoteAudioEl.current.muted = false;
      try { await remoteAudioEl.current.play(); } catch {}
    }
    setCanUnmute(false);
  };

  return (
    <div ref={rootRef} className="vc-root">
      {/* remove controls → we handle audio programmatically */}
      <video ref={largeFeedEl} className="vc-remote" autoPlay playsInline />
      <video ref={smallFeedEl} className="vc-local" autoPlay playsInline muted />
      <audio ref={remoteAudioEl} autoPlay playsInline style={{ display: 'none' }} />

      {canUnmute && <button className="unmute-btn" onClick={unmuteRemote}>Unmute Remote</button>}

      <div className="vc-badges">
        <span className="vc-badge badge-muted">Remote Muted</span>
        <span className="vc-badge badge-videooff">Remote Video Off</span>
      </div>

      <ActionButtons socket={socketRef.current} />
    </div>
  );
}
