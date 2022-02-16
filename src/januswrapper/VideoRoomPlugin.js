import store from '@/plugins/vuex';
import { generateDummyMediaStream } from '@/utils/mediaDevicesUtils';

export class VideoRoomPlugin {
    constructor(opaqueId, bitrateCap = false, debugString = 'video') {
        this.bitrateCap = bitrateCap;
        this.debugString = debugString;
        this.pluginHandle = null;
        this.opaqueId = opaqueId;
        this.inThrottleForSelectedUser = null;
        this.inThrottleForSpeakerVolume = null;
        this.feeds = [];
        this.listeners = {
            error: [],
            localUserJoined: [],
            userJoined: [],
            userLeft: [],
            userUpdated: [],
            attach: [],
            roomAvailable: [],
            pluginAttached: [],
            ownUserJoined: [],
            attachSubscriberPlugin: [],
            cleanupUser: [],
        };
        this.myId = null;
        this.myPrivateId = null;
        this.myRoom = null;
        this.myUsername = null;
        this.myStream = null;
    }

    /*
      returns a attach object which is required for the januslib to initialize a januslib plugin
     */
    attach() {
        return {
            plugin: 'janus.plugin.videoroom',
            opaqueId: this.opaqueId,
            success: pluginHandle => {
                this.onAttachSucces(pluginHandle);
            },
            error: this.onError,
            onmessage: async (msg, jsep) => {
                await this.onMessage(msg, jsep);
            },
            onlocalstream: stream => {
                this.onLocalStream(stream);
            },
            onremotestream: stream => {},
        };
    }

    // @todo: change this
    determineSpeaker(stream, userId) {
        if (!window.audioContext) {
            let _AudioContext =
                window.AudioContext || window.webkitAudioContext;
            window.audioContext = new _AudioContext();
        }

        if (window.audioContext) {
            let analyser = window.audioContext.createAnalyser();
            let microphone;

            try {
                microphone = window.audioContext.createMediaStreamSource(
                    stream
                );
            } catch (e) {
                return;
            }

            let javascriptNode = window.audioContext.createScriptProcessor(
                2048,
                1,
                1
            );

            analyser.smoothingTimeConstant = 0.8;
            analyser.fftSize = 32;

            microphone.connect(analyser);
            analyser.connect(javascriptNode);
            javascriptNode.connect(window.audioContext.destination);
            javascriptNode.onaudioprocess = () => {
                const array = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(array);
                let values = 0;

                const length = array.length;
                for (let i = 0; i < length; i++) {
                    values += array[i];
                }

                const average = values / length;
                if (!this.inThrottleForSpeakerVolume) {
                    this.inThrottleForSpeakerVolume = true;
                    store.dispatch('setSpeakerVolume', {
                        id: userId,
                        volume: average,
                    });
                    setTimeout(
                        () => (this.inThrottleForSpeakerVolume = false),
                        500
                    );
                }
                if (
                    store.getters.viewStyle === 'presentation' &&
                    (!store.getters.selectedUser ||
                        (store.getters.selectedUser.id !== userId &&
                            !store.getters.selectedUser.pinned &&
                            average > 20))
                ) {
                    if (!this.inThrottleForSelectedUser) {
                        this.inThrottleForSelectedUser = true;
                        store.dispatch('selectUser', {
                            id: userId,
                            pinned: false,
                        });
                        setTimeout(
                            () => (this.inThrottleForSelectedUser = false),
                            1500
                        );
                    }
                }
            };
        }
    }

    /*
    @todo: move this to somewhere else maby utils, ... idk
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash += Math.pow(str.charCodeAt(i) * 31, str.length - i);
            hash = hash & hash;
        }
        return hash;
    }

    /*
      not used yest
      @todo: use or remove this
    */
    detachFeed(detachRfid) {
        this.feeds = this.feeds.reduce((carry, feed) => {
            if (feed.rfid !== detachRfid) {
                carry.push(feed);
                return carry;
            }
            feed.detach();
            return carry;
        }, []);
    }

