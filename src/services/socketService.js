import vm from '../main.js'

export default {
  emit (type, message) {
    console.log(`Trying to emit ${type}`)
    if (vm && vm.$socket) {
      console.log(`Emiting ${type}`, message)
      vm.$socket.emit(type, message);
    } else {
      setTimeout(()=>{
        this.emit(type, message)
      }, 500);
    }
  }
}

