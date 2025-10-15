import updateCallStatus from '../redux-elements/actions/updateCallStatus';

export default function clientSocketListeners(socket, dispatch, addIce) {
  socket.on('answerToClient', answer => {
    dispatch(updateCallStatus('answer', answer));
    dispatch(updateCallStatus('myRole', 'offerer'));
  });
  socket.on('iceToClient', ({ iceC }) => {
    addIce(iceC);
  });
}
