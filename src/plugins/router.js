import VueRouter from 'vue-router'
import Vue from 'vue'

import Home from '../views/Home.vue'
import Login from '../views/Login.vue'

Vue.use(VueRouter)

export default new VueRouter({
  mode: 'history',
  routes: [
    { path: '/', component: Home },
    { path: '/login', component: Login }
  ]
})
