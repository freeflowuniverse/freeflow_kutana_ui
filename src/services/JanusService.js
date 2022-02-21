import { JanusBuilder } from '../januswrapper/JanusBuilder';
import { VideoRoomPlugin } from '../januswrapper/VideoRoomPlugin';
import store from '@/plugins/vuex';
import config from '../../public/config';

/**
 * @param {String} serverUrl
 * @param {String} opaqueId
 * @param {string} userName
 * @param {number} roomName
 * @param {MediaStream} initialStream
 *
 * @typedef {{startScreenShare: function:Promise,
 *           switchScreenShare: function:Promise,
 *           stopScreenShare: function:Promise,
 *           startCamera: function:Promise,
 *           publishTrack: function:Promise,
 *           stopVideoTrack: function,
 *           stopAudioTrack: function,
 *           hangUp: function}} UserControl
 *
 * @return {UserControl}
 */
export const initializeJanus = async (
    serverUrl,
    opaqueId,
    userName,
    roomName,
    initialStream
) => {
    const janusBuilder = new JanusBuilder(serverUrl, false);
    const videoRoomPlugin = new VideoRoomPlugin(
        opaqueId,
        config.limitBitrateCap
    );
    let initialJoin = true;

    videoRoomPlugin.addEventListener('pluginAttached', async room => {
        const roomCreationResult = await videoRoomPlugin.createRoom(roomName);
        await videoRoomPlugin.joinRoom(roomCreationResult.room, userName);
    });

    videoRoomPlugin.addEventListener('ownUserJoined', user => {
        // console.log('ownUserJoined');

        store.commit('setLocalStream', user?.stream);

        if (initialJoin) {
            // console.log('initialJoin');
            initialJoin = false;
            if (!initialStream) {
                // publish dummy tracks if there is no localStream
                user.stream.getTracks().forEach(async track => {
                    await videoRoomPlugin.publishTrack(track);
                });
                return;
            }
            initialStream.getTracks().forEach(async track => {
                await videoRoomPlugin.publishTrack(track);
            });
        }

        const videoTrack = user.stream.getVideoTracks()[0];
        if (
            videoTrack &&
            !(
                videoTrack instanceof CanvasCaptureMediaStreamTrack &&
                videoTrack.canvas.dataset.dummy
            )
        ) {
            user.cam = store.getters.videoActive;
            
            videoTrack.onended = async event => {
                const localUser = store.getters.localUser;
                localUser.cam = false;
                store.commit('setLocalUser', localUser);
            };
        }

        const audioTrack = user.stream.getAudioTracks()[0];
        //@todo: improve this by not using label
        if (
            audioTrack &&
            audioTrack.label !== 'MediaStreamAudioDestinationNode'
        ) {
            user.mic = store.getters.audioActive;
            audioTrack.onended = async event => {
                const localUser = store.getters.localUser;
                localUser.mic = false;
                store.commit('setLocalUser', localUser);
            };
        }

        store.commit('setLocalUser', user);
    });

    videoRoomPlugin.addEventListener('userJoined', user => {
        if (user === store.getters.localUser) {
            return;
        }

        const videoTrack = user?.stream?.getVideoTracks()[0];
        if (videoTrack && videoTrack.readyState === 'live') {
            user.cam = true;
        }

        store.commit('addRemoteStream', {
            userId: user.id,
            stream: user.stream,
        });

        delete user.stream;
        store.commit('addRemoteUser', user);
    });

    videoRoomPlugin.addEventListener('userLeft', user => {
        store.commit('deleteRemoteUser', user);
        store.commit('deleteRemoteStream', user.id);
    });

    videoRoomPlugin.addEventListener('cleanupUser', async user => {
        if (await store.dispatch('findUserById', user.id)) {
            store.commit('addRemoteStream', {
                userId: user.id,
                stream: user.stream,
            });

            delete user.stream;
            store.commit('addRemoteUser', user);

            return;
        }

        store.commit('deleteRemoteStream', user.id);
        store.commit('deleteRemoteUser', user);
    });

    // SCREENSHARE
    const screenShareRoomPlugin = new VideoRoomPlugin(
        opaqueId + '-screenshare',
        false,
        'screen'
    );

    screenShareRoomPlugin.addEventListener('pluginAttached', async room => {
        // this is a random constant string
        const roomPadding = 13516416;
        const roomCreationResult = await screenShareRoomPlugin.createRoom(
            roomName + roomPadding
        );
        await screenShareRoomPlugin.joinRoom(roomCreationResult.room, userName);
    });

    screenShareRoomPlugin.addEventListener('ownUserJoined', screenUser => {
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

    screenShareRoomPlugin.addEventListener('userJoined', screenUser => {
        if (screenUser === store.getters.localScreenUser) {
            return;
        }
        const videoTrack = screenUser.stream.getVideoTracks()[0];
        screenUser.stream.onended = () => {
            videoTrack.dispatchEvent(new Event('ended'));
            screenUser.stream.dispatchEvent(new Event('ended'));
            const newScreenUser = store.dispatch(
                'findScreenUserById',
                screenUser.id
            );
            newScreenUser.screen = false;
            store.commit('addRemoteScreenUser', newScreenUser);
        };

        if (videoTrack && videoTrack.readyState === 'live') {
            screenUser.screen = true;
        }
        store.commit('addRemoteScreenUser', screenUser);
    });

    screenShareRoomPlugin.addEventListener('userLeft', screenUser => {
        store.commit('deleteRemoteScreenUser', screenUser);
    });
    screenShareRoomPlugin.addEventListener('cleanupUser', async screenUser => {
        if (await store.dispatch('findScreenUserById', screenUser.id)) {
            store.commit('addRemoteScreenUser', screenUser);
            return;
        }
        store.commit('deleteRemoteScreenUser', screenUser);
    });

    const janus = await janusBuilder
        .addPlugin(videoRoomPlugin)
        .addPlugin(screenShareRoomPlugin)
        .build();

    // @todo: remove this, is used in muiltiple places tho
    window.janusshizzle = { screenShareRoomPlugin, videoRoomPlugin, janus };

    return {
        startScreenShare: async () => {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia();
                const videoTrack = stream.getVideoTracks()[0];
                await screenShareRoomPlugin.publishTrack(videoTrack);
                const localScreenUser = store.getters.localScreenUser;
                stream.oninactive = async () => {
                    if (store.getters.isChangingScreenShare) {
                        store.commit('setChangingScreenShare', false);
                        return;
                    }
                    await store.getters.userControl.stopScreenShare();
                };
                localScreenUser.screen = true;
                store.commit('setLocalScreenUser', localScreenUser);
                if (
                    store.getters.presentingModeActive &&
                    !store.getters.presenter
                ) {
                    store.dispatch('startPresenting');
                    return;
                }
                store.dispatch('startScreenSharing');
            } catch (error) {
                store.commit('setSnackbarMessage', {
                    text: error.message,
                    type: 'error',
                });
            }
        },
        switchScreenShare: async () => {
            store.commit('setChangingScreenShare', true);
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia();
                const videoTrack = stream.getVideoTracks()[0];
                await screenShareRoomPlugin.publishTrack(videoTrack);
                const localScreenUser = store.getters.localScreenUser;
                localScreenUser.screen = true;
                store.commit('setLocalScreenUser', localScreenUser);
            } catch (e) {
                store.commit('setChangingScreenShare', false);
            }
        },
        stopScreenShare: async () => {
            screenShareRoomPlugin?.myStream?.getTracks().forEach(t => {
                t.stop();
            });

            const localScreenUser = store.getters.localScreenUser;
            localScreenUser.screen = false;
            store.commit('setLocalScreenUser', localScreenUser);

            if (store.getters.presentingModeActive) {
                await store.dispatch('stopPresenting');
            }

            await store.dispatch('stopScreenSharing');
            screenShareRoomPlugin.pluginHandle.hangup();
        },
        startCamera: async () => {
            const stream = await store.dispatch('getVideoStream');
            // this.isVideoAuthorised = true
            await videoRoomPlugin.publishTrack(stream.getVideoTracks()[0]);
        },
        publishTrack: async (track, video, audio) => {
            await videoRoomPlugin.publishTrack(track, video, audio);
        },
        stopVideoTrack: () => {
            videoRoomPlugin.myStream.getVideoTracks()[0].stop();
            videoRoomPlugin.myStream
                .getVideoTracks()[0]
                .dispatchEvent(new Event('ended'));
        },
        stopAudioTrack: () => {
            videoRoomPlugin.myStream.getAudioTracks()[0].stop();
            videoRoomPlugin.myStream
                .getAudioTracks()[0]
                .dispatchEvent(new Event('ended'));
        },
        hangUp: () => {
            const presenter = store.getters.presenter;
            const localUser = store.getters.localUser;
            if (presenter && presenter.id === localUser.id) {
                store.dispatch('sendSignal', {
                    sender: presenter.username,
                    type: 'presenter_ended',
                    id: localUser.id,
                });
            }
            videoRoomPlugin?.myStream?.getTracks().forEach(t => {
                t.stop();
            });
            screenShareRoomPlugin?.myStream?.getTracks().forEach(t => {
                t.stop();
            });
            videoRoomPlugin.pluginHandle.hangup();
            screenShareRoomPlugin.pluginHandle.hangup();
        },
        /*
        videoRoomPlugin.pluginHandle.send({
                    message: {
                "request" : "listparticipants",
                "room" : videoRoomPlugin.myroom
            },
                    success: (e) => {console.log(e)},
                })
         */
    };
};
