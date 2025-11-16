// import { useEffect, useRef, useState } from 'react';
// import axios from 'axios';
// import { useDispatch, useSelector } from 'react-redux';
// import addStream from '../redux-elements/actions/addStream';
// import updateCallStatus from '../redux-elements/actions/updateCallStatus';
// import createPeerConnection from '../webRTCutilities/createPeerConnection';
// import socketConnection from '../webRTCutilities/socketConnection';
// import ActionButtons from './ActionButtons';
// import './VideoComponents.css';

// function attachAndPlay(videoEl, mediaStream) {
//   if (!videoEl || !mediaStream) return;

//   videoEl.muted = true;       // autoplay-safe
//   videoEl.playsInline = true;
//   videoEl.autoplay = true;
//   videoEl.srcObject = mediaStream;

//   const tryPlay = () => {
//     const p = videoEl.play();
//     if (p && typeof p.catch === 'function') p.catch(() => {});
//   };

//   tryPlay();

//   const onMeta = () => { tryPlay(); videoEl.removeEventListener('loadedmetadata', onMeta); };
//   videoEl.addEventListener('loadedmetadata', onMeta);

//   mediaStream.getTracks().forEach(t => {
//     const onUnmute = () => { tryPlay(); t.removeEventListener('unmute', onUnmute); };
//     t.addEventListener('unmute', onUnmute);
//   });
// }

// export default function MainVideoPage() {
//   const dispatch = useDispatch();
//   const { audio, video, haveCreatedOffer, answer } = useSelector(s => s.callStatus);
//   const streams = useSelector(s => s.streams);

//   const rootRef = useRef(null);
//   const streamsRef = useRef(null);
//   const pendingIce = useRef([]);
//   const socketRef = useRef(null);
//   const smallFeedEl = useRef(null);
//   const largeFeedEl = useRef(null);
//   const remoteAudioEl = useRef(null);   // 🔊 hidden audio element
//   const [iAmReady, setIAmReady] = useState(false);
//   const [proJoined, setProJoined] = useState(false);
//   const [proReady, setProReady] = useState(false);
//   const [canUnmute, setCanUnmute] = useState(true);

//   const API = "http://localhost:9000";

//   // token from ? or #/…?token=
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
//       socket.on('proJoined', () => { console.log('[SOCKET] proJoined'); setProJoined(true); });
//       socket.on('proReady',  () => { console.log('[SOCKET] proReady');  setProReady(true); });

//       // signaling
//       socket.on('answerToClient', ans => {
//         console.log('[SOCKET] answerToClient');
//         dispatch(updateCallStatus('answer', ans));
//       });
//       socket.on('iceToClient', ({ iceC }) => {
//         const pc = streamsRef.current?.remote1?.peerConnection;
//         if (pc?.remoteDescription) pc.addIceCandidate(iceC).catch(console.error);
//         else pendingIce.current.push(iceC);
//       });

//       // badges from remote
//       socket.on('toggleVideo', ({ off }) => rootRef.current?.classList.toggle('is-remote-video-off', !!off));
//       socket.on('toggleAudio', ({ muted }) => rootRef.current?.classList.toggle('is-remote-muted', !!muted));

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
//         (iceC) => socket.emit('iceToServer', { who: 'client', iceC }),
//         async (remoteStream) => {
//           if (!largeFeedEl.current) return;
//           console.log('[CLIENT] onRemoteStream attached:', remoteStream.getTracks().map(t=>t.kind));
//           attachAndPlay(largeFeedEl.current, remoteStream);

//           // 🔊 also attach to hidden audio element (improves reliability)
//           if (remoteAudioEl.current) {
//             remoteAudioEl.current.srcObject = remoteStream;
//             remoteAudioEl.current.muted = true; // unmuted later via button
//             try { await remoteAudioEl.current.play(); } catch {}
//           }

//           setCanUnmute(true);

//           // keep badges synced
//           remoteStream.getTracks().forEach(tr => {
//             tr.onmute = () => rootRef.current?.classList.add(tr.kind === 'audio' ? 'is-remote-muted' : 'is-remote-video-off');
//             tr.onunmute = () => rootRef.current?.classList.remove(tr.kind === 'audio' ? 'is-remote-muted' : 'is-remote-video-off');
//           });
//         }
//       );

//       // send local
//       localStream.getTracks().forEach(t => peerConnection.addTrack(t, localStream));
//       dispatch(addStream('remote1', null, peerConnection));

