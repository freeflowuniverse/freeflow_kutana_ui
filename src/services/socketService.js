import vm from '../main.js'

export default {
  sendMessage (message) {
    this.emit('message', message)
  },
  sendSignal (message) {
    this.emit('signal', message)
  },
  emit (type, message) {
    message.channel = 'test'
    if (vm && vm.$socket) {
      vm.$socket.emit(type, message);
    } else {
      setTimeout(()=>{
        this.emit(type, message)
      }, 500);
    }
  }
}

