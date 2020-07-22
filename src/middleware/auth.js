import router from '../plugins/router';
import store from '../plugins/vuex';

router.beforeEach((to, from, next) => {
    const account = JSON.parse(localStorage.getItem('account'));
    if (account && (!account.name || !account.uuid)) {
        store.commit('setAccount', null);
    }

    if (
        to.matched.some(record => record.meta.requiresAuth) &&
        !(store.getters.account && store.getters.account.name)
    ) {
        next({
            name: 'login',
            query: {
                redirect: to.fullPath,
            },
        });
        return;
    }

    next();
});
