import Vue from 'vue'
import Vuex from 'vuex'

import ExampleStore from '../stores/ExampleStore'
import MessageStore from '../stores/MessageStore'
import JanusStore from '../stores/JanusStore'
import AuthStore from '../stores/AuthStore'
import MainStore from '../stores/MainStore'
import TeamStore from '../stores/TeamStore'
import SocketStore from '../stores/SocketStore'

Vue.use(Vuex)

export default new Vuex.Store({
    modules: {
        ExampleStore,
        MessageStore,
        JanusStore,
        AuthStore,
        MainStore,
        TeamStore,
        SocketStore
    }
})
