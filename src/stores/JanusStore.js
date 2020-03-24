import { Janus } from "janus-gateway";

export default {
    state: {
        count: 0
    },
    mutations: {
        incrementCount(state) {
            state.count++
        }
    },
    actions: {
        incrementCount(context) {
            context.commit('incrementCount')
        }
    },
    getters: {
        count: state => state.count
    },
}
