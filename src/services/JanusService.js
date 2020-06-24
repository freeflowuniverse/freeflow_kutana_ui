import { JanusBuilder } from '../januswrapper/JanusBuilder';
import { VideoRoomPlugin } from '../januswrapper/VideoRoomPlugin';
import store from '../plugins/vuex';

export const initializeJanus = async (serverUrl, opaqueId, userName, roomName, stream) => {
    const janusBuilder = new JanusBuilder(serverUrl, false);
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

        const videoTrack = user.stream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.onended = async (event) => {
                console.log('ended local');
                if (!isVideoAuthorised) {
                    return;
                }

                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                await videoRoomPlugin.publishTrack(stream.getTracks()[0]);

            };
        }
    });

    videoRoomPlugin.addEventListener('userJoined', (user) => {
        console.log({ user });

        if (user === store.getters.localUser) {
            return;
        }
        user.stream.getVideoTracks().forEach((track) => {
            track.onended = async (event) => {
                console.log('ended');
            };
        });
        store.commit('addRemoteUser', user);
    });

    videoRoomPlugin.addEventListener('userLeft', (user) => {
        store.commit('deleteRemoteUser', user);
    });
    videoRoomPlugin.addEventListener('cleanupUser', (user) => {

        if (store.dispatch('findUserById', user.id)) {
            store.commit('addRemoteUser', user);
            return;
        }
        store.commit('deleteRemoteUser', user);
    });

    // SCREENSHARE
    const screenShareRoomPlugin = new VideoRoomPlugin(opaqueId + '-screenshare', 'screen');

    screenShareRoomPlugin.addEventListener('pluginAttached', async (room) => {
        const roomPadding = 13516416;
        const roomCreationResult = await screenShareRoomPlugin.createRoom(roomName + roomPadding);
        await screenShareRoomPlugin.joinRoom(roomCreationResult.room, userName);
    });

    screenShareRoomPlugin.addEventListener('ownUserJoined', (screenUser) => {
        const videoTrack = screenUser.stream.getVideoTracks()[0];
        screenUser.stream.onended = () => {
            videoTrack.dispatchEvent(new Event('ended'));
        };
        store.commit('setLocalScreenUser', screenUser);
    });

    screenShareRoomPlugin.addEventListener('userJoined', (screenUser) => {
        if (screenUser === store.getters.localScreenUser) {
            return;
        }
        const videoTrack = screenUser.stream.getVideoTracks()[0];
        screenUser.stream.onended = () => {
            videoTrack.dispatchEvent(new Event('ended'));
        };
        store.commit('addRemoteScreenUser', screenUser);
    });

    screenShareRoomPlugin.addEventListener('userLeft', (screenUser) => {
        store.commit('deleteRemoteScreenUser', screenUser);
    });
    screenShareRoomPlugin.addEventListener('cleanupUser', (screenUser) => {
        if (store.dispatch('findScreenUserById', screenUser.id)) {
            store.commit('addRemoteScreenUser', screenUser);
            return;
        }
        store.commit('deleteRemoteScreenUser', screenUser);
    });
    const janus = await janusBuilder
        .addPlugin(videoRoomPlugin)
        .addPlugin(screenShareRoomPlugin)
        .build();

    window.janusshizzle = { screenShareRoomPlugin, videoRoomPlugin };

    return {
        startScreenShare: async () => {
            const stream = await navigator.mediaDevices.getDisplayMedia();
            const videoTrack = stream.getVideoTracks()[0];
            stream.onended = () => {
                videoTrack.dispatchEvent(new Event('ended'));
            };
            await screenShareRoomPlugin.publishTrack(videoTrack);
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
            //@todo: move this
            videoRoomPlugin.myStream.getVideoTracks()[0].stop();
            videoRoomPlugin.myStream.getVideoTracks()[0].dispatchEvent(new Event('ended'));
            window.janusshizzle.videoRoomPlugin.pluginHandle.hangup();
            const audio = videoRoomPlugin.myStream.getAudioTracks()[0];
            if (audio && audio.readyState === 'live') {
                window.janusshizzle.videoRoomPlugin.pluginHandle.createOffer({
                    stream: new MediaStream([audio]),
                    success: jsep => {
                        const publish = { request: 'configure', audio: true, video: false };

                        window.janusshizzle.videoRoomPlugin.pluginHandle.send({
                            message: publish,
                            jsep: jsep,
                            success: () => {
                            },
                            error: () => {
                            },
                        });
                    },
                    error: error => {
                    },
                });
            }
        },
        stopAudioTrack: () => {
            videoRoomPlugin.myStream.getAudioTracks()[0].stop();
            videoRoomPlugin.myStream.getAudioTracks()[0].dispatchEvent(new Event('ended'));
        },
    };
};