    addEventListener(eventMessage, event) {
        this.listeners[eventMessage].push(event);
    }

    emitEvent(eventMessage, msg) {
        const events = this.listeners[eventMessage];

        if (!events) {
            return;
        }

        for (const event of events) {
            event(msg);
        }
    }

    onAttachSucces(pluginHandle) {
        this.pluginHandle = pluginHandle;
        this.emitEvent('pluginAttached', pluginHandle);
    }

    onError(error) {
        this.emitEvent('error', error);
    }

    async onMessage(msg, jsep) {
        // console.log({ msg, jsep });
        if (jsep) {
            this.pluginHandle.handleRemoteJsep({
                jsep: jsep,
                success: () => {},
            });
        }

        if (msg.videoroom === 'joined') {
            this.myPrivateId = msg.private_id;
            this.myId = msg.id;
            this.myRoom = msg.room;
            this.emitEvent(
                'ownUserJoined',
                this.buildUser(
                    generateDummyMediaStream(),
                    this.myId,
                    this.myUsername,
                    {
                        pluginHandle: this.pluginHandle,
                    }
                )
            );

            // @todo: remove this
            // console.log({ debugString: this.debugString, msg });
            if (msg.publishers) {
                msg.publishers.forEach(element => {
                    this.emitEvent(
                        'attachSubscriberPlugin',
                        this.attachSubscriber(
                            element['id'],
                            element['display'],
                            element['audio_codec'],
                            element['video_codec']
                        )
                    );
                    this.emitEvent(
                        'userJoined',
                        this.buildUser(
                            generateDummyMediaStream(),
                            element['id'],
                            element['display']
                        )
                    );
                });
            }
            if (msg.attendees) {
                msg.attendees.forEach(element => {
                    this.emitEvent(
                        'userJoined',
                        this.buildUser(
                            generateDummyMediaStream(),
                            element['id'],
                            element['display']
                        )
                    );
                });
            }
            return;
        }

        if (msg.videoroom === 'event') {
            if (msg.publishers) {
                msg.publishers.forEach(element => {
                    this.emitEvent(
                        'attachSubscriberPlugin',
                        this.attachSubscriber(
                            element['id'],
                            element['display'],
                            element['audio_codec'],
                            element['video_codec']
                        )
                    );
                });
            }
            if (msg.leaving) {
                this.emitEvent(
                    'userLeft',
                    this.buildUser(
                        generateDummyMediaStream(),
                        msg.leaving,
                        'left'
                    )
                );
            }
        }

        if (msg.joining) {
            this.emitEvent(
                'userJoined',
                this.buildUser(
                    generateDummyMediaStream(),
                    msg.joining.id,
                    msg.joining.display
                )
            );
        }
    }

    /*
      dummy feed
     */
    async publishOwnFeed(video, audio) {
        this.myStream = generateDummyMediaStream(video, audio);
        this.pluginHandle.createOffer({
            stream: this.myStream,
            success: jsep => {
                const publish = { request: 'configure', audio, video };

                this.pluginHandle.send({
                    message: publish,
                    jsep: jsep,
                    success: () => {},
                    error: () => {},
                });
            },
            error: error => {},
        });
    }

    async publishTrack(track, video = true, audio = true) {
        let peerConnection = this.pluginHandle.webrtcStuff.pc;
        if (!peerConnection) {
            await this.publishOwnFeed(video, audio);
            peerConnection = this.pluginHandle.webrtcStuff.pc;
        }

        let senders = peerConnection.getSenders();

        let rtcpSender = senders.find(
            sender => sender.track.kind === track.kind
        );

        if (!rtcpSender) {
            await this.publishOwnFeed(video, audio);
            peerConnection = this.pluginHandle.webrtcStuff.pc;

            senders = peerConnection.getSenders();

            rtcpSender = senders.find(
                sender => sender.track.kind === track.kind
            );
        }

        await rtcpSender.replaceTrack(track);

        const streamTrack = this.myStream
            .getTracks()
            .find(t => t.kind === track.kind);
        streamTrack.stop();
        streamTrack.dispatchEvent(new Event('ended'));

        const tracks = [
            track,
            this.myStream.getTracks().find(t => t.kind !== track.kind),
        ];
        this.myStream = new MediaStream(tracks.filter(t => t));
        this.emitEvent(
            'ownUserJoined',
            this.buildUser(this.myStream, this.myId, this.myUsername, {
                peerConnection,
                pluginHandle: this.pluginHandle,
            })
        );
    }

