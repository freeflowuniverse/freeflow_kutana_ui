import router from "../plugins/router";
import store from "../plugins/vuex";

router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth) && !(store.getters.account && store.getters.account.name)) {
    next({
      name: "login",
      query: {
        redirect: to.fullPath
      }
    });
  } else {
    next();
  }
});
