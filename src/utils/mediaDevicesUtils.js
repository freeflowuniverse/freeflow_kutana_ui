import store from '@/plugins/vuex';

export const initMediaDeviceDetection = () => {
    navigator.mediaDevices.ondevicechange = async function() {
        refreshMediaDevices();
        await updateCurrentStream();
    };
};

export const updateCurrentStream = async () => {
    const userControl = store.getters.userControl;

    if (userControl) {
        console.log('updating published stream');
        await updateVideoStream();
        await updateAudioStream();
        return;
    }

    console.log('updating local stream');
    const localStream = await getLocalStream();
    store.commit('setLocalStream', localStream);
};

const getLocalStream = async () => {
    const tracks = [];

    const updatedAudioStream = await updateLocalAudioStream();
    const updatedVideoStream = await updateLocalVideoStream();

    tracks.push(updatedAudioStream);
    tracks.push(updatedVideoStream);

    const activeTracks = tracks.filter(
        track => track && track.readyState === 'live'
    );

    if (activeTracks.length <= 0) {
        return generateDummyMediaStream();
    }

    return new MediaStream(activeTracks);
};

const updateVideoStream = async () => {
    const userControl = store.getters.userControl;

    console.log('updating video stream');
    if (
        !store.getters.videoActive &&
        store.getters.localUser.stream.getVideoTracks().length > 0
    ) {
        userControl.stopVideoTrack();
        return;
    }

    if (!store.getters.videoActive) {
        await updateAudioStream();
        return;
    }

    const videoStream = await store.dispatch('getVideoStream');
    if (!videoStream) {
        store.commit('setVideoDeviceId', null);
        store.commit('setVideoState', false);
        return;
    }
    await userControl.publishTrack(
        videoStream?.getVideoTracks()[0],
        store.getters.videoActive,
        store.getters.audioActive
    );
};

const updateAudioStream = async () => {
    const userControl = store.getters.userControl;

    console.log('updating audio stream');
    if (
        !store.getters.audioActive &&
        store.getters.localUser.stream.getAudioTracks().length > 0
    ) {
        userControl.stopAudioTrack();
        return;
    }

    if (!store.getters.audioActive) {
        return;
    }

    const audioStream = await store.dispatch('getAudioStream');

    if (!audioStream) {
        store.commit('setAudioDeviceId', null);
        store.commit('setAudioState', false);
        return;
    }

    await userControl.publishTrack(
        audioStream?.getAudioTracks()[0],
        store.getters.videoActive,
        store.getters.audioActive
    );
};

export const disableAudioStream = () => {
    store.getters.localStream?.getAudioTracks().forEach(audioTrack => {
        audioTrack.stop();
    });
};

export const disableVideoStream = () => {
    store.getters.localStream?.getVideoTracks().forEach(videoTrack => {
        videoTrack.stop();
    });
};

const updateLocalAudioStream = async () => {
    if (!store.getters.audioActive) {
        disableAudioStream();
        return;
    }
    if (
        !store.getters.localStream ||
        store.getters.localStream?.getAudioTracks().length <= 0 ||
        store.getters.localStream?.getAudioTracks()[0].readyState === 'ended'
    ) {
        const audioStream = await store.dispatch('getAudioStream');
        return audioStream?.getAudioTracks()[0];
    }
    return store.getters.localStream.getAudioTracks()[0];
};

const updateLocalVideoStream = async () => {
    if (!store.getters.videoActive) {
        disableVideoStream();
        return;
    }
    if (
        !store.getters.localStream ||
        store.getters.localStream?.getVideoTracks().length <= 0 ||
        store.getters.localStream?.getVideoTracks()[0].readyState === 'ended'
    ) {
        const videoStream = await store.dispatch('getVideoStream');
        return videoStream?.getVideoTracks()[0];
    }
    return store.getters.localStream.getVideoTracks()[0];
};

const refreshMediaDevices = () => {
    store.dispatch('refreshMediaDevices');
    store.commit('clearMediaDeviceError');
    store.commit('setAudioDeviceId', null);
    store.commit('setVideoDeviceId', null);
};
/** @type {AudioContext} */
let dummyStreamAudioContext;
export const generateDummyMediaStream = (
    video = true,
    audio = true,
    width = 640,
    height = 480
) => {
    const mediaStream = new MediaStream();

    if (video) {
        const target = document.createElement('canvas');
        target.dataset.dummy = true;
        let canvas = Object.assign(target, {
            width,
            height,
        });
        canvas.getContext('2d').fillRect(0, 0, width, height);

        let stream = canvas.captureStream();
        let emptyVideo = Object.assign(stream.getVideoTracks()[0], {
            enabled: false,
        });
        emptyVideo.stop();
        emptyVideo.dispatchEvent(new Event('ended'));
        mediaStream.addTrack(emptyVideo);
    }

    if (audio) {
        if (!dummyStreamAudioContext) {
            console.log('generating new AudioContext');
            dummyStreamAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        let oscillator = dummyStreamAudioContext.createOscillator();
        let dst = oscillator.connect(dummyStreamAudioContext.createMediaStreamDestination());

        oscillator.start();
        let emptyAudio = Object.assign(dst.stream.getAudioTracks()[0], {
            enabled: false,
        });
        emptyAudio.stop();
        emptyAudio.dispatchEvent(new Event('ended'));
        mediaStream.addTrack(emptyAudio);
    }

    return mediaStream;
};
