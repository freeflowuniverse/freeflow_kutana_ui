export default {
    state: {
        presenter: null
    },
    mutations: {
        setPresenter(state, presenter) {
            state.presenter = presenter;
        }
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
            commit('setPresenter', null)
        }
    },
    getters: {
        presenter: state => state.presenter
    }
}
