import VueRouter from "vue-router";
import Vue from "vue";

import Landing from "../views/Landing.vue";
import Room from "../views/Room.vue";
import Login from "../views/Login.vue";
import Dev from "../views/Dev.vue";
import GuestLogin from "../views/GuestLogin.vue";

Vue.use(VueRouter);

export default new VueRouter({
  mode: "history",
  routes: [
    { path: "/", name: 'home', component: Landing, meta: { requiresAuth: false } },
    { path: "/guestlogin", name: 'GuestLogin', component: GuestLogin, meta: { requiresAuth: false } },
    { path: "/login", name: 'login', component: Login, meta: { requiresAuth: false } },
    { path: "/dev", name: 'login', component: Dev, meta: { requiresAuth: false } },
    { path: "/room/:token", name: 'room', component: Room, meta: { requiresAuth: true } },
  ]
});
