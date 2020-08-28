import socketService from "../services/socketService";

export default {
  actions: {
    join(context, teamName) {
      if (teamName) {
        context.commit('setTeamName', teamName)
      }
      socketService.emit("join", {
        username: context.getters.account.name,
        channel: context.getters.teamName,
      });
    },
    sendMessage(context, message) {
      socketService.emit("message", {
        ...message,
        channel: context.getters.teamName
      });
    },
    sendSignal(context, message) {
      console.log('test')
      socketService.emit("signal", {
        ...message,
        channel: context.getters.teamName
      });
    },
    SOCKET_message(context, message) {
      context.commit("addMessage", message);
    },
    SOCKET_signal(context, message) {
      console.log(`GOT SIGNAL`, message);
      switch (message.type) {
        case "access_granted":
          context.dispatch("accessGranted");
          break;
        case "screenshare_started":
          console.log("[Signal] Joining screen share ... ");
          context.dispatch("joinScreenShare", message);
          break;
        case "screenshare_stopped":
          console.log("[Signal] Stopped screen share ... ");
          context.dispatch("stopScreenShare");
          break;
        case "presenter_started":
          console.log("[Signal] Presenter Mode ... ", message);
          context.dispatch('startPresenterMode', message)
          break;
        case "presenter_ended":
          console.log("[Signal] Presenter Mode ... ");
          context.dispatch('stopPresenterMode', message)
          break;
        default:
          console.log(`NOT DISPATCHING`);
          break;
      }
    },
  },
};
