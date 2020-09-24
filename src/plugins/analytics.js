import Vue from 'vue'
import VueAnalytics from 'vue-analytics'
import config from '../../public/config'

Vue.use(VueAnalytics, {
  id: config.gaId
})