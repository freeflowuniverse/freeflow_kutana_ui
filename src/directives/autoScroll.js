import Vue from 'vue'

export default {
  update: function (el) {
    Vue.nextTick().then(function () {
      el.scrollTop = el.scrollHeight
    })
  }
}