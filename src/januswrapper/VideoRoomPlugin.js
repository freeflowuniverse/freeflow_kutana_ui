import store from "../plugins/vuex";

export class VideoRoomPlugin {

    constructor(opaqueId) {
        this.pluginHandle = null;
        this.opaqueId = opaqueId;
        this.inThrottle = null
        this.feeds = [];
        this.listeners = {
            "error": [],
            "localUserJoined": [],
            "userJoined": [],
            "userLeft": [],
            "userUpdated": [],
            "attach": [],
            "roomAvailable": [],
            "pluginAttached": [],
            "ownUserJoined": [],
            "attachSubscriberPlugin": []
        };
        this.myId = null;
        this.myPrivateId = null;
        this.myRoom = null;
        this.myUsername = null;
        this.myStream = null;
    }

    attach() {
        return {
            plugin: "janus.plugin.videoroom",
            opaqueId: this.opaqueId,
            success: (pluginHandle) => {
                this.onAttachSucces(pluginHandle);
            },
            error: this.onError,
            onmessage: async (msg, jsep) => {
                await this.onMessage(msg, jsep)
            },
            onlocalstream: (stream) => {
                this.onLocalStream(stream)
            },
            onremotestream: (stream) => {
                console.log("ON REMOTE STREAM: ", stream)
            }
        }
    }

