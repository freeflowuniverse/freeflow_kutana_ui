import { Janus as JanusGateway } from "janus-gateway";

export class Janus {
    constructor(server) {
        this.users = [];
        this.plugins = [];
        this.server = server;

        this.janusGateway = new JanusGateway({
            server: this.server,
            success: this.janusGatewayInitializationSuccess,
            error: this.janusGatewayInitializationError,
            destroyed: this.janusGatewayInitializationDestroyed
        })
    }

    janusGatewayInitializationSuccess() {
        for (const plugin of this.plugins) {
            this.janusGateway.attach(plugin.attach())
        }
    }

    janusGatewayInitializationError() {

    }

    janusGatewayInitializationDestroyed() {

    }

    attachPlugin(plugin) {
        this.plugins.push(plugin)
    }

    emitEvent() {

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
