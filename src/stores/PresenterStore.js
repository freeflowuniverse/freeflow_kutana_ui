export default {
    state: {
        presentingModeActive: false,
        presenter: null
    },
    mutations: {
        setPresenter(state, presenter) {
            state.presenter = { ...presenter };
        },
        removePresenter(state) {
            state.presenter = null;
        },
        setPresenterMode(state, isActive) {
            state.presentingModeActive = isActive;
        },
    },
    actions: {
        setPresenter({ commit }, { user, backgroundImage }) {
            user.presenting = true;
            user.backgroundImage = backgroundImage;
            commit('setPresenter', user);
        },
        removePresenter({ commit, getters }, user) {
            if (getters.presenter.id !== user.id) {
                return;
            }
            commit('removePresenter');
        }
    },
    getters: {
        presentingModeActive: state => state.presentingModeActive,
        presenter: state => state.presenter
    }
}
