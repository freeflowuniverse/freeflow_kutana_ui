import Vue from 'vue'
import Vuex from 'vuex'

import ExampleStore from '../stores/ExampleStore'

Vue.use(Vuex)

export default new Vuex.Store({
    modules: {
        ExampleStore
    }
})
