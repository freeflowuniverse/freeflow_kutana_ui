import store from '@/plugins/vuex';
import { stopIndicesWithElidedDims } from '@tensorflow/tfjs-core/dist/ops/slice_util';

navigator.mediaDevices.ondevicechange = async function() {
    refreshMediaDevices();
    await updateCurrentStream();
}

async function updateCurrentStream() {
    const userControl = store.getters.userControl;

    if (userControl) {
        console.log("updating publish stream")
        await republishVideo();
        await republishAudio();
        return;
    }

    console.log("updating local stream")
    const localStream = await getLocalStream();
    store.commit('setLocalStream', localStream);
}

async function getLocalStream() {
    const tracks = [];

    const updatedAudioStream = await updateAudioStream();
    const updatedVideoStream = await updateVideoStream();

    tracks.push(updatedAudioStream);
    tracks.push(updatedVideoStream);

    const activeTracks = tracks.filter(
        track => track && track.readyState === 'live'
    );

    if (activeTracks.length <= 0) {
        return null;
    }

    return new MediaStream(activeTracks);
}

async function republishVideo() {
    const userControl = store.getters.userControl;

    console.log("republishing video")
    if (!store.getters.videoActive && store.getters.localUser.stream.getVideoTracks().length > 0) {
        userControl.stopVideoTrack();
        return;
    }

    if (!store.getters.videoActive) {
        await republishAudio();
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
}

async function republishAudio() {
    const userControl = store.getters.userControl;

    console.log("republishing audio")
    if (!store.getters.audioActive && store.getters.localUser.stream.getAudioTracks().length > 0) {
        userControl.stopAudioTrack();
        return;
    }

    if (!store.getters.audioActive) {
        return;
    }

    const audioStream = await store.dispatch('getAudioStream')

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
}

function disableAudioStream() {
    store.getters.localStream?.getAudioTracks().forEach(audioTrack => {
        audioTrack.stop();
    });
}

function disableVideoStream() {
    store.getters.localStream?.getVideoTracks().forEach(videoTrack => {
        videoTrack.stop();
    });
}

//@TODO when stream is initialised it will always return the same stream over and over again
async function updateAudioStream() {
    if (!store.getters.audioActive) {
        disableAudioStream();
        return undefined;
    }
    if (!store.getters.localStream || store.getters.localStream?.getAudioTracks().length <= 0) {
        const audioStream = await store.dispatch(
            'getAudioStream'
        );
        return audioStream?.getAudioTracks()[0];
    }
    return store.getters.localStream.getAudioTracks()[0];
}

async function updateVideoStream() {
    if (!store.getters.videoActive) {
        disableVideoStream();
        return undefined;
    }
    if (!store.getters.localStream || store.getters.localStream?.getVideoTracks().length <= 0
        || store.getters.localStream.getVideoTracks()[0].readyState === 'ended') {
        const videoStream = await store.dispatch(
            'getVideoStream'
        );
        return videoStream?.getVideoTracks()[0];
    }
    return store.getters.localStream.getVideoTracks()[0];
}

function refreshMediaDevices() {
    store.dispatch('refreshMediaDevices');
    store.commit('clearMediaDeviceError');
    store.commit('setAudioDeviceId', null);
    store.commit('setVideoDeviceId', null);
}

export {
    updateCurrentStream,
    republishAudio,
    republishVideo,
    disableAudioStream,
    disableVideoStream
}