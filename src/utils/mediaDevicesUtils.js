import store from '@/plugins/vuex';

navigator.mediaDevices.ondevicechange = async function() {
    refreshMediaDevices();

    const videoStream = await store.dispatch('getVideoStream');
    const audioStream = await store.dispatch('getAudioStream');
    const userControl = store.getters.userControl;

    if (userControl) {
        await republishVideo(userControl, videoStream);
        await republishAudio(userControl, audioStream);
        return;
    }

    const localStream = getLocalStream(videoStream, audioStream);
    store.commit('setLocalStream', localStream);
}

function getLocalStream(videoStream, audioStream) {
    const tracks = [];

    tracks.push(videoStream?.getVideoTracks()[0]);
    tracks.push(audioStream?.getAudioTracks()[0]);

    const activeTracks = tracks.filter(
        track => track
    );

    if (activeTracks.length <= 0) {
        return null;
    }

    return new MediaStream(activeTracks);
}

async function republishVideo(userControl, videoStream) {
    const user = store.getters.localUser;

    if (videoStream && user.cam) {
        await userControl.publishTrack(videoStream.getVideoTracks()[0]);
        return;
    }

    user.cam = false;
    store.commit('setLocalUser', user);
}

async function republishAudio(userControl, audioStream) {
    const user = store.getters.localUser;

    if (audioStream && user.mic) {
        await userControl.publishTrack(audioStream?.getAudioTracks()[0]);
        return;
    }

    user.mic = false;
    store.commit('setLocalUser', user);
}

function refreshMediaDevices() {
    store.dispatch('refreshMediaDevices');
    store.commit('clearMediaDeviceError');
    store.commit('setVideoDeviceId', null);
    store.commit('setAudioDeviceId', null);
}