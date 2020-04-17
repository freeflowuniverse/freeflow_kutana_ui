import VueRouter from "vue-router";
import Vue from "vue";

import Landing from "../views/Landing.vue";
import Room from "../views/MobileRoom.vue";
import Login from "../views/Login.vue";
import WaitingRoom from "../views/WaitingRoom.vue";

Vue.use(VueRouter);

export default new VueRouter({
  mode: "history",
  routes: [
    { path: "/", name: 'home', component: Landing, meta: { requiresAuth: false } },
    { path: "/room", name: 'room', component: Room, meta: { requiresAuth: true } },
    { path: "/login", name: 'login', component: Login, meta: { requiresAuth: false } },
    { path: "/room/invite/:token", name: 'waitingRoom', component: WaitingRoom, meta: { requiresAuth: true } },
  ]
});
