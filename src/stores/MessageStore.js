export default {
    state: {
        messages: [],
    },
    mutations: {
        setMessages(state, messages) {
            state.messages = messages;
        },
        addMessage(state, message) {
            if (!state.messages) {
                state.messages = [];
            }
            state.messages.push(message);
        },
    },
    getters: {
        messages: state =>
            state.messages.slice(Math.max(state.messages.length - 200, 0)),
    },
};
