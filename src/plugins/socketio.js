import Vue from 'vue'
import store from './vuex'
import VueSocketIO from 'vue-socket.io/dist/vue-socketio'
import config from '../../public/config'

Vue.use(new VueSocketIO({
  debug: true,
  secure: true,
  connection: config.chatServer,
  vuex: {
    store,
    actionPrefix: 'SOCKET_'
  }
}))
