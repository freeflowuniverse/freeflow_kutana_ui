import Vue from 'vue';

import App from './App.vue';
import vuetify from './plugins/vuetify';
import router from './plugins/router';
import store from './plugins/vuex';
import './plugins/socketio';
import './plugins/markdown';
import './plugins/analytics';
import './middleware/auth';
import './filters';
import './registerServiceWorker';

Vue.config.productionTip = false;

import AsyncComputed from 'vue-async-computed';
import { getTitle } from '@/utils/misc';
import { showExitPrompt } from '@/services/exitPrompt';
Vue.use(AsyncComputed);

document.title = getTitle();

window.onbeforeunload = function() {
    if (showExitPrompt()) {
        return 'Do you really want to leave our brilliant application?';
    }
};

export default new Vue({
    vuetify,
    router,
    store,
    render: h => h(App),
}).$mount('#app');
