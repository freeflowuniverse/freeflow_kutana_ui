import { janusGateway } from "janus-gateway";

export class Janus {
    async constructor(server, debug) {
        this._users = [];
        this._server = server;
        this._debug = debug;
        this._janusGateway = null;

        await initializeJanus();
    }

    get users() {
        return this._users;
    }

    async initializeJanus() {
        janusGateway.init({
            debug: "all",
            callback: function() {
                if (!Janus.isWebrtcSupported()) {
                    console.error("No WebRTC support... ");
                    return;
                }

                this._janusGateway = new Janus({
                    server: config.janusServer,
                    success: function() {
                        janusHelpers.videoRoom.onJanusCreateSuccess();
                    },
                    error: function(error) {
                        console.error("Janus error callback: ", error);
                        // janusHelpers.videoRoom.onJanusCreateError(context, error);
                    },
                    destroyed: function() {
                        console.error("Janus destroyed callback");
                        janusHelpers.videoRoom.onJanusCreateDestroyed();
                    }
                });

                context.commit("initializeJanus", janus);
            }
        });
    }

}


//
//
// import { Janus } from "this";
// import config from "../../public/config";
// import {janusHelpers} from "../services/Janusservice";
//
//
// const janus = new Janus(..);
//
// janus.users
//
// janus.attachPlugin(...)
// janus.addEventListener("userJoined", () => {
//
// })
//
//
// janus.addEventListener("roomCreated", () => {
//
// })
//
//
//
// Janus.init({
//     debug: "all",
//     callback: function() {
//         if (!Janus.isWebrtcSupported()) {
//             console.error("No WebRTC support... ");
//             return;
//         }
//
//         const janus = new Janus({
//             server: config.janusServer,
//             success: function() {
//                 janusHelpers.videoRoom.onJanusCreateSuccess();
//             },
//             error: function(error) {
//                 console.error("Janus error callback: ", error);
//                 // janusHelpers.videoRoom.onJanusCreateError(context, error);
//             },
//             destroyed: function() {
//                 console.error("Janus destroyed callback");
//                 janusHelpers.videoRoom.onJanusCreateDestroyed();
//             }
//         });
//
//         context.commit("initializeJanus", janus);
//     }
// });
