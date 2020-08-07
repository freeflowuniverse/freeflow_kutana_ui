import Vue from 'vue';
import { getBoolFromStorage } from '@/utils';

export default {
  state: {
    inputSelection: null, //for which room did you do input selection
    stream: undefined,
    videoPublished: false,
    micEnabled: false,
    wallpaperEnabled: false,
    audioDeviceId: null,
    videoDeviceId: null,
    inputDevices: [],
    inputDeviceErrors: {},
  },
  mutations: {
    setInputSelection(state, room) {
      state.inputSelection = room;
    },
    setStream(state, stream) {
      state.stream = stream;
    },
    removeStream(state) {
      state.stream = undefined;
    },
    stopTracks(state) {
      state.stream.getTracks().forEach((track) => {
        track.stop();
      });
    },
    setVideoPublished(state, enabled) {
      localStorage.setItem("videoPublished", enabled);
      state.videoPublished = enabled;
    },
    setMicEnabled(state, enabled) {
      localStorage.setItem("micEnabled", enabled);
      state.micEnabled = enabled;
    },
    setWallPaperEnabled(state, enabled) {
      localStorage.setItem("wallpaperEnabled", enabled);
      state.wallpaperEnabled = enabled;
    },
    setAudioDeviceId(state, audioDeviceId) {
      state.audioDeviceId = audioDeviceId;
    },
    setVideoDeviceId(state, videoDeviceId) {
      state.videoDeviceId = videoDeviceId;
    },
    refreshInputDevices(state, devices) {
      state.inputDevices = devices;
    },
    setInputDeviceError(state, error) {
      Vue.set(state.inputDeviceErrors, error.type, error.message)
    }
  },
  actions: {
    async refreshLocalStorageItems({ commit }) {
      const videoPublished = getBoolFromStorage('videoPublished');
      const micEnabled = getBoolFromStorage('micEnabled');
      const wallpaperEnabled = getBoolFromStorage( 'wallpaperEnabled');
      commit('setVideoPublished', videoPublished);
      commit('setMicEnabled', micEnabled);
      commit('setWallPaperEnabled', wallpaperEnabled);
    },
    async refreshInputDevices({ commit }) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        commit('refreshInputDevices', devices);
      } catch (e) {
        commit('setInputDeviceError', e);
      }
    },
    async getVideoStream({ commit, getters, dispatch }, deviceId = null) {
      if ((deviceId || getters.videoDeviceId) || (!deviceId && getters.videoDeviceId)) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: deviceId ? deviceId : getters.videoDeviceId,
          },
        });
        commit('setVideoDeviceId', deviceId ? deviceId : getters.videoDeviceId);
        return stream;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        const newDeviceId = await dispatch('findDeviceId', {
          kind: 'videoinput',
          label: stream.getVideoTracks()[0].label,
        });

        commit('setVideoDeviceId', newDeviceId);
        dispatch('refreshInputDevices');
        return stream;
      } catch (e) {
        commit('setInputDeviceError', { type: 'video', message: e.message});
      }
    },
    async getAudioStream({ commit, getters, dispatch }, deviceId = null) {
      if ((deviceId || getters.audioDeviceId) || (!deviceId && getters.audioDeviceId)) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: deviceId ? deviceId : getters.audioDeviceId,
          },
        });
        commit('setAudioDeviceId', deviceId ? deviceId : getters.audioDeviceId);
        return stream;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const newDeviceId = await dispatch('findDeviceId', {
          kind: 'audioinput',
          label: stream.getAudioTracks()[0].label,
        });

        commit('setAudioDeviceId', newDeviceId);
        dispatch('refreshInputDevices');

        return stream;
      } catch (e) {
        commit('setInputDeviceError', { type: 'audio', message: e.message});
      }
    },
    async findDeviceId(_, { kind, label }) {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const kindDevices = devices.filter(d => d.kind === kind);
      return kindDevices.find(d => d.label === label)?.deviceId;
    },
    setInputSelection(context, room) {
      context.commit("setInputSelection", room);
    },
    clearDeviceSelection(context) {
      context.commit("setMicEnabled", false);
      context.commit("setVideoPublished", false);
      context.commit("setWallPaperEnabled", false);
      context.commit("activeAudioDevice", null);
      context.commit("activeVideoDevice", null);
    },
    setVideoPublished({ commit }, enabled) {
      console.log("setVideoPublished", enabled);
      commit("setVideoPublished", enabled);
    },
    setMicEnabled({ commit }, enabled) {
      console.log("setMicEnabled", enabled);
      commit("setMicEnabled", enabled);
    },
    setWallPaperEnabled({ commit }, enabled) {
      commit("setWallPaperEnabled", enabled);
    },
  },
  getters: {
    videoPublished: (state) => state.videoPublished,
    micEnabled: (state) => state.micEnabled,
    wallpaperEnabled: (state) => state.wallpaperEnabled,
    inputSelection: (state) => state.inputSelection,
    isBackgroundRemovalPossible: () =>
      /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor),

    localStream: (state) => state.stream,
    videoDeviceId: state => state.videoDeviceId,
    audioDeviceId: state => state.audioDeviceId,
    inputDevices: state => state.inputDevices,
    inputDeviceErrors: state => state.inputDeviceErrors
  },
};
