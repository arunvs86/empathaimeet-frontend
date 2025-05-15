// import { useEffect, useRef } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useSearchParams } from 'react-router-dom';
// import updateCallStatus from '../../redux-elements/actions/updateCallStatus';
// import socketConnection from '../../webRTCutilities/socketConnection';

// export default function VideoButton({ smallFeedEl }) {
//   const dispatch = useDispatch();
//   const { video } = useSelector(state => state.callStatus);
//   const streams = useSelector(state => state.streams);
//   const [searchParams] = useSearchParams();
//   const socketRef = useRef(null);

//   useEffect(() => {
//     socketRef.current = socketConnection(searchParams.get('token'));
//   }, [searchParams]);

//   const toggleVideo = () => {
//     const localStream = streams.localStream?.stream;
//     if (!localStream) return;

//     const willOff = video === 'enabled';
//     // Stop/start local video tracks
//     localStream.getVideoTracks().forEach(t => (t.enabled = !willOff));
//     // Update Redux
//     dispatch(updateCallStatus('video', willOff ? 'disabled' : 'enabled'));
//     // Notify peer
//     socketRef.current.emit('toggleVideo', { off: willOff });
//   };

//   return (
//     <div className="button camera" onClick={toggleVideo}>
//       <i className="fa fa-video" />
//       <div className="btn-text">{video === 'enabled' ? 'Stop' : 'Start'} Video</div>
//     </div>
//   );
// }

import { useDispatch, useSelector } from 'react-redux';
import updateCallStatus from '../../redux-elements/actions/updateCallStatus';

export default function VideoButton({ socket }) {
  const dispatch = useDispatch();
  const { video } = useSelector(s => s.callStatus);
  const streams = useSelector(s => s.streams);

  const toggleVideo = () => {
    const localStream = streams.localStream?.stream;
    if (!localStream) return;
    const willOff = video === 'enabled';
    localStream.getVideoTracks().forEach(t => (t.enabled = !willOff));
    dispatch(updateCallStatus('video', willOff ? 'off' : 'enabled'));
    socket?.emit('toggleVideo', { off: willOff });
  };

  return (
    <div className="button camera" onClick={toggleVideo}>
      <i className="fa fa-video" />
      <div className="btn-text">{video === 'enabled' ? 'Stop' : 'Start'} Video</div>
    </div>
  );
}
