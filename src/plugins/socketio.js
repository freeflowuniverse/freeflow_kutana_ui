import Vue from "vue";
import store from "./vuex";
import VueSocketIO from "vue-socket.io/dist/vue-socketio";
import config from "../../public/config";
const options = { transports: ["websocket"] };
Vue.use(
  new VueSocketIO({
    debug: true,
    secure: true,
    connection: config.ffcBackend,
    connection: SocketIO(config.ffcBackend, options),
    vuex: {
      store,
      actionPrefix: "SOCKET_",
    },
  })
);
