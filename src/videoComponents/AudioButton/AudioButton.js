// import { useEffect, useRef } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useSearchParams } from 'react-router-dom';
// import updateCallStatus from '../../redux-elements/actions/updateCallStatus';
// import socketConnection from '../../webRTCutilities/socketConnection';

// export default function AudioButton() {
//   const dispatch = useDispatch();
//   const { audio } = useSelector(state => state.callStatus);
//   const streams = useSelector(state => state.streams);
//   const [searchParams] = useSearchParams();
//   const socketRef = useRef(null);

//   // Grab the same socket used in Main/Pro pages
//   useEffect(() => {
//     socketRef.current = socketConnection(searchParams.get('token'));
//   }, [searchParams]);

//   const toggleAudio = () => {
//     const localStream = streams.localStream?.stream;
//     if (!localStream) return;

//     const willMute = audio === 'enabled';
//     // Mute/unmute local audio tracks
//     localStream.getAudioTracks().forEach(t => (t.enabled = !willMute));
//     // Update Redux so button label changes
//     dispatch(updateCallStatus('audio', willMute ? 'disabled' : 'enabled'));
//     // Notify peer
//     socketRef.current.emit('toggleAudio', { muted: willMute });
//   };

//   return (
//     <div className="button mic" onClick={toggleAudio}>
//       <i className="fa fa-microphone" />
//       <div className="btn-text">{audio === 'enabled' ? 'Mute' : 'Unmute'}</div>
//     </div>
//   );
// }

import { useDispatch, useSelector } from 'react-redux';
import updateCallStatus from '../../redux-elements/actions/updateCallStatus';

export default function AudioButton({ socket }) {
  const dispatch = useDispatch();
  const { audio } = useSelector(s => s.callStatus);
  const streams = useSelector(s => s.streams);

  const toggleAudio = () => {
    const localStream = streams.localStream?.stream;
    if (!localStream) return;
    const willMute = audio === 'enabled';
    localStream.getAudioTracks().forEach(t => (t.enabled = !willMute));
    dispatch(updateCallStatus('audio', willMute ? 'off' : 'enabled'));
    // socket?.emit('toggleAudio', { muted: willMute });
  };

  return (
    <div className="button mic" onClick={toggleAudio}>
      <i className="fa fa-microphone" />
      <div className="btn-text">{audio === 'enabled' ? 'Mute' : 'Unmute'}</div>
    </div>
  );
}