//       socket.emit('iAmReady');
//       setIAmReady(true);
//       console.log('[HANDSHAKE] client iAmReady');
//     })();

//     return () => { mounted = false; socketRef.current?.disconnect(); };
//   }, [dispatch, token]);

//   // cache streams
//   useEffect(() => { if (streams.remote1) streamsRef.current = streams; }, [streams]);

//   // create offer when both ready
//   useEffect(() => {
//     const pc = streamsRef.current?.remote1?.peerConnection;
//     if (!pc) return;
//     if (iAmReady && proJoined && proReady && !haveCreatedOffer && audio === 'enabled' && video === 'enabled') {
//       (async () => {
//         console.log('[NEGOTIATE] creating offer');
//         const offer = await pc.createOffer();
//         await pc.setLocalDescription(offer);
//         socketRef.current.emit('newOffer', { offer });
//         dispatch(updateCallStatus('haveCreatedOffer', true));
//       })().catch(console.error);
//     }
//   }, [iAmReady, proJoined, proReady, haveCreatedOffer, audio, video, dispatch]);

//   // apply answer + flush ICE + attach fallback
//   useEffect(() => {
//     if (!answer || !haveCreatedOffer) return;
//     const pc = streamsRef.current?.remote1?.peerConnection;
//     if (!pc) return;

//     if (pc.currentRemoteDescription) {
//       console.log('[SRD] answer skipped: already has remote');
//       return;
//     }
//     if (pc.signalingState !== 'have-local-offer') {
//       console.log('[SRD] answer skipped: state=', pc.signalingState);
//       return;
//     }

//     pc.setRemoteDescription(answer)
//       .then(() => {
//         console.log('[SRD] answer applied');
//         // flush queued ICE
//         pendingIce.current.forEach(c => pc.addIceCandidate(c).catch(console.error));
//         pendingIce.current = [];

//         // Retry-attach from receivers if needed
//         let tries = 0;
//         const MAX_TRIES = 10;
//         const INTERVAL_MS = 300;

//         const tryAttachFromReceivers = () => {
//           const el = largeFeedEl.current;
//           if (!el) return;

//           const hasStream = el.srcObject instanceof MediaStream && el.srcObject.getTracks().length > 0;
//           if (hasStream) return;

//           const recvs = pc.getReceivers();
//           const tracks = recvs.map(r => r.track).filter(Boolean);
//           console.log('[CLIENT] receivers:', recvs.length, 'tracks:', tracks.map(t => `${t.kind}:${t.readyState}`));

//           if (tracks.length) {
//             const ms = new MediaStream(tracks);
//             console.log('[CLIENT] Retry-attach with tracks:', tracks.map(t => t.kind));
//             attachAndPlay(el, ms);

//             // mirror to audio element
//             if (remoteAudioEl.current) {
//               remoteAudioEl.current.srcObject = ms;
//               try { remoteAudioEl.current.play(); } catch {}
//             }

//             setCanUnmute(true);
//             return;
//           }

//           tries += 1;
//           if (tries < MAX_TRIES) setTimeout(tryAttachFromReceivers, INTERVAL_MS);
//           else console.log('[CLIENT] Receiver-attach gave up (no tracks).');
//         };

//         setTimeout(tryAttachFromReceivers, 300);
//       })
//       .catch(err => console.error('[SRD] answer failed', err));
//   }, [answer, haveCreatedOffer]);

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
//       <video ref={largeFeedEl} className="vc-remote" autoPlay playsInline controls />
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

// import { useEffect, useRef, useState } from 'react';
// import axios from 'axios';
// import { useDispatch, useSelector } from 'react-redux';
// import addStream from '../redux-elements/actions/addStream';
// import updateCallStatus from '../redux-elements/actions/updateCallStatus';
// import createPeerConnection from '../webRTCutilities/createPeerConnection';
// import socketConnection from '../webRTCutilities/socketConnection';
// import ActionButtons from './ActionButtons';
// import './VideoComponents.css';

// function attachAndPlay(videoEl, mediaStream) {
//   if (!videoEl || !mediaStream) return;

//   videoEl.muted = true;       // autoplay-safe initially
//   videoEl.playsInline = true;
//   videoEl.autoplay = true;
//   videoEl.srcObject = mediaStream;

//   const tryPlay = () => {
//     const p = videoEl.play();
//     if (p && typeof p.catch === 'function') p.catch(() => {});
//   };

//   tryPlay();

