export default {
  state: {
    inputSelection: null, //for which room did you do input selection
    stream: undefined,
    activeAudioDevice: window.localStorage.getItem("activeAudioDevice")
      ? JSON.parse(window.localStorage.getItem("activeAudioDevice"))
      : null,
    activeAudioOutputDevice: undefined,
    activeVideoDevice: window.localStorage.getItem("activeVideoDevice")
      ? JSON.parse(window.localStorage.getItem("activeVideoDevice"))
      : null,
    videoInputDevices: [],
    audioInputDevices: [],
    audioOutputDevices: [],
    permissionError: false,
    videoPublished: window.localStorage.getItem("videoPublished")
      ? JSON.parse(window.localStorage.getItem("videoPublished"))
      : false,
    micEnabled: window.localStorage.getItem("micEnabled")
      ? JSON.parse(window.localStorage.getItem("micEnabled"))
      : false,
    wallpaperEnabled: window.localStorage.getItem("wallpaperEnabled")
      ? JSON.parse(window.localStorage.getItem("wallpaperEnabled"))
      : false,
  },
  mutations: {
    setInputSelection(state, room) {
      state.inputSelection = room;
    },
    refreshDevices(state, devices) {
      state.videoInputDevices = devices.filter(
        (d) => d.kind === "videoinput" && d.label,
      );
      state.audioInputDevices = devices.filter(
        (d) => d.kind === "audioinput" && d.label,
      );
      state.audioOutputDevices = devices.filter(
        (d) => d.kind === "audiooutput" && d.label,
      );
    },
    refreshActiveDevices(state, tracks) {
      tracks.forEach((track) => {
        const deviceId = track.getSettings().deviceId;
        state.videoInputDevices.forEach((videoDevice) => {
          if (videoDevice && videoDevice.deviceId === deviceId) {
            state.activeVideoDevice = videoDevice;
          }
        });
        state.audioInputDevices.forEach((audioDevice) => {
          if (audioDevice && audioDevice.deviceId === deviceId) {
            state.activeAudioDevice = audioDevice;
          }
        });
        state.audioOutputDevices.forEach((audioOutputDevice) => {
          if (audioOutputDevice && audioOutputDevice.deviceId === deviceId) {
            state.activeAudioOutputDevice = audioOutputDevice;
          }
        });
      });
    },
    setAudioDevice(state, audioDevice) {
      state.activeAudioDevice = state.audioInputDevices.filter(
        (d) => d.deviceId === audioDevice,
      )[0];
      window.localStorage.setItem(
        "activeAudioDevice",
        JSON.stringify(state.activeAudioDevice),
      );
    },
    setVideoDevice(state, videoDevice) {
      state.activeVideoDevice = state.videoInputDevices.filter(
        (d) => d.deviceId === videoDevice,
      )[0];
      window.localStorage.setItem(
        "activeVideoDevice",
        JSON.stringify(state.activeVideoDevice),
      );
    },
    setAudioOutputDevice(state, audioOutputDevice) {
      state.activeAudioOutputDevice = state.audioOutputDevices.filter(
        (d) => d.deviceId === audioOutputDevice,
      )[0];
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
    setPermissionError(state) {
      state.permissionError = true;
    },
    setVideoPublished(state, enabled) {
      window.localStorage.setItem("videoPublished", enabled);
      state.videoPublished = enabled;
    },
    setMicEnabled(state, enabled) {
      window.localStorage.setItem("micEnabled", enabled);
      state.micEnabled = enabled;
    },
    setWallPaperEnabled(state, enabled) {
      window.localStorage.setItem("wallpaperEnabled", enabled);
      state.wallpaperEnabled = enabled;
    },
  },
  actions: {
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
    refreshDevices({ commit }) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        commit("refreshDevices", devices);
      });
    },
    refreshActiveDevices({ commit }, [audio, video]) {
      console.log({
        audio,
        video,
      });
      navigator.mediaDevices
        .getUserMedia({ audio: audio, video: video })
        .then((stream) => {
          stream.getAudioTracks().forEach((audioTrack) => {
            audioTrack.stop();
          });
          commit("refreshActiveDevices", stream.getTracks());
        })
        .catch((error) => {
          console.log(error);
          commit("setPermissionError");
        });
    },
    async initialiseDevices(
      { commit, dispatch },
      { audio, video, audioDevice, videoDevice },
    ) {
      const hasSpecificAudio = audioDevice;
      const hasSpecificVideo = videoDevice;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: hasSpecificAudio
            ? { deviceId: { exact: audioDevice } }
            : audio,
          video: hasSpecificVideo
            ? { deviceId: { exact: videoDevice } }
            : video,
        });
        stream.audioConstraints = { deviceId: { exact: audioDevice } };
        stream.videoConstraints = { deviceId: { exact: videoDevice } };

        commit("setVideoPublished", video);
        commit("setMicEnabled", audio);
        dispatch("refreshDevices");
        commit("refreshActiveDevices", stream.getTracks());
        commit("setStream", stream);
        console.log("STREAM!!!", stream);
      } catch (error) {
        console.log(error);
        commit("setPermissionError");
        commit("removeStream");
      }
    },
    setAudioOutputDevice({ commit }, audioOutputDevice) {
      const userStreams = document.getElementsByTagName("video");
      userStreams.forEach((stream) => {
        stream.setSinkId(audioOutputDevice);
      });
      commit("setAudioOutputDevice", audioOutputDevice);
    },
    setVideoPublished({ commit }, enabled) {
      commit("setVideoPublished", enabled);
    },
    setMicEnabled({ commit }, enabled) {
      commit("setMicEnabled", enabled);
    },
    setWallPaperEnabled({ commit }, enabled) {
      commit("setWallPaperEnabled", enabled);
    },
  },
  getters: {
    videoInputDevices: (state) => state.videoInputDevices,
    audioInputDevices: (state) => state.audioInputDevices,
    audioOutputDevices: (state) => state.audioOutputDevices,
    activeAudioDevice: (state) =>
      state.activeAudioDevice || state.audioInputDevices[0],
    activeVideoDevice: (state) =>
      state.activeVideoDevice || state.videoInputDevices[0],
    activeAudioOutputDevice: (state) =>
      state.activeAudioOutputDevice || state.audioOutputDevices[0],
    localStream: (state) => state.stream,
    permissionError: (state) => state.permissionError,
    videoPublished: (state) => state.videoPublished,
    micEnabled: (state) => state.micEnabled,
    wallpaperEnabled: (state) => state.wallpaperEnabled,
    inputSelection: (state) => state.inputSelection,
    isBackgroundRemovalPossible: () => /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
  },
};
