import store from "../plugins/vuex";
import { Janus } from "janus-gateway";

export class VideoRoomPlugin {

    constructor(opaqueId) {
        this.pluginHandle = null;
        this.opaqueId = opaqueId;
        this.listeners = {"error": [], "userJoined": [], "userLeft": [], "userUpdated": [], };
    }

    async attach() {
        return {
            plugin: "janus.plugin.videoroom",
            opaqueId: this.opaqueId,
            success: this.onAttachSucces,
            error: this.onError,
            onmessage: this.onMessage,
            onlocalstream: this.onLocalStream
        };
    }

    addEventListener(eventMessage, event) {
        this.listeners[eventMessage].push(event);
    }

    emitEvent(eventMessage, msg) {
        const events = this.listeners[eventMessage];

        if (!events) {
            return;
        }

        for(const event of events) {
            event(msg);
        }
    }

    onAttachSucces() {
        // Register username ...
    }

    onError(error) {
        this.emitEvent("error", error)
    }

    onMessage(msg, jsep) {
        const event = msg["videoroom"];

        if (!event) {
            return;
        }

        switch (event) {
            case "joined":
                this.emitEvent("userJoined", {});
                break;
            case "destroyed":
                Janus.warn("The room has been destroyed!");
                break;
            case "event":
                if (msg["publishers"]) {
                    msg["publishers"].forEach(element => {
                        janusHelpers.newRemoteFeed(
                            element["id"],
                            element["display"],
                            element["audio_codec"],
                            element["video_codec"]
                        );
                    });
                    break;
                }

                if (msg["joining"]) {
                    let newUser = {
                        id: msg["joining"]["id"],
                        username: msg["joining"]["display"]
                    };

                    const users = store.getters.users;
                    users.push(newUser);

                    store.commit("setUsers", users);
                    break;
                }

                if (msg["leaving"]) {
                    this.emitEvent("userLeft", {})
                    break;
                }

                if (msg["unpublished"]) {
                    if (msg["unpublished"] === "ok") {
                        store.getters.users[0].pluginHandle.hangup();
                        return;
                    }

                    detachFeed(msg["unpublished"]);
                    break;
                }

                if (msg["error"] !== undefined && msg["error"] !== null) {
                    console.log("Screen share was stopped! 1");
                    console.log(msg["error"])
                    break;
                }
                break;
        }

        if (!jsep) {
            return;
        }

        store.getters.users[0].pluginHandle.handleRemoteJsep({
            jsep: jsep
        });
    }

    onLocalStream() {
        return stream => {
            const users = store.getters.users;
            users[0].stream = stream;

            store.commit("setUsers", users);
        };
    }

}