import Vue from 'vue';
import store from './vuex';
import io from 'socket.io-client';
import VueSocketIO from 'vue-socket.io/dist/vue-socketio';
import config from '../../public/config';

Vue.use(
    new VueSocketIO({
        debug: false,
        secure: true,
        connection: io(config.ffcBackend),
        vuex: {
            store,
            actionPrefix: 'SOCKET_',
        },
    })
);
