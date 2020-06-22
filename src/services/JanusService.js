import { JanusBuilder } from '../januswrapper/JanusBuilder';
import { VideoRoomPlugin } from '../januswrapper/VideoRoomPlugin';
import store from '../plugins/vuex';

export const initializeJanus = async (serverUrl, opaqueId, userName, roomName, stream) => {
    const janusBuilder = new JanusBuilder(serverUrl, true);
    const videoRoomPlugin = new VideoRoomPlugin(opaqueId);
    let initialJoin = true;

    videoRoomPlugin.addEventListener('pluginAttached', async (room) => {
        const roomCreationResult = await videoRoomPlugin.createRoom(roomName);
        await videoRoomPlugin.joinRoom(roomCreationResult.room, userName);
    });

    const isVideoAuthorised = false;

    videoRoomPlugin.addEventListener('ownUserJoined', (user) => {
        if (initialJoin) {
            initialJoin = false;
            stream.getTracks().forEach(async (track) => {
                await videoRoomPlugin.publishTrack(track);
            });
        }

        store.commit('setLocalUser', user);

        user.stream.getVideoTracks()[0].onended = async (event) => {
            debugger
            if (!isVideoAuthorised) {
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            await videoRoomPlugin.publishTrack(stream.getTracks()[0]);

        };
    });

    videoRoomPlugin.addEventListener('userJoined', (user) => {
        if (user === store.getters.localUser) {
            return;
        }
        user.stream.getVideoTracks().forEach((track) => {
            track.onended = async (event) => {
                debugger
            };
        });
        store.commit('addRemoteUser', user);
    });

    videoRoomPlugin.addEventListener('userLeft', (user) => {
        store.commit('deleteRemoteUser', user);
    });

    // SCREENSHARE
    const screenShareRoomPlugin = new VideoRoomPlugin(opaqueId + '-screenshare');

    screenShareRoomPlugin.addEventListener('pluginAttached', async (room) => {
        const roomPadding = 13516416;
        const roomCreationResult = await screenShareRoomPlugin.createRoom(roomName + roomPadding);
        await screenShareRoomPlugin.joinRoom(roomCreationResult.room, userName);
    });

    screenShareRoomPlugin.addEventListener('ownUserJoined', (screenUser) => {
        store.commit('setLocalScreenUser', screenUser);
    });

    screenShareRoomPlugin.addEventListener('userJoined', (screenUser) => {
        if (screenUser === store.getters.localScreenUser) {
            return;
        }
        store.commit('addRemoteScreenUser', screenUser);
    });

    screenShareRoomPlugin.addEventListener('userLeft', (screenUser) => {
        store.commit('deleteRemoteScreenUser', screenUser);
    });

    const janus = await janusBuilder
        .addPlugin(screenShareRoomPlugin)
        .addPlugin(videoRoomPlugin)
        .build();

    window.janusshizzle = { screenShareRoomPlugin, videoRoomPlugin };

    return {
        startScreenShare: async () => {
            const stream = await navigator.mediaDevices.getDisplayMedia();
            await screenShareRoomPlugin.publishTrack(stream.getVideoTracks()[0]);
        },
        startCamera: async () => {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            // this.isVideoAuthorised = true
            await videoRoomPlugin.publishTrack(stream.getVideoTracks()[0]);
        },
        publishTrack: async (track) => {
            await videoRoomPlugin.publishTrack(track);
        },
        stopVideoTrack: () => {
            videoRoomPlugin.myStream.getVideoTracks()[0].stop();
        },
        stopAudioTrack: () => {
            videoRoomPlugin.myStream.getAudioTracks()[0].stop();

        },
    };
};
