export default {
    state: {
        /** @type {User} */
        localUser: null,
        /** @type {User[]} */
        remoteUsers: [],
        /** @type {Map<number, MediaStream>} */
        remoteStreams: new Map(),
        /** @type {UserControl} */
        userControl: null,
        /** @type {User} */
        selectedUser: null,
        /** @type {User} */
        fullScreenUser: null,
        /** @type {TinyUser[]} */
        mutedUsers: [],
        /** @type {TinyUser[]} */
        mutedVideoUsers: [],
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
            if (state.localUser && state.localUser.uuid === user.uuid) {
                return;
            }

            const userIndex = state.remoteUsers.findIndex(
                u => u.uuid === user.uuid
            );

            if (userIndex === -1) {
                state.remoteUsers.push(user);
                return;
            }

            state.remoteUsers.splice(userIndex, 1, user);
        },
        addRemoteStream(state, { userId, stream }) {
            state.remoteStreams.set(userId, stream);
        },
        deleteRemoteStream(state, userId) {
            state.remoteStreams.delete(userId);
        },
        /**
         * @param state
         * @param {TinyUser} tinyUser
         * @param {boolean} muted
         */
        modifyMutedUsers(state, { tinyUser, muted }) {
            if (!muted) {
                state.mutedUsers = state.mutedUsers.filter(
                    mu => mu.uuid !== tinyUser.uuid
                );
                return;
            }
            let mutedUsers = state.mutedUsers;
            mutedUsers.push(tinyUser);
            state.mutedUsers = mutedUsers.filter((value, index, self) => {
                return self.indexOf(value) === index;
            });
        },
        /**
         * @param state
         * @param {TinyUser} tinyUser
         * @param {boolean} muted
         */
        modifyMutedVideoUsers(state, { tinyUser, muted }) {
            if (!muted) {
                state.mutedVideoUsers = state.mutedVideoUsers.filter(
                    mvu => mvu.uuid !== tinyUser.uuid
                );
                return;
            }
            let mutedVideoUsers = state.mutedVideoUsers;
            mutedVideoUsers.push(tinyUser);
            state.mutedVideoUsers = mutedVideoUsers.filter(
                (value, index, self) => {
                    return self.indexOf(value) === index;
                }
            );
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
            state.fullScreenUser = user;
        },
    },
    actions: {
        findUserById({ getters }, id) {
            return getters.allUsers.find(user => user.id === id);
        },
        findUserByName({ getters }, name) {
            return getters.allUsers.find(user => user.name === name);
        },
        selectUser({ getters, commit }, { id, pinned }) {
            if (
                pinned ||
                !getters.selectedUser ||
                (getters.selectedUser && !getters.selectedUser.pinned) ||
                getters.selectedUser.id === id
            ) {
                commit('selectUser', {
                    id,
                    pinned,
                });
            }
        },
        unSelectUser({ commit }) {
            commit('selectUser', {});
        },
        setSpeakerVolume({ commit, getters }, { id, volume }) {
            // find user
            const user = getters.allUsers.find(u => u.id == id);
            if (!user) {
                return;
            }
            // update value
            user.speakingVolume = volume;
            // save value
            commit('addRemoteUser', user);
        },
        setFullscreenUser({ commit }, user) {
            commit('setFullscreenUser', user);
        },
    },
    getters: {
        /** @returns {User} */
        localUser: state => state.localUser,
        /** @returns {User[]} */
        remoteUsers: state => state.remoteUsers,
        /** @returns {Map<number, MediaStream} */
        remoteStreams: state => state.remoteStreams,
        /** @returns {User[]} */
        allUsers: state => {
            if (!state.localUser) {
                return state.remoteUsers;
            }
            return [state.localUser, ...state.remoteUsers];
        },
        /** @returns {UserControl} */
        userControl: state => state.userControl,
        /** @returns {User} */
        selectedUser: state => {
            const allUsers = [state.localUser, ...state.remoteUsers];
            let selectedUSer =
                allUsers.find(u => u?.id === state?.selectedUser?.id) ||
                state.remoteUsers[0] ||
                state.localUser;
            return { ...selectedUSer, pinned: !!state?.selectedUser?.pinned };
        },
        /** @returns {User} */
        fullScreenUser: state => state.fullScreenUser,
        /** @returns {TinyUser[]} */
        mutedUsers: state => state.mutedUsers,
        /** @returns {TinyUser[]} */
        mutedVideoUsers: state => state.mutedVideoUsers,
        /** @returns {int} */
        amountOfUsers: state => {
            if (!state.localUser) {
                return state.remoteUsers;
            }
            return [state.localUser, ...state.remoteUsers].length;
        },
    },
};
