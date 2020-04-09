import socketService from "../services/socketService";

export default {
  actions: {
    join(context) {
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
          console.log("Joining screen share ... ")
          context.dispatch("joinScreenShare", message);
          break;
        default:
          console.log(`NOT DISPATCHING`);
          break;
      }
    },
  },
};
