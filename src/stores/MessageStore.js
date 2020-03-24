import messages from './messages.json'
export default {
  state: {
    messages: []
  },
  mutations: {
    getMessages(state) {
      state.messages = messages
    },
    sendMessage(state, message) {
      console.log(message)
      state.messages.push(message)
    }
  },
  actions: {
    getMessages(context) {
      context.commit("getMessages")
    },
    sendMessage(context, message) {
      context.commit("sendMessage", message)
    }
  },
  getters: {
    messages: state => state.messages
  },
}
