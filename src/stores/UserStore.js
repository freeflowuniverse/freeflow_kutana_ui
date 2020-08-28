export default {
    state: {
        localUser: null,
        remoteUsers: [],
        userControl: null,
        selectedUser: null,
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
    },
    actions: {
        findUserById({ getters }, id) {
            return getters.allUsers.find(user => user.id === id);
        },
        findUserByName({ getters }, name) {
            return getters.allUsers.find(user => user.name === name);
        },
        selectUser(context, { id, pinned }) {
            // If same user toggle pin
            if (
                context.getters.selectedUser &&
                context.getters.selectedUser.id == id
                ) {
                    pinned = !pinned;
                }

            console.log(`will update`, (
                !context.getters.selectedUser ||
                (context.getters.selectedUser && !context.getters.selectedUser.pinned) ||
                (context.getters.selectedUser && context.getters.selectedUser.pinned && !pinned)
            ))
            if (
                !context.getters.selectedUser ||
                (context.getters.selectedUser && !context.getters.selectedUser.pinned) ||
                (context.getters.selectedUser && context.getters.selectedUser.pinned && !pinned)
            )
                console.log(`updating selected user to `, {id, pinned})
                context.commit('selectUser', {
                    id,
                    pinned,
                });
        },
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
    },
};
