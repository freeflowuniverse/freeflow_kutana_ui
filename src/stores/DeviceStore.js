import { janusHelpers } from "../services/Janusservice";

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
          console.log(`sup`);
          console.log(error);
          commit("setPermissionError");
        });
    },
    async initialiseDevices(
      { commit, dispatch },
      { audio, video, audioDevice, videoDevice },
    ) {
      let erroring = true;
      let videoTested = false;
      let audioTested = false;
      while (erroring) {
        try {
          let stream;
          console.log(`Trying with`, { audio, video });
          if (audio || video) {
            const hasSpecificAudio = !!audioDevice && audio;
            const hasSpecificVideo = !!videoDevice && video;
            stream = await navigator.mediaDevices.getUserMedia({
              audio: hasSpecificAudio
                ? { deviceId: { exact: audioDevice } }
                : audio,
              video: hasSpecificVideo
                ? { deviceId: { exact: videoDevice } }
                : video,
            });
            stream.audioConstraints = { deviceId: { exact: audioDevice } };
            stream.videoConstraints = { deviceId: { exact: videoDevice } };
          } else {
            const mediaStream = new MediaStream();

            let ctx = new AudioContext(),
              oscillator = ctx.createOscillator();
            let dst = oscillator.connect(ctx.createMediaStreamDestination());

            oscillator.start();
            let emptyAudio = Object.assign(dst.stream.getAudioTracks()[0], {
              enabled: false,
            });
            emptyAudio.stop();
            emptyAudio.dispatchEvent(new Event("ended"));
            mediaStream.addTrack(emptyAudio);

            let width = 640;
            let height = 480;

            const target = document.createElement("canvas");
            target.dataset.dummy = true;
            let canvas = Object.assign(target, {
              width,
              height,
            });
            canvas.getContext("2d").fillRect(0, 0, width, height);

            let dummyStream = canvas.captureStream();
            let emptyVideo = Object.assign(dummyStream.getVideoTracks()[0], {
              enabled: false,
            });
            emptyVideo.stop();
            emptyVideo.dispatchEvent(new Event("ended"));
            mediaStream.addTrack(emptyVideo);
            stream = mediaStream;
          }

          commit("setVideoPublished", video);
          commit("setMicEnabled", audio);
          dispatch("refreshDevices");
          commit("refreshActiveDevices", stream.getTracks());
          commit("setStream", stream);
          console.log("STREAM!!!", stream);
          erroring = false;
        } catch (error) {
          console.error(error);
          if (!audioTested && !videoTested) {
            audio = true;
            video = false;
            audioTested = true;
            console.log(`Testing again with only audio`);
          } else if (audioTested && !videoTested) {
            audio = false;
            video = true;
            videoTested = true;
            console.log(`Testing again with only video`);
          } else if (audioTested && videoTested) {
            audio = false;
            video = false;
            console.log(`Testing again with none`);
          }
          // if(!audioTested) {}
          // if (audio && video && !audioTested) {
          // } else if (audio && !video) {
          //   console.log(`audio`);
          //
          // } else if (!audio && video && !videoTested) {
          //   console.log(`video`);
          //   commit("removeStream");
          //   audio = true;
          //   video = false;
          //   audioTested = true
          //   console.log(`Testing again with only audio`)
          // } else if (!audio && !video){
          //   console.log(`both`);
          //
          // }
        }
      }
      console.log(`-----`);
      console.log(`Saving`, { audio, video });
      console.log(`-----`);
    },
    setAudioOutputDevice({ commit }, audioOutputDevice) {
      const userStreams = document.getElementsByTagName("video");
      userStreams.forEach((stream) => {
        stream.setSinkId(audioOutputDevice);
      });
      commit("setAudioOutputDevice", audioOutputDevice);
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
    isBackgroundRemovalPossible: () =>
      /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor),
  },
};
