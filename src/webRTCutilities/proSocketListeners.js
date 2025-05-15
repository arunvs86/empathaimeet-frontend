// import updateCallStatus from '../redux-elements/actions/updateCallStatus';

// const proDashabordSocketListeners = (socket,setApptInfo,dispatch)=>{
//     socket.on('apptData',apptData=>{
//         console.log(apptData)
//         setApptInfo(apptData)
//     })

//     socket.on('newOfferWaiting',offerData=>{
//         //dispatch the offer to redux so that it is available for later
//         dispatch(updateCallStatus('offer',offerData.offer))
//         dispatch(updateCallStatus('myRole','answerer'))
//     })
// }

//     const proVideoSocketListeners = (socket,addIceCandidateToPc)=>{
//         socket.on('iceToClient',iceC=>{
//             addIceCandidateToPc(iceC)
//         })
//     }

// export default { proDashabordSocketListeners,proVideoSocketListeners }

// No longer needed for dashboard logic.
// We handle everything directly in ProMainVideoPage now.
export const proSocketListeners = () => {};
export const proVideoSocketListeners = (socket, addIce) => {
  socket.on('iceToClient', ({ iceC }) => addIce(iceC));
};
