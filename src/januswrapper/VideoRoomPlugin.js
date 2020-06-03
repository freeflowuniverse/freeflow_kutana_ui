import store from "../plugins/vuex";
import {Janus} from "janus-gateway";

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
        console.log("[onMessage]")
        console.log({msg, jsep})

        if(msg.unpublished) {
            console.log("Got unpublished msg")
        }

        if(msg.leaving) {
            console.log("Got leaving msg")
        }

        if(msg.videoroom === "joined") {
            this.myPrivateId = msg.private_id;
            this.myId = msg.id;
            this.myRoom = msg.room;

            await this.publishOwnFeed()

            if (msg.publishers) {
                console.log("PUBLISHERS: ", msg.publishers);
                msg.publishers.forEach(element => {
                    this.emitEvent("attachSubscriberPlugin", this.attachSubscriber(element["id"], element["display"], element["audio_codec"], element["video_codec"]));
                });
            }

            return;
        }

        if(msg.videoroom === "event") {
            if (msg.publishers) {
                console.log("PUBLISHERS2: ", msg.publishers);
                msg.publishers.forEach(element => {
                    this.emitEvent("attachSubscriberPlugin", this.attachSubscriber(element["id"], element["display"], element["audio_codec"], element["video_codec"]));
                });
            }
        }

        if(msg.joining) {
            console.log({msg})
            console.log("Remote user is joining")

        }

        if (!jsep) {
            return;
        }

        this.pluginHandle.handleRemoteJsep({
            jsep: jsep,
            success: () => {
                console.log("handleRemoteJsep: success")
            }
        });
    }

    async publishOwnFeed() {
        console.log("Publishing own feed ...")

        // TODO Pass stream from the users perspective.
        this.myStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })

        this.pluginHandle.createOffer({
            media: {
                audioRecv: false,
                videoRecv: false,
                audioSend: true,
                videoSend: true
            },
            simulcast: false,
            simulcast2: false,
            stream: this.myStream,
            success: jsep => {
                console.log("publishOwnFeed success")
                const publish = { request: "configure", audio: true, video: true };
                this.pluginHandle.send({
                    message: publish,
                    jsep: jsep,
                    success: () => {
                        console.log("Publish success???")
                    },
                    error: () => {
                        console.log("Error publish ???")
                    }
                });
            },
            error: error => {
                Janus.error("WebRTC error:", error);
            }
        });
    }

    onLocalStream(stream) {
        this.emitEvent("ownUserJoined", {id: this.myId, username: this.myUsername, room: this.myRoom, stream: stream})
    }

    async createRoom(roomName) {
        return new Promise(((resolve, reject) => {
            this.pluginHandle.send({
                message: {
                    request: "exists",
                    room: roomName
                },
                success: (result) => {
                    if (result.exists) {
                        resolve(result)
                        return;
                    }

                    this.pluginHandle.send({
                        message: {
                            request: "create",
                            room: roomName,
                            permanent: false,
                            description: "Super room!",
                            bitrate: 128000,
                            publishers: 16,
                            transport_wide_cc_ext: true,
                            fir_freq: 10,
                            is_private: true,
                            notify_joining: true
                        },
                        success: (result) => {
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
        console.log("[attachSubscriber]: ", id, display, audio, video)
        let pluginHandle = {};

        return {
            plugin: "janus.plugin.videoroom",
            opaqueId: this.opaqueId,
            success: succesHandle => {
                console.log("[attachSubscriber]: Attatched a substriber: ", succesHandle)
                pluginHandle = succesHandle;
                pluginHandle.simulcastStarted = false;

                let room = Math.abs(
                    this.hashString(window.localStorage.getItem("teamName"))
                );

                const subscribe = {
                    request: "join",
                    room: room,
                    ptype: "subscriber",
                    feed: id,
                    private_id: this.myPrivateId
                };

                pluginHandle.videoCodec = video;
                pluginHandle.send({message: subscribe});
            },
            error: error => {
                console.log("[attachSubscriber]: Error")
            },
            onmessage: (msg, jsep) => {
                console.log("[attachSubscriber]: onmessage")
                console.log({msg, jsep});

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

                if (jsep !== undefined && jsep !== null) {
                    console.log("createAnswer");
                    pluginHandle.createAnswer({
                        jsep: jsep,
                        media: {audioSend: false, videoSend: false},
                        success: jsep => {
                            console.log("Answer success");
                            const body = {request: "start", room: this.roomId};
                            pluginHandle.send({message: body, jsep: jsep});
                        },
                        error: error => {
                            Janus.error("WebRTC error:", error);
                        }
                    });
                }
            },
            onremotestream: stream => {
                // this.determineSpeaker(stream, pluginHandle, id);

                console.log("[attachSubscriber]: onremotestream: ", stream);

                // let filteredUser = store.getters.users.find(
                //     user => user.username === pluginHandle.rfdisplay
                // );

                // setTimeout(() => {
                //     store.commit("setSelectedUser", newUser);
                // }, 500);
            },
            oncleanup: () => {
                console.log("[attachSubscriber]: # Got a cleanup: " + id)
                console.log("[attachSubscriber]: # End of cleanup")
            }
        };
    }
}