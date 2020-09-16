export default {
    state: {
        presentingModeActive: false,
        presenter: null
    },
    mutations: {
        setPresenter(state, presenter) {
            state.presenter = presenter;
        },
        removePresenter(state) {
            state.presenter = null;
        },
        setPresenterMode(state, isActive) {
            state.presentingModeActive = isActive;
        },
    },
    actions: {
        startPresenting({ dispatch, getters }) {
            dispatch('sendSignal', {
                sender: getters.localUser.username,
                type: 'presenter_started',
                backgroundImage: getters.wallpaperDataUrl,
                id: getters.localUser.id
            });
        },
        stopPresenting({ dispatch, getters }) {
            dispatch('sendSignal', {
                sender: getters.localUser.username,
                type: 'presenter_ended',
                id: getters.localUser.id
            });
        },
        changePresenterSettings({ dispatch, getters }, background) {
            dispatch('sendSignal', {
                type: 'presenter_change_settings',
                backgroundImage: background,
                id: getters.localUser.id
            });
        },
        setPresenter({ commit, dispatch }, { presenter, backgroundImage }) {
            if(!presenter) {
                return
            }
            presenter.presenting = true;
            presenter.backgroundImage = backgroundImage;
            commit('setPresenter', presenter);
            dispatch('selectUser', { id: presenter.id, pinned: true });
        },
        removePresenter({ commit }, presenter) {
            commit('selectUser', { id: presenter.id, pinned: false });
            commit('removePresenter');
        }
    },
    getters: {
        presentingModeActive: state => state.presentingModeActive,
        presenter: state => state.presenter
    }
}
