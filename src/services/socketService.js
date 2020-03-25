import vm from '../main.js'

export default {
  sendMessage (message) {
    this.emit('message', message)
  },
  sendSignal (message) {
    this.emit('signal', message)
  },
  emit (type, message) {
    vm.$socket.emit(type, message)
  }
}
