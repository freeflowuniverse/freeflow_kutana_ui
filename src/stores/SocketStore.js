export default {
  actions: {
    SOCKET_message(context, message) {
      context.commit("addMessage", message);
    },
    SOCKET_signal(context, message) {
      switch (message.type) {
        case "access_requested":
          context.dispatch("accessRequested", message);
          break;
        case "access_granted":
          context.dispatch("accessGranted");
          break;
        default:
          console.log(`NOT DISPATCHING`);
          break;
      }
    }
  }
};
