import VueRouter from 'vue-router';
import Vue from 'vue';

import Landing from '../views/Landing.vue';
import Room from '../views/Room.vue';
import Dev from '../views/Dev.vue';
import AutoJoin from '../views/AutoJoin';

Vue.use(VueRouter);

export default new VueRouter({
    mode: 'history',
    routes: [
        {
            path: '/',
            name: 'home',
            component: Landing,
            meta: { requiresAuth: false },
        },
        {
            path: '/dev',
            name: 'dev',
            component: Dev,
            meta: { requiresAuth: false },
        },
        {
            path: '/room/autoJoin',
            name: 'autoJoin',
            component: AutoJoin,
            meta: { requiresAuth: false },
        },
        {
            path: '/room/:token',
            name: 'room',
            component: Room,
            meta: { requiresAuth: true, hideAccount: true },
        },
    ],
});
