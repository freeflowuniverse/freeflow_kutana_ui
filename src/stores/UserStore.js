export default {
    state: {
        localUser: null,
        remoteUsers: [],
        userControl: null,
        selectedUser: null,
        fullScreenUser: null
    },
    mutations: {
        setLocalUser(state, user) {
            state.localUser = user;
        },
        selectUser(state, userId) {
            state.selectedUser = userId;
        },
        setUserControl(state, userControl) {
            state.userControl = userControl;
        },
        addRemoteUser(state, user) {
            if (state.localUser && state.localUser.id === user.id) {
                return;
            }

            const userIndex = state.remoteUsers.findIndex(
                u => u.id === user.id
            );

            if (userIndex === -1) {
                state.remoteUsers.push(user);
                return;
            }

            state.remoteUsers.splice(userIndex, 1, user);
        },
        updateRemoteUser(state, user) {
            const userIndex = state.remoteUsers.findIndex(
                u => u.id === user.id
            );
            state.remoteUsers.splice(userIndex, 1, user);
        },
        deleteRemoteUser(state, user) {
            state.remoteUsers = state.remoteUsers.filter(u => u.id !== user.id);
        },
        setFullscreenUser(state, user) {
            state.fullScreenUser = user
        }
    },
    actions: {
        findUserById({ getters }, id) {
            return getters.allUsers.find(user => user.id === id);
        },
        findUserByName({ getters }, name) {
            return getters.allUsers.find(user => user.name === name);
        },
        selectUser({ getters, commit }, { id, pinned }) {
            // If same user toggle pin
            if (
                getters.selectedUser &&
                getters.selectedUser.id === id &&
                getters.selectedUser.pinned
                ) {
                    pinned = !pinned;
                }
            if (
                pinned ||
                !getters.selectedUser ||
                (getters.selectedUser && !getters.selectedUser.pinned) ||
                (getters.selectedUser.id === id)
            )
                commit('selectUser', {
                    id,
                    pinned,
                });
        },
        setSpeakerVolume({commit, getters}, {id, volume}) {
            // find user
            const user = getters.allUsers.find(u => u.id == id)
            if(!user) {
                return
            }
            // update value
            user.speakingVolume = volume
            // save value
            commit('addRemoteUser', user)
        }
    },
    getters: {
        localUser: state => state.localUser,
        remoteUsers: state => state.remoteUsers,
        allUsers: state => {
            if (!state.localUser) {
                return state.remoteUsers;
            }
            return [state.localUser, ...state.remoteUsers];
        },
        userControl: state => state.userControl,
        selectedUser: state => {
            return state.selectedUser;
        },
        fullScreenUser: (state) => { return state.fullScreenUser }
    },
};