//   const onMeta = () => { tryPlay(); videoEl.removeEventListener('loadedmetadata', onMeta); };
//   videoEl.addEventListener('loadedmetadata', onMeta);

//   mediaStream.getTracks().forEach(t => {
//     const onUnmute = () => { tryPlay(); t.removeEventListener('unmute', onUnmute); };
//     t.addEventListener('unmute', onUnmute);
//   });
// }

// export default function MainVideoPage() {
//   const dispatch = useDispatch();
//   const { audio, video, haveCreatedOffer, answer } = useSelector(s => s.callStatus);
//   const streams = useSelector(s => s.streams);

//   const rootRef = useRef(null);
//   const streamsRef = useRef(null);
//   const pendingIce = useRef([]);
//   const socketRef = useRef(null);
//   const smallFeedEl = useRef(null);
//   const largeFeedEl = useRef(null);
//   const remoteAudioEl = useRef(null);
//   const [iAmReady, setIAmReady] = useState(false);
//   const [proJoined, setProJoined] = useState(false);
//   const [proReady, setProReady] = useState(false);
//   const [canUnmute, setCanUnmute] = useState(true);

//   const API = "https://empathaimeet.onrender.com";

//   // token from ? or #/…?token=
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

//   // One-time "first gesture" handler: unmute + play
//   useEffect(() => {
//     const onFirstGesture = async () => {
//       try {
//         if (largeFeedEl.current) {
//           largeFeedEl.current.muted = false;
//           await largeFeedEl.current.play();
//         }
//         if (remoteAudioEl.current) {
//           remoteAudioEl.current.muted = false;
//           await remoteAudioEl.current.play();
//         }
//         setCanUnmute(false);
//       } catch {}
//       window.removeEventListener('pointerdown', onFirstGesture);
//       window.removeEventListener('keydown', onFirstGesture);
//     };
//     window.addEventListener('pointerdown', onFirstGesture, { once: true });
//     window.addEventListener('keydown', onFirstGesture, { once: true });
//     return () => {
//       window.removeEventListener('pointerdown', onFirstGesture);
//       window.removeEventListener('keydown', onFirstGesture);
//     };
//   }, []);

//   useEffect(() => {
//     if (!token) { console.error('No token found in URL'); return; }
//     let mounted = true;

//     (async () => {
//       await axios.post(`${API}/validate-link`, { token });

//       const socket = socketConnection(token);
//       socketRef.current = socket;

//       // handshake
//       socket.on('proJoined', () => { console.log('[SOCKET] proJoined'); setProJoined(true); });
//       socket.on('proReady',  () => { console.log('[SOCKET] proReady');  setProReady(true); });

//       // signaling
//       socket.on('answerToClient', ans => {
//         console.log('[SOCKET] answerToClient');
//         dispatch(updateCallStatus('answer', ans));
//       });
//       socket.on('iceToClient', ({ iceC }) => {
//         const pc = streamsRef.current?.remote1?.peerConnection;
//         if (pc?.remoteDescription) pc.addIceCandidate(iceC).catch(console.error);
//         else pendingIce.current.push(iceC);
//       });

//       // badges from remote
//       socket.on('toggleVideo', ({ off }) => rootRef.current?.classList.toggle('is-remote-video-off', !!off));
//       socket.on('toggleAudio', ({ muted }) => rootRef.current?.classList.toggle('is-remote-muted', !!muted));

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
//         (iceC) => socket.emit('iceToServer', { who: 'client', iceC }),
//         async (remoteStream) => {
//           if (!largeFeedEl.current) return;
//           console.log('[CLIENT] onRemoteStream attached:', remoteStream.getTracks().map(t=>t.kind));
//           // attach to video
//           attachAndPlay(largeFeedEl.current, remoteStream);
//           // mirror to hidden audio
//           if (remoteAudioEl.current) {
//             remoteAudioEl.current.srcObject = remoteStream;
//             remoteAudioEl.current.muted = true;
//             try { await remoteAudioEl.current.play(); } catch {}
//           }
//           setCanUnmute(true);

//           // badges sync
//           remoteStream.getTracks().forEach(tr => {
//             tr.onmute = () => rootRef.current?.classList.add(tr.kind === 'audio' ? 'is-remote-muted' : 'is-remote-video-off');
//             tr.onunmute = () => rootRef.current?.classList.remove(tr.kind === 'audio' ? 'is-remote-muted' : 'is-remote-video-off');
//           });
//         }
//       );

