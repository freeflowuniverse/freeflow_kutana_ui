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
        setPresenter({ commit, dispatch }, { user, backgroundImage }) {
            user.presenting = true;
            user.backgroundImage = backgroundImage;
            commit('setPresenter', user);
            dispatch('selectUser', { id: user.id, pinned: true });
        },
        removePresenter({ commit, getters }, user) {
            if (getters.presenter.id !== user.id) {
                return;
            }
            commit('removePresenter');
            commit('selectUser', { id: user.id, pinned: false });
        }
    },
    getters: {
        presentingModeActive: state => state.presentingModeActive,
        presenter: state => state.presenter
    }
}