    onLocalStream(stream) {
        // console.error('onLocalStream');
        const peerConnection = this.pluginHandle.webrtcStuff.pc;

        const dataChannel = peerConnection.createDataChannel('signal');

        let syncInterval;
        // Opening Local DataChannel
        dataChannel.onopen = () => {
            // console.log('Local Datachannel is open!');
            if (this.syncInterval) {
                clearInterval(this.syncInterval);
            }

            let localUser;
            let localScreenUser;
            syncInterval = setInterval(() => {
                localUser = store.getters.localUser;
                localScreenUser = store.getters.localScreenUser;
                dataChannel.send(
                    JSON.stringify({
                        t: 's',
                        c: localUser?.cam || false,
                        m: localUser?.mic || false,
                        u: localUser?.uuid || false,
                        s: localScreenUser?.screen || false,
                        r: store?.getters?.recording || false,
                    })
                );
            }, 100);
        };
        // Closing Local DataChannel
        dataChannel.onclose = () => {
            if (syncInterval) {
                clearInterval(syncInterval);
            }
            // console.log('Local DataChannel is closed!');
        };
        // Receiving Local Datachannel messages
        dataChannel.ondatachannel = event => {
            // console.log('Local DataChannel Message', event.data);
            if (event.data.t === 's') {
                // console.log(event.data.u, event.data.c);
            }
        };

        store.commit('setDataChannel', dataChannel);

        this.emitEvent(
            'ownUserJoined',
            this.buildUser(stream, this.myId, this.myUsername)
        );
    }

    /** @typedef {{
     * cam: boolean,
     * mic:boolean,
     * extra: object,
     * id: number,
     * room: number,
     * screen: boolean,
     * username:String,
     * uuid:number,
     * stream:MediaStream,
     * }} User
     *
     * @typedef {{
     * id: number,
     * uuid:number
     * }} TinyUser
     *
     * @param {MediaStream} stream
     * @param {number} id
     * @param {String} username
     * @param {object} extra
     *
     * @return User
     * */
    buildUser(stream, id, username = this.myUsername, extra = {}) {
        return {
            id: id,
            uuid: username.slice(0, 36),
            username: username.slice(37),
            room: this.myRoom,
            cam: false,
            mic: false,
            stream: stream,
            screen: false,
            extra,
        };
    }

    async createRoom(roomName) {
        return new Promise((resolve, reject) => {
            this.pluginHandle.send({
                message: {
                    request: 'exists',
                    room: roomName,
                },
                success: result => {
                    console.log(result.exists);
                    if (result.exists) {
                        resolve(result);
                        return;
                    }

                    const message = {
                        request: 'create',
                        room: roomName,
                        permanent: false,
                        description: 'Super room!',
                        bitrate_cap: this.bitrateCap,
                        require_pvtid: true,
                        publishers: 16,
                        transport_wide_cc_ext: true,
                        fir_freq: 10,
                        is_private: true,
                        notify_joining: true,
                    };

                    if (this.bitrateCap) {
                        message.bitrate = 128000 * 2;
                    }
                    
                    if (window.location.host === "meetings.staging.jimber.io" || window.location.host === "jimber.meetings.org") {
                        message.bitrate = 400000;
                    }

                    this.pluginHandle.send({
                        message,
                        success: result => {
                            resolve(result);
                        },
                    });
                },
            });
        });
    }

