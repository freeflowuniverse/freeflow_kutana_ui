import Vue from 'vue'

import App from './App.vue'
import vuetify from './plugins/vuetify';
import router from './plugins/router';
import store from './plugins/vuex';
import './plugins/socketio';

import './filters'

Vue.config.productionTip = false

export default new Vue({
  vuetify,
  router,
  store,
  render: h => h(App)
}).$mount('#app')
