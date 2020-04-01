import VueRouter from "vue-router";
import Vue from "vue";

import Home from "../views/Home.vue";
import Login from "../views/Login.vue";
import WaitingRoom from "../views/WaitingRoom.vue";

Vue.use(VueRouter);

export default new VueRouter({
  mode: "history",
  routes: [
    { path: "/", name: 'home', component: Home, meta: { requiresAuth: true } },
    { path: "/login", name: 'login', component: Login, meta: { requiresAuth: false } },
    { path: "/invite/:token", name: 'waitingRoom', component: WaitingRoom, meta: { requiresAuth: true } },
  ]
});