    async joinRoom(roomName, username) {
        this.myUsername = username;
        return new Promise((resolve, reject) => {
            this.pluginHandle.send({
                message: {
                    request: 'join',
                    room: roomName,
                    ptype: 'publisher',
                    display: username,
                },
                success: () => {
                    resolve();
                },
            });
        });
    }

    attachSubscriber(id, display, audio, video) {
        let pluginHandle = {};

        let room = this.myRoom;

        return {
            plugin: 'janus.plugin.videoroom',
            opaqueId: this.opaqueId,
            success: succesHandle => {
                pluginHandle = succesHandle;
                pluginHandle.simulcastStarted = false;

                const subscribe = {
                    request: 'join',
                    room: room,
                    ptype: 'subscriber',
                    feed: id,
                    private_id: this.myPrivateId,
                };

                pluginHandle.videoCodec = video;
                pluginHandle.send({
                    message: subscribe,
                    success: () => {},
                });
            },
            error: error => {},
            onmessage: (msg, jsep) => {
                if (jsep !== undefined && jsep !== null) {
                    pluginHandle.createAnswer({
                        jsep: jsep,
                        stream: this.myStream,
                        success: jsep => {
                            const body = {
                                request: 'start',
                                room: room,
                            };

                            pluginHandle.send({
                                message: body,
                                jsep: jsep,
                                success: () => {},
                            });
                        },
                        error: error => {},
                    });
                }

                const event = msg['videoroom'];

                if (event) {
                    switch (event) {
                        case 'attached':
                            for (let i = 1; i < 16; i++) {
                                if (
                                    this.feeds[i] === undefined ||
                                    this.feeds[i] === null
                                ) {
                                    this.feeds[i] = pluginHandle;
                                    pluginHandle.rfindex = i;
                                    break;
                                }
                            }
                            pluginHandle.rfid = msg['id'];
                            pluginHandle.rfdisplay = msg['display'];
                            break;
                        case 'event':
                            if (msg['substream'] || msg['temporal']) {
                                if (!pluginHandle.simulcastStarted) {
                                    pluginHandle.simulcastStarted = true;
                                }
                            }
                            break;
                    }
                }
            },
            onremotestream: stream => {
                // console.log({ stream, pluginHandle });
                const peerConnection = pluginHandle.webrtcStuff.pc;

                peerConnection.ondatachannel = event => {
                    const channel = event.channel;
                    channel.onmessage = event => {
                        const data = JSON.parse(event.data);
                        if (data.t !== 's') {
                            return;
                        }
                        const remoteUserIndex = store.state.UserStore.remoteUsers.findIndex(
                            u => u.uuid === data.u
                        );

                        if (remoteUserIndex === -1) {
                            return;
                        }
                        store.state.UserStore.remoteUsers[remoteUserIndex].cam =
                            data.c;
                        store.state.UserStore.remoteUsers[remoteUserIndex].mic =
                            data.m;
                        store.state.UserStore.remoteUsers[
                            remoteUserIndex
                        ].recording = data.r;
                        const remoteScreenUserIndex = store.state.ScreenShareStore.remoteScreenUsers.findIndex(
                            u => u.uuid === data.u
                        );
                        store.state.ScreenShareStore.remoteScreenUsers[
                            remoteScreenUserIndex
                        ].mic = data.m;
                    };
                    channel.onopen = () => {
                        // console.log('Opening Remote Channel!');
                    };
                    channel.onclose = () => {
                        // console.log('Closing Remote Channel!');
                    };
                };
                this.determineSpeaker(stream, id);
                this.emitEvent(
                    'userJoined',
                    this.buildUser(
                        stream,
                        pluginHandle.rfid,
                        pluginHandle.rfdisplay
                    )
                );
            },
            oncleanup: () => {
                // console.log('[oncleanup]: ', pluginHandle.rfid);
                this.emitEvent(
                    'cleanupUser',
                    this.buildUser(
                        generateDummyMediaStream(),
                        pluginHandle.rfid,
                        pluginHandle.rfdisplay
                    )
                );
            },
        };
    }
}
