// ActionButtons.jsx
import { useDispatch, useSelector } from 'react-redux';
import updateCallStatus from '../redux-elements/actions/updateCallStatus';

export default function ActionButtons({ socket }) {
  const dispatch = useDispatch();
  const { audio, video } = useSelector(s => s.callStatus);
  const streams = useSelector(s => s.streams);

  const toggleAudio = () => {
    const local = streams.localStream?.stream;
    if (!local) return;
    const willMute = audio === 'enabled';
    local.getAudioTracks().forEach(t => (t.enabled = !willMute));
    dispatch(updateCallStatus('audio', willMute ? 'off' : 'enabled'));
    socket?.emit('toggleAudio', { muted: willMute }); // just to show a badge on remote
  };

  const toggleVideo = () => {
    const local = streams.localStream?.stream;
    if (!local) return;
    const willOff = video === 'enabled';
    // we only toggle the sender's track.enabled; we DO NOT hide the remote element
    local.getVideoTracks().forEach(t => (t.enabled = !willOff));
    dispatch(updateCallStatus('video', willOff ? 'off' : 'enabled'));
    socket?.emit('toggleVideo', { off: willOff }); // remote shows "Video off" badge
  };

  const hangUp = () => {
    // minimal hangup; you can keep your existing one if you prefer
    Object.values(streams).forEach(({ peerConnection, stream }) => {
      try { stream?.getTracks().forEach(tr => tr.stop()); } catch {}
      try { peerConnection?.close(); } catch {}
    });
    dispatch(updateCallStatus('current', 'complete'));
  };

  return (
    <div className="vc-controls">
      <button className="vc-btn" onClick={toggleAudio}>
        {audio === 'enabled' ? 'Mute' : 'Unmute'}
      </button>
      <button className="vc-btn" onClick={toggleVideo}>
        {video === 'enabled' ? 'Stop Video' : 'Start Video'}
      </button>
      {/* <button className="vc-btn">Chat</button> */}
      {/* <button className="vc-btn">Share Screen</button> */}
      <button className="vc-btn vc-btn--danger" onClick={hangUp}>Hang Up</button>
    </div>
  );
}
