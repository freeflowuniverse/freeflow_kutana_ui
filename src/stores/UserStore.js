export default {
    state: {
        localUser: null,
        remoteUsers: [],
        userControl: null,
    },
    mutations: {
        setLocalUser(state, user) {
            state.localUser = user;
        }, setUserControl(state, userControl) {
            state.userControl = userControl;
        },
        addRemoteUser(state, user) {

            if (state.localUser && state.localUser.id === user.id) {
                return;
            }

            const userIndex = state.remoteUsers.findIndex(u => u.id === user.id);

            if (userIndex === -1) {
                state.remoteUsers.push(user);
                return;
            }

            state.remoteUsers.splice(userIndex, 1, user);
        },
        deleteRemoteUser(state, user) {
            state.remoteUsers = state.remoteUsers.filter(u => u.id !== user.id);
        }
    },
    actions: {
        findUserById({getters}, id) {
            return getters.allUsers.find(user => user.id === id);
        },
        findUserByName({getters}, name) {
            return getters.allUsers.find(user => user.name === name);
        }
    },
    getters: {
        localUser: state => state.localUser,
        remoteUsers: state => state.remoteUsers,
        allUsers: state => [state.localUser, ...state.remoteUsers],
        userControl: state => state.userControl,
    }
};
