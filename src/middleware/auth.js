import router from "../plugins/router";
import store from "../plugins/vuex";

router.beforeEach((to, from, next) => {
  console.log(`CHECKING ROUTE....`)
  if (to.matched.some(record => record.meta.requiresAuth) && !(store.getters.account && store.getters.account.name)) {
    console.log(`CHECKING ROUTE: Please login`)
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
