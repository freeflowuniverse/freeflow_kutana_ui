import Vue from 'vue';

export default {
    inserted: el => {
        Vue.nextTick().then(() => {
            el.scrollTop = el.scrollHeight;
        });
    },
    update: el => {
        Vue.nextTick().then(() => {
            el.scrollTop = el.scrollHeight;
        });
    },
};
