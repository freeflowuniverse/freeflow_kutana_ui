import random from '../plugins/random';
import moment from 'moment';
import ffcService from '../services/ffcService';

export default {
    state: {
        isAccepted: false,
        teamName: window.localStorage.getItem('teamName') || null,
    },
    mutations: {
        setAccepted(state, accepted) {
            state.isAccepted = accepted;
        },
        setTeamName(state, teamName) {
            if (teamName.length < 15) teamName = teamName.toLowerCase();
            window.localStorage.setItem('teamName', teamName);
            state.teamName = teamName;
        },
    },
    actions: {
        createTeam({ commit }) {
            commit('setTeamName', random.stringGenerator(15));
        },
        getTeamInfo({ commit, getters }) {
            ffcService.getTeamInfo(getters.teamName).then(result => {
                let data = result.data;
                commit('setMessages', data.messages);
            });
        },
        requestAccess({ commit, dispatch, getters }, token) {
            commit('setTeamName', token);
            dispatch('sendSignal', {
                sender: getters.account.name,
                createdAt: moment(),
                content: token,
                type: 'access_requested',
            });
        },
        accessGranted({ commit, dispatch }) {
            commit('setAccepted', true);
            dispatch('join');
        },
        joinScreenShare({ dispatch, getters }, message) {
            if (!getters.allUsers) {
                return;
            }
            let userSharingScreen = getters.allUsers.find(
                u => u.username === message.sender
            );
            if (!userSharingScreen || !userSharingScreen.id) {
                return;
            }
            dispatch('changeViewStyle', 'presentation');
            dispatch('selectUser', { id: userSharingScreen.id, pinned: true });
        },
        async setPresenterMode({ dispatch, getters }, message) {
            message = message || getters.presentationMessage;
            if (getters.localUser.id === message.id) {
                let localUser = getters.localUser;
                dispatch('setPresenter', {
                    user: localUser,
                    backgroundImage: message.backgroundImage,
                });
                return;
            }
            let presenter = await dispatch('findUserById', message.id);
            dispatch('setPresenter', {
                user: presenter,
                backgroundImage: message.backgroundImage,
            });
        },
        async stopPresenterMode({ dispatch, getters }) {
            const presenter = getters.presenter;
            await dispatch('removePresenter', presenter);
        },
    },
    getters: {
        teamName: state => {
            return state.teamName;
        },
        isAccepted: state => {
            return state.isAccepted;
        },
    },
};
