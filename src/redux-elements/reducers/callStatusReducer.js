const initState = {
    current: "idle",
    video: "off",
    audio: "off",
    audioDevice: 'default',
    videoDevice: 'default',
    shareScreen: false,
    haveMedia: false,
    haveCreatedOffer: false,
    haveCreatedAnswer: false,
    offer: null,
    answer: null,
  };
  
  export default (state = initState, action) => {
    if (action.type === "UPDATE_CALL_STATUS") {
      const copyState = { ...state };
      copyState[action.payload.prop] = action.payload.value;
      return copyState;
    } else if ((action.type === "LOGOUT_ACTION") || (action.type === "NEW_VERSION")) {
      return initState;
    } else {
      return state;
    }
  };
  