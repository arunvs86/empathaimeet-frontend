// No longer needed for dashboard logic.
// We handle everything directly in ProMainVideoPage now.
export const proSocketListeners = () => {};
export const proVideoSocketListeners = (socket, addIce) => {
  socket.on('iceToClient', ({ iceC }) => addIce(iceC));
};
