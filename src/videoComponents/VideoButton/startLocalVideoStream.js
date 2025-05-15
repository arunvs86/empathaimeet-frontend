import updateCallStatus from "../../redux-elements/actions/updateCallStatus";

const startLocalVideoStream = (streams, dispatch) => {
  const localStream = streams.localStream?.stream;
  if (!localStream) return;

  for (const key in streams) {
    if (key !== 'localStream') {
      const pc = streams[key].peerConnection;
      localStream.getVideoTracks().forEach(track => {
        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(track);
        } else {
          pc.addTrack(track, localStream);
        }
      });
    }
  }
};

export default startLocalVideoStream;