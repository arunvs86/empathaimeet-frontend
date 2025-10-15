// src/webRTCutilities/createPeerConnection.js
import peerConfiguration from './stunServers';

const createPeerConnection = (addIce, onRemoteStream) => {
  return new Promise((resolve) => {
    const pc = new RTCPeerConnection(peerConfiguration);

    // DO NOT pre-add transceivers. We'll only use addTrack on both sides.

    // Loud state logs
    pc.onconnectionstatechange = () =>
      console.log('[PC] connectionState=', pc.connectionState);
    pc.oniceconnectionstatechange = () =>
      console.log('[PC] iceConnectionState=', pc.iceConnectionState);
    pc.onsignalingstatechange = () =>
      console.log('[PC] signalingState=', pc.signalingState);

    // Relay ICE
    pc.onicecandidate = (e) => {
      if (e.candidate) addIce(e.candidate);
    };

    // Single remote stream delivery (first stream wins)
    let delivered = false;
    pc.ontrack = (e) => {
      const stream = e.streams?.[0];
      console.log('[PC] ontrack kind=', e.track?.kind, 'streams=', e.streams?.length);
      if (!stream) return;
      if (!delivered && typeof onRemoteStream === 'function') {
        delivered = true;
        onRemoteStream(stream);
      }
    };

    resolve({ peerConnection: pc });
  });
};

export default createPeerConnection;
