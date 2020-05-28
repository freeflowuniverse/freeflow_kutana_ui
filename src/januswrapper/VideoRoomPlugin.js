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
            "attach": []
        };
    }

    attach() {
        console.log("Emitting attach event")
        return new Promise((resolve, reject) => {
            return {
                plugin: "janus.plugin.videoroom",
                opaqueId: this.opaqueId,
                success: resolve,
                error: reject,
                onmessage: this.onMessage,
                onlocalstream: this.onLocalStream
            }
        });
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
        console.log("[onAttachSucces]")
        this.pluginHandle = pluginHandle;
        // this.createRoom();
    }

    onError(error) {
        console.log("[onError]")
        console.log(error)
        this.emitEvent("error", error)
    }

    onMessage(msg, jsep) {
        console.log("[onMessage]")
        console.log(msg)
        console.log(jsep)
        // const event = msg["videoroom"];
        //
        // if (!event) {
        //     return;
        // }
        //
        // switch (event) {
        //     case "joined":
        //         this.emitEvent("userJoined", {});
        //         break;
        //     case "destroyed":
        //         Janus.warn("The room has been destroyed!");
        //         break;
        //     case "event":
        //         if (msg["publishers"]) {
        //             msg["publishers"].forEach(element => {
        //                 this.attachSubscriber(
        //                     element["id"],
        //                     element["display"],
        //                     element["audio_codec"],
        //                     element["video_codec"]
        //                 )
        //             });
        //             break;
        //         }
        //
        //         if (msg["joining"]) {
        //             let newUser = {
        //                 id: msg["joining"]["id"],
        //                 username: msg["joining"]["display"]
        //             };
        //
        //             const users = store.getters.users;
        //             users.push(newUser);
        //
        //             store.commit("setUsers", users);
        //             break;
        //         }
        //
        //         if (msg["leaving"]) {
        //             this.emitEvent("userLeft", {})
        //             break;
        //         }
        //
        //         if (msg["unpublished"]) {
        //             if (msg["unpublished"] === "ok") {
        //                 store.getters.users[0].pluginHandle.hangup();
        //                 return;
        //             }
        //
        //             this.detachFeed(msg["unpublished"]);
        //             break;
        //         }
        //
        //         if (msg["error"] !== undefined && msg["error"] !== null) {
        //             console.log("Screen share was stopped! 1");
        //             console.log(msg["error"])
        //             break;
        //         }
        //         break;
        // }
        //
        // if (!jsep) {
        //     return;
        // }
        //
        // this.pluginHandle.handleRemoteJsep({
        //     jsep: jsep
        // });
    }

    onLocalStream(stream) {
        let me = JSON.parse(window.localStorage.getItem("account"));
        this.emitEvent("localUserJoined", {
            id: 0,
            username: me.name,
            stream: stream
        });
    }

    createRoom() {
        let room = Math.abs(this.hashString(window.localStorage.getItem("teamName")));
        let me = JSON.parse(window.localStorage.getItem("account"));

        console.group("Room management logs")
        console.log("=> Creating if room exists")

        this.pluginHandle.send({
            message: {
                request: "exists",
                room: room
            },
            success: (result) => {
                if (result.exists) {
                    console.log("=> Room already exists")
                    this.joinRoom(room, me.name)
                    return;
                }

                console.log("=> Room doesnt exists, creating room")
                this.pluginHandle.send({
                    message: {
                        request: "create",
                        room: room,
                        permanent: false,
                        description: me.name,
                        bitrate: 128000,
                        publishers: 16,
                        transport_wide_cc_ext: true,
                        fir_freq: 10,
                        is_private: true,
                        // require_pvtid: true,
                        notify_joining: true
                    },
                    success: (result) => {
                        console.log("=> Room created: ", result)
                        this.joinRoom(room, me.name)
                    }
                });
            }
        });
    }

    joinRoom(room, name) {
        console.log("=> Joining room")
        this.pluginHandle.send({
            message: {
                request: "join",
                room: room,
                ptype: "publisher",
                display: name
            },
            success: () => {
                console.log("=> Room joined")
                console.groupEnd();
            }
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
                    private_id: store.getters.myPrivateId
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