export default {
    state: {
        snackbarMessage: '',
        alertUser: null
    },
    mutations: {
        setSnackbarMessage(state, message) {
            state.snackbarMessage = message
        },
        alertUser(state) {
            state.alertUser = Math.random()
        }
    },
    actions: {
        setSnackbarMessage(context, message) {
            context.commit('setSnackbarMessage', message)
        }
    },
    getters: {
        snackbarMessage: state => state.snackbarMessage,
        alertUser: (state) => { return state.alertUser }
    },
}