//       // send local
//       localStream.getTracks().forEach(t => peerConnection.addTrack(t, localStream));
//       dispatch(addStream('remote1', null, peerConnection));

//       socket.emit('iAmReady');
//       setIAmReady(true);
//       console.log('[HANDSHAKE] client iAmReady');
//     })();

//     return () => { mounted = false; socketRef.current?.disconnect(); };
//   }, [dispatch, token]);

//   // cache streams
//   useEffect(() => { if (streams.remote1) streamsRef.current = streams; }, [streams]);

//   // 🟢 Create offer when ready — require only proReady (not proJoined)
//   useEffect(() => {
//     const pc = streamsRef.current?.remote1?.peerConnection;
//     if (!pc) return;
//     if (iAmReady && proReady && !haveCreatedOffer && audio === 'enabled' && video === 'enabled') {
//       (async () => {
//         console.log('[NEGOTIATE] creating offer');
//         const offer = await pc.createOffer();
//         await pc.setLocalDescription(offer);
//         socketRef.current.emit('newOffer', { offer });
//         dispatch(updateCallStatus('haveCreatedOffer', true));
//       })().catch(console.error);
//     }
//   }, [iAmReady, proReady, haveCreatedOffer, audio, video, dispatch]);

//   // apply answer + flush ICE + attach fallback
//   useEffect(() => {
//     if (!answer || !haveCreatedOffer) return;
//     const pc = streamsRef.current?.remote1?.peerConnection;
//     if (!pc) return;

//     if (pc.currentRemoteDescription) return;
//     if (pc.signalingState !== 'have-local-offer') return;

//     pc.setRemoteDescription(answer)
//       .then(() => {
//         // flush queued ICE
//         pendingIce.current.forEach(c => pc.addIceCandidate(c).catch(console.error));
//         pendingIce.current = [];
//       })
//       .catch(err => console.error('[SRD] answer failed', err));
//   }, [answer, haveCreatedOffer]);

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
//       {/* remove controls → we handle audio programmatically */}
//       <video ref={largeFeedEl} className="vc-remote" autoPlay playsInline />
//       <video ref={smallFeedEl} className="vc-local" autoPlay playsInline muted />
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

// We still keep this helper for basic attach; it starts muted
function attachAndPlay(videoEl, mediaStream) {
  if (!videoEl || !mediaStream) return;

  videoEl.muted = true;       // autoplay-safe initially
  videoEl.playsInline = true;
  videoEl.autoplay = true;
  videoEl.srcObject = mediaStream;

  const tryPlay = () => {
    const p = videoEl.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  };

  tryPlay();

  const onMeta = () => { 
    tryPlay(); 
    videoEl.removeEventListener('loadedmetadata', onMeta); 
  };
  videoEl.addEventListener('loadedmetadata', onMeta);

  mediaStream.getTracks().forEach(t => {
    const onUnmute = () => { 
      tryPlay(); 
      t.removeEventListener('unmute', onUnmute); 
    };
    t.addEventListener('unmute', onUnmute);
  });
}

