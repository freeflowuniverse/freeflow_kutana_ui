export default {
    state: {
        snackbarMessage: ''
    },
    mutations: {
        setSnackbarMessage(state, message) {
            state.snackbarMessage = message
        }
    },
    actions: {
        setSnackbarMessage(context, message) {
            context.commit('setSnackbarMessage', message)
        }
    },
    getters: {
        snackbarMessage: state => state.snackbarMessage
    },
}