    determineSpeaker(stream, remoteFeed, id) {
        if (!window.audioContext) {
            console.log("Creating AudioContext ...")
            var _AudioContext = window.AudioContext || window.webkitAudioContext;
            window.audioContext = new _AudioContext();
        }

        if (window.audioContext) {
            let analyser = window.audioContext.createAnalyser();
            let microphone = window.audioContext.createMediaStreamSource(stream);
            let javascriptNode = window.audioContext.createScriptProcessor(2048, 1, 1);

            analyser.smoothingTimeConstant = 0.8;
            analyser.fftSize = 1024;

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
                if (
                    !store.getters.selectedUser ||
                    (store.getters.selectedUser && !store.getters.selectedUser.pinned && average > 20 && remoteFeed.rfdisplay !== store.getters.selectedUser.username)
                ) {
                    if (!this.inThrottle) {
                        this.inThrottle = true;
                        store.dispatch("selectUser", {
                            id: id,
                            username: remoteFeed.rfdisplay,
                            stream: stream,
                            pluginHandle: remoteFeed,
                            screenShareStream: null,
                            pinned: false
                        });
                        setTimeout(() => (this.inThrottle = false), 1000);
                    }
                }
            };
        }
    }

    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash += Math.pow(str.charCodeAt(i) * 31, str.length - i);
            hash = hash & hash;
        }
        return hash;
    }

    detachFeed(detachRfid) {
        this.feeds = this.feeds.reduce((carry, feed) => {
            if (feed.rfid !== detachRfid) {
                carry.push(feed);
                return carry;
            }
            feed.detach();
            return carry;
        }, [])
    }

    addEventListener(eventMessage, event) {
        this.listeners[eventMessage].push(event);
    }

    emitEvent(eventMessage, msg) {
        console.log({eventMessage})
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
        this.emitEvent("pluginAttached", pluginHandle);
    }

    onError(error) {
        console.log("[onError]")
        console.log(error)
        this.emitEvent("error", error)
    }

    async onMessage(msg, jsep) {
        if (jsep) {
            console.group("[onMessage, handleRemoteJsep]");
            this.pluginHandle.handleRemoteJsep({
                jsep: jsep,
                success: () => {
                    console.log("handleRemoteJsep => success")
                    console.groupEnd()
                }
            });
        }

        if (msg.videoroom === "joined") {
            this.myPrivateId = msg.private_id;
            this.myId = msg.id;
            this.myRoom = msg.room;

            await this.publishOwnFeed()

            if (msg.publishers) {
                msg.publishers.forEach(element => {
                    this.emitEvent("attachSubscriberPlugin", this.attachSubscriber(element["id"], element["display"], element["audio_codec"], element["video_codec"]));
                });
            }

            return;
        }

        if (msg.videoroom === "event") {
            if (msg.publishers) {
                // console.log("PUBLISHERS2: ", msg.publishers);
                msg.publishers.forEach(element => {
                    this.emitEvent("attachSubscriberPlugin", this.attachSubscriber(element["id"], element["display"], element["audio_codec"], element["video_codec"]));
                });
            }
        }

        if (msg.joining) {
            // console.log({msg})
            // console.log("Remote user is joining")

        }

    }

    generateDummyMediaStream(width = 640, height = 480) {
        let canvas = Object.assign(document.createElement("canvas"), {width, height});
        canvas.getContext('2d').fillRect(0, 0, width, height);

        let stream = canvas.captureStream();
        let emptyVideo = Object.assign(stream.getVideoTracks()[0], {enabled: false});
        emptyVideo.stop()

        let ctx = new AudioContext(), oscillator = ctx.createOscillator();
        let dst = oscillator.connect(ctx.createMediaStreamDestination());

        oscillator.start();
        let emptyAudio = Object.assign(dst.stream.getAudioTracks()[0], {enabled: false})
        emptyAudio.stop()

        return new MediaStream([emptyVideo, emptyAudio])
    }

    async publishOwnFeed() {
        this.myStream = this.generateDummyMediaStream();

        this.pluginHandle.createOffer({
            stream: this.myStream,
            success: jsep => {
                const publish = {request: "configure", audio: true, video: true};

                this.pluginHandle.send({
                    message: publish,
                    jsep: jsep,
                    success: () => {
                        console.log("CreateOffer configure success")
                    },
                    error: () => {
                        console.log("CreateOffer configure error: ", error)
                    }
                });
            },
            error: error => {
                console.log("CreateOffer error:", error);
            }
        });
    }

    async publishTrack(track) {
        const peerConnection = this.pluginHandle.webrtcStuff.pc;
        const senders = peerConnection.getSenders();

        const rtcpSender = senders.find(sender => sender.track.kind === track.kind);
        await rtcpSender.replaceTrack(track);

        this.myStream.getTracks().find(t => t.kind === track.kind).stop();

        this.myStream = new MediaStream([track, this.myStream.getTracks().find(t => t.kind !== track.kind)])
        this.emitEvent("ownUserJoined", this.buildUser(this.myStream, this.myId, this.myUsername))
    }

    //  await this.publishTrack((await navigator.mediaDevices.getDisplayMedia()).getVideoTracks()[0]);

    onLocalStream(stream) {
        this.emitEvent("ownUserJoined", this.buildUser(stream, this.myId, this.myUsername))
    }

    buildUser(stream, id, username = this.myUsername) {
        return {
            id: id,
            uuid: username.slice(0, 36),
            username: username.slice(37),
            room: this.myRoom,
            stream: stream
        };
    }

    async createRoom(roomName) {
        console.group("[createRoom]: ", roomName);

        return new Promise(((resolve, reject) => {
            this.pluginHandle.send({
                message: {
                    request: "exists",
                    room: roomName
                },
                success: (result) => {
                    console.log(" * exists => success: ", result.exists);

                    if (result.exists) {
                        console.groupEnd();
                        resolve(result)
                        return;
                    }


                    this.pluginHandle.send({
                        message: {
                            request: "create",
                            room: roomName,
                            permanent: false,
                            description: "Super room!",
                            bitrate_cap: false,
                            require_pvtid: true,
                            publishers: 16,
                            transport_wide_cc_ext: true,
                            fir_freq: 10,
                            is_private: true,
                            notify_joining: true
                        },
                        success: (result) => {
                            console.log(" * create => success: ", result.exists);
                            console.groupEnd();
                            resolve(result)
                        }
                    });
                }
            });
        }))
    }

    async joinRoom(roomName, username) {
        return new Promise((resolve, reject) => {
            this.pluginHandle.send({
                message: {
                    request: "join",
                    room: roomName,
                    ptype: "publisher",
                    display: username
                },
                success: () => {
                    this.myUsername = username;
                    resolve()
                }
            });
        });
    }

    attachSubscriber(id, display, audio, video) {
        console.group("[attachSubscriber]");
        console.log(" * params => ", id, display, audio, video);

        let pluginHandle = {};

        let room = this.myRoom;

        return {
            plugin: "janus.plugin.videoroom",
            opaqueId: this.opaqueId,
            success: succesHandle => {
                console.log(" * attach => success");
                pluginHandle = succesHandle;
                pluginHandle.simulcastStarted = false;

                const subscribe = {
                    request: "join",
                    room: room,
                    ptype: "subscriber",
                    feed: id,
                    private_id: this.myPrivateId
                };

                console.log(" * subscribe => ", subscribe);

                pluginHandle.videoCodec = video;
                pluginHandle.send({
                    message: subscribe,
                    success: () => {
                        console.log(" * join => success");
                        console.groupEnd();
                    }
                });
            },
            error: error => {
                console.log(" * attach => error");
                console.log(error);
                console.groupEnd();
            },
            onmessage: (msg, jsep) => {
                console.group("[attachSubscriber, onmessage]");
                console.log(msg)
                console.log(jsep)
                console.groupEnd()

                if (jsep !== undefined && jsep !== null) {
                    console.group("[attachSubscriber, onmessage, createAnswer]");
                    pluginHandle.createAnswer({
                        jsep: jsep,
                        stream: this.myStream,
                        success: jsep => {
                            console.log("[attachSubscriber, onmessage, createAnswer] => success");

                            const body = {
                                request: "start",
                                room: room
                            };

                            pluginHandle.send({
                                message: body,
                                jsep: jsep,
                                success: () => {
                                    console.log("[attachSubscriber, onmessage, start] => success");
                                    console.groupEnd();
                                }
                            });
                        },
                        error: error => {
                            console.log("[attachSubscriber, onmessage, start] => WebRTC error");
                            console.log(error)
                            console.groupEnd();
                        }
                    });
                }

                const event = msg["videoroom"];

                if (event) {
                    switch (event) {
                        case "attached":
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
                            pluginHandle.rfid = msg["id"];
                            pluginHandle.rfdisplay = msg["display"];
                            break;
                        case "event":
                            if (msg["substream"] || msg["temporal"]) {
                                if (!pluginHandle.simulcastStarted) {
                                    pluginHandle.simulcastStarted = true;
                                }
                            }
                            break;
                    }
                }


            },
            onremotestream: stream => {
                console.log({pluginHandle})
                this.emitEvent("userJoined", this.buildUser(stream, pluginHandle.rfid, pluginHandle.rfdisplay))
            },
            oncleanup: () => {
                console.log("[oncleanup]: ", pluginHandle.rfid)
                this.emitEvent("userLeft", this.buildUser(null, pluginHandle.rfid, pluginHandle.rfdisplay))
            }
        };
    }
}