export default function MainVideoPage() {
  const dispatch = useDispatch();
  const { audio, video, haveCreatedOffer, answer } = useSelector(s => s.callStatus);
  const streams = useSelector(s => s.streams);

  const rootRef = useRef(null);
  const streamsRef = useRef(null);
  const pendingIce = useRef([]);
  const socketRef = useRef(null);
  const smallFeedEl = useRef(null);
  const largeFeedEl = useRef(null);
  const [iAmReady, setIAmReady] = useState(false);
  const [proJoined, setProJoined] = useState(false);
  const [proReady, setProReady] = useState(false);
  const [canUnmute, setCanUnmute] = useState(false); // only show if autoplay fails

  const API = "https://empathaimeet.onrender.com";

  // token from ? or #/…?token=
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

  useEffect(() => {
    if (!token) { console.error('No token found in URL'); return; }
    let mounted = true;

    (async () => {
      await axios.post(`${API}/validate-link`, { token });

      const socket = socketConnection(token);
      socketRef.current = socket;

      // handshake
      socket.on('proJoined', () => { 
        console.log('[SOCKET] proJoined'); 
        setProJoined(true); 
      });
      socket.on('proReady',  () => { 
        console.log('[SOCKET] proReady');  
        setProReady(true); 
      });

      // signaling
      socket.on('answerToClient', ans => {
        console.log('[SOCKET] answerToClient');
        dispatch(updateCallStatus('answer', ans));
      });
      socket.on('iceToClient', ({ iceC }) => {
        const pc = streamsRef.current?.remote1?.peerConnection;
        if (pc?.remoteDescription) pc.addIceCandidate(iceC).catch(console.error);
        else pendingIce.current.push(iceC);
      });

      // badges from remote (for UI only)
      socket.on('toggleVideo', ({ off }) =>
        rootRef.current?.classList.toggle('is-remote-video-off', !!off)
      );
      socket.on('toggleAudio', ({ muted }) =>
        rootRef.current?.classList.toggle('is-remote-muted', !!muted)
      );

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
        (iceC) => socket.emit('iceToServer', { who: 'client', iceC }),
        async (remoteStream) => {
          if (!largeFeedEl.current) return;
          console.log(
            '[CLIENT] onRemoteStream tracks:',
            remoteStream.getTracks().map(t => `${t.kind}:${t.readyState}:${t.enabled}`)
          );

          // 1) Attach and start muted
          attachAndPlay(largeFeedEl.current, remoteStream);

          // 2) Try to auto-unmute + play with audio
          try {
            largeFeedEl.current.muted = false;
            await largeFeedEl.current.play();
            console.log('[CLIENT] auto-unmute success');
            setCanUnmute(false); // no button needed
          } catch (err) {
            console.warn('[CLIENT] autoplay blocked, showing Unmute button', err);
            largeFeedEl.current.muted = true;
            setCanUnmute(true);
          }

          // badges sync
          remoteStream.getTracks().forEach(tr => {
            tr.onmute = () =>
              rootRef.current?.classList.add(
                tr.kind === 'audio' ? 'is-remote-muted' : 'is-remote-video-off'
              );
            tr.onunmute = () =>
              rootRef.current?.classList.remove(
                tr.kind === 'audio' ? 'is-remote-muted' : 'is-remote-video-off'
              );
          });
        }
      );

      // send local
      localStream.getTracks().forEach(t => peerConnection.addTrack(t, localStream));
      dispatch(addStream('remote1', null, peerConnection));

      socket.emit('iAmReady');
      setIAmReady(true);
      console.log('[HANDSHAKE] client iAmReady');
    })();

    return () => { mounted = false; socketRef.current?.disconnect(); };
  }, [dispatch, token]);

  // cache streams
  useEffect(() => { 
    if (streams.remote1) streamsRef.current = streams; 
  }, [streams]);

  // Create offer when ready (only require proReady)
  useEffect(() => {
    const pc = streamsRef.current?.remote1?.peerConnection;
    if (!pc) return;
    if (iAmReady && proReady && !haveCreatedOffer && audio === 'enabled' && video === 'enabled') {
      (async () => {
        console.log('[NEGOTIATE] creating offer');
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current.emit('newOffer', { offer });
        dispatch(updateCallStatus('haveCreatedOffer', true));
      })().catch(console.error);
    }
  }, [iAmReady, proReady, haveCreatedOffer, audio, video, dispatch]);

  // apply answer + flush ICE
  useEffect(() => {
    if (!answer || !haveCreatedOffer) return;
    const pc = streamsRef.current?.remote1?.peerConnection;
    if (!pc) return;

    if (pc.currentRemoteDescription) return;
    if (pc.signalingState !== 'have-local-offer') return;

    pc.setRemoteDescription(answer)
      .then(() => {
        pendingIce.current.forEach(c => pc.addIceCandidate(c).catch(console.error));
        pendingIce.current = [];
      })
      .catch(err => console.error('[SRD] answer failed', err));
  }, [answer, haveCreatedOffer]);

  const unmuteRemote = async () => {
    if (!largeFeedEl.current) return;
    largeFeedEl.current.muted = false;
    try { 
      await largeFeedEl.current.play(); 
      console.log('[CLIENT] manual unmute success'); 
    } catch (err) {
      console.error('[CLIENT] manual unmute failed', err);
    }
    setCanUnmute(false);
  };

  return (
    <div ref={rootRef} className="vc-root">
      <video ref={largeFeedEl} className="vc-remote" autoPlay playsInline />
      <video ref={smallFeedEl} className="vc-local" autoPlay playsInline muted />

      {canUnmute && (
        <button className="unmute-btn" onClick={unmuteRemote}>
          Unmute Remote
        </button>
      )}

      <div className="vc-badges">
        <span className="vc-badge badge-muted">Remote Muted</span>
        <span className="vc-badge badge-videooff">Remote Video Off</span>
      </div>

      <ActionButtons socket={socketRef.current} />
    </div>
  );
}

