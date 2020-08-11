import Vue from 'vue'

import App from './App.vue'
import vuetify from './plugins/vuetify';
import router from './plugins/router';
import store from './plugins/vuex';
import './plugins/socketio';
import './middleware/auth'
import './filters'
import './registerServiceWorker'

Vue.config.productionTip = false

import AsyncComputed from 'vue-async-computed'
Vue.use(AsyncComputed);

navigator.mediaDevices.ondevicechange = async function(event) {
  console.log('update devices', event);
  await store.dispatch('refreshMediaDevices');
  store.commit('clearMediaDeviceError');
  store.commit('setVideoDeviceId', null);
  store.commit('setAudioDeviceId', null);

  const videoStream = await store.dispatch('getVideoStream');
  const audioStream = await store.dispatch('getAudioStream');

  if (store.getters.userControl) {
    console.log('main room')
    await this.userControl.publishTrack(videoStream?.getVideoTracks()[0]);
    await this.userControl.publishTrack(audioStream?.getAudioTracks()[0]);
    return;
  }

  const tracks = [];

  tracks.push(videoStream?.getVideoTracks()[0]);
  tracks.push(audioStream?.getAudioTracks()[0]);

  const activeTracks = tracks.filter(
      track => track !== undefined
  );

  if (activeTracks.length <= 0) {
    store.commit('setLocalStream', null);
    return;
  }

  const localstream = new MediaStream(activeTracks);
  store.commit('setLocalStream', localstream);
}

export default new Vue({
  vuetify,
  router,
  store,
  render: h => h(App)
}).$mount('#app')
