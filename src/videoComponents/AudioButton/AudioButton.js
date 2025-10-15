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

    // Tell the remote to show/hide a mute badge
    socket?.emit('toggleAudio', { muted: willMute });
  };

  return (
    <div className="button mic" onClick={toggleAudio}>
      <i className="fa fa-microphone" />
      <div className="btn-text">{audio === 'enabled' ? 'Mute' : 'Unmute'}</div>
    </div>
  );
}
