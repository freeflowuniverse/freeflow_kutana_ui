import socketService from "../services/socketService";

export default {
  state: {
    screenShareMessage: null,
    presentationMessage: null
  },
  mutations: {
    setScreenShareMessage(state, screenShareMessage) {
      state.screenShareMessage = screenShareMessage;
    },
    setPresentationMessage(state, presentationMessage) {
      state.presentationMessage = presentationMessage;
    }
  },
  actions: {
    join({ commit, getters }, teamName) {
      if (teamName) {
        commit('setTeamName', teamName)
      }
      socketService.emit("join", {
        username: getters.account.name,
        channel: getters.teamName,
      });
    },
    sendMessage({ getters }, message) {
      socketService.emit("message", {
        ...message,
        channel: getters.teamName
      });
    },
    sendSignal({ getters }, message) {
      socketService.emit("signal", {
        ...message,
        channel: getters.teamName
      });
    },
    SOCKET_message({ commit }, message) {
      commit("addMessage", message);
    },
    SOCKET_signal({ dispatch, commit, getters }, message) {
      console.log(`GOT SIGNAL`, message);
      switch (message.type) {
        case "access_granted":
          dispatch("accessGranted");
          break;
        case "screenshare_started":
          console.log("[Signal] Joining screen share ... ");
          dispatch("joinScreenShare", message);
          break;
        case "screenshare_stopped":
          console.log("[Signal] Stopped screen share ... ");
          dispatch("stopScreenShare", message);
          break;
        case "presenter_started":
          console.log("[Signal] Presenter Mode Started ... ");
          commit("setSnackbarMessage", {
            text: `${message.sender} started presenting`,
          });
          if (getters.localUser) {
            dispatch('setPresenterMode', message);
            return;
          }
          commit('setPresentationMessage', message);
          break;
        case "presenter_change_settings":
          dispatch('setPresenterMode', message);
          break;
        case "presenter_ended":
          console.log("[Signal] Presenter Mode Stopped ... ");
          dispatch('stopPresenterMode', message)
          break;
        default:
          console.log(`NOT DISPATCHING`);
          break;
      }
    },
  },
  getters: {
    screenShareMessage: state => state.screenShareMessage,
    presentationMessage: state => state.presentationMessage
  }
};
