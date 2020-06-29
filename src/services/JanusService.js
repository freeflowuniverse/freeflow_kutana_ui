import { JanusBuilder } from '../januswrapper/JanusBuilder';
import { VideoRoomPlugin } from '../januswrapper/VideoRoomPlugin';
import store from '../plugins/vuex';

export const initializeJanus = async (serverUrl, opaqueId, userName, roomName, stream) => {
    const janusBuilder = new JanusBuilder(serverUrl, false);
    const videoRoomPlugin = new VideoRoomPlugin(opaqueId, true);
    let initialJoin = true;

    videoRoomPlugin.addEventListener('pluginAttached', async (room) => {
        const roomCreationResult = await videoRoomPlugin.createRoom(roomName);
        await videoRoomPlugin.joinRoom(roomCreationResult.room, userName);
    });

    const isVideoAuthorised = false;

    videoRoomPlugin.addEventListener('ownUserJoined', (user) => {
        console.log('ownUserJoined');

        if (initialJoin) {
            initialJoin = false;
            stream.getTracks().forEach(async (track) => {
                await videoRoomPlugin.publishTrack(track);
            });
        }

        const videoTrack = user.stream.getVideoTracks()[0];
        if (videoTrack) {
            user.cam = true;
            videoTrack.onended = async (event) => {
                const localUser = store.getters.localUser;
                localUser.cam = false;
                store.commit('setLocalUser', localUser);
            };
        }
        store.commit('setLocalUser', user);

    });

    videoRoomPlugin.addEventListener('userJoined', (user) => {
        console.log({ user });

        if (user === store.getters.localUser) {
            return;
        }
        user.stream.getVideoTracks().forEach((track) => {
            track.onended = async (event) => {
                console.log('ended');
                const newUser = store.dispatch('findUserById', user.id);
                newUser.cam = false;
                store.commit('addRemoteUser', newUser);
            };
        });
        const videoTrack = user?.stream?.getVideoTracks()[0];
        if (videoTrack && videoTrack.readyState === 'live') {
            user.cam = true;
        }
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
    const screenShareRoomPlugin = new VideoRoomPlugin(opaqueId + '-screenshare', false, 'screen');

    screenShareRoomPlugin.addEventListener('pluginAttached', async (room) => {
        const roomPadding = 13516416;
        const roomCreationResult = await screenShareRoomPlugin.createRoom(roomName + roomPadding);
        await screenShareRoomPlugin.joinRoom(roomCreationResult.room, userName);
    });

    screenShareRoomPlugin.addEventListener('ownUserJoined', (screenUser) => {
        const videoTrack = screenUser.stream.getVideoTracks()[0];

        screenUser.stream.onended = () => {
            videoTrack.dispatchEvent(new Event('ended'));
            screenUser.stream.dispatchEvent(new Event('ended'));

            const localScreenUser = store.getters.localScreenUser;
            localScreenUser.screen = false;
            store.commit('setLocalScreenUser', localScreenUser);
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
            screenUser.stream.dispatchEvent(new Event('ended'));
            const newScreenUser = store.dispatch('findScreenUserById', screenUser.id);
            newScreenUser.screen = false;
            store.commit('addRemoteScreenUser', newScreenUser);
        };

        if (videoTrack && videoTrack.readyState === 'live') {
            screenUser.screen = true;
        }
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
            stream.oninactive = () => {
                window.janusshizzle.screenShareRoomPlugin.pluginHandle.hangup();
                videoTrack.dispatchEvent(new Event('ended'));
                stream.dispatchEvent(new Event('ended'));
                const localScreenUser = store.getters.localScreenUser;
                localScreenUser.screen = false;
                store.commit('setLocalScreenUser', localScreenUser);
            };
            await screenShareRoomPlugin.publishTrack(videoTrack);
            const localScreenUser = store.getters.localScreenUser;
            localScreenUser.screen = true;
            store.commit('setLocalScreenUser', localScreenUser);
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
        hangUp: () => {

            videoRoomPlugin?.myStream?.getTracks().forEach(t => {
                t.stop();
            });
            screenShareRoomPlugin?.myStream?.getTracks().forEach(t => {
                t.stop();
            });
            videoRoomPlugin.pluginHandle.hangup();
            screenShareRoomPlugin.pluginHandle.hangup();
        },
    };
};
