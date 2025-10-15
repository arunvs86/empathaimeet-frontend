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
