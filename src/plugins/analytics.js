import Vue from 'vue'
import VueAnalytics from 'vue-analytics'
import config from '../../public/config'
import router from './router'

Vue.use(VueAnalytics, {
  id: config.gaId,
  router
})