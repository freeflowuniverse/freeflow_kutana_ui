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
            "ownUserJoined": []
        };
        this.myId = null;
        this.myPrivateId = null;
        this.myRoom = null;
        this.myUsername = null;
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
            return;
        }

        if(msg.joining) {
            console.log({msg})
            console.log("Remote user is joining")
        }
    }

    async publishOwnFeed() {
        console.log("Publishing own feed ...")

        // TODO Pass stream from the users perspective.
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })

        this.pluginHandle.createOffer({
            media: {
                audioRecv: false,
                videoRecv: false,
                audioSend: true,
                videoSend: true
            },
            simulcast: false,
            simulcast2: false,
            stream: stream,
            success: jsep => {
                const publish = { request: "configure", audio: true, video: true };
                this.pluginHandle.send({
                    message: publish,
                    jsep: jsep
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
        let pluginHandle = {};

        console.log("Attaching subscriber ...")
        this.emitEvent("attach", {
            plugin: "janus.plugin.videoroom",
            opaqueId: store.getters.opaqueId,
            success: succesHandle => {
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
                if (
                    Janus.webRTCAdapter.browserDetails.browser === "safari" &&
                    (video === "vp9" || (video === "vp8" && !Janus.safariVp8))
                ) {
                    if (video) video = video.toUpperCase();
                    subscribe["offer_video"] = false;
                }
                pluginHandle.videoCodec = video;
                pluginHandle.send({message: subscribe});
            },
            error: error => {
                // Janus.error("  -- Error attaching plugin...", error);
            },
            onmessage: (msg, jsep) => {
                const event = msg["videoroom"];
                if (event) {
                    switch (event) {
                        case "attached":
                            for (let i = 1; i < 16; i++) {
                                if (
                                    store.getters.feeds[i] === undefined ||
                                    store.getters.feeds[i] === null
                                ) {
                                    store.getters.feeds[i] = pluginHandle;
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
                    pluginHandle.createAnswer({
                        jsep: jsep,
                        media: {audioSend: false, videoSend: false},
                        success: jsep => {
                            const body = {request: "start", room: store.getters.roomId};
                            pluginHandle.send({message: body, jsep: jsep});
                        },
                        error: error => {
                            Janus.error("WebRTC error:", error);
                        }
                    });
                }
            },
            onremotestream: stream => {
                this.determineSpeaker(stream, pluginHandle, id);

                let filteredUser = store.getters.users.find(
                    user => user.username === pluginHandle.rfdisplay
                );

                if (!filteredUser) {
                    let newUser = {
                        id: id,
                        username: pluginHandle.rfdisplay,
                        stream: stream,
                        pluginHandle: pluginHandle
                    };

                    const users = store.getters.users;
                    users.push(newUser);

                    store.commit("setUsers", users);

                    setTimeout(() => {
                        store.commit("setSelectedUser", newUser);
                    }, 500);
                } else {
                    const users = store.getters.users;
                    users.splice(users.findIndex(user => user.id === filteredUser.id), 1, filteredUser);

                    store.commit("setUsers", users);
                }
            },
            oncleanup: () => {
                console.log("# Got a cleanup: " + id)
                console.log(store.getters.users)

                store.commit(
                    "setUsers",
                    store.getters.users.filter(user => user.id !== id)
                );

                console.log(store.getters.users)
                console.log("# End of cleanup")
            }
        });
    }
}