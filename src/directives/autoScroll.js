import Vue from "vue";

export default {
  inserted: (el) => {
    Vue.nextTick().then(() => {
      el.scrollTop = el.scrollHeight;
    });
  },
  update: function(el) {
    Vue.nextTick().then(function() {
      el.scrollTop = el.scrollHeight;
    });
  },
};
