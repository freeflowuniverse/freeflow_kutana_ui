import { Janus as JanusGateway } from "janus-gateway";
import { Janus } from "./Janus";

export class JanusBuilder {

    constructor(server, debug) {
        this.server = server;
        this.debug = debug;
        this.plugins = [];
    }

    addPlugin(plugin) {
        this.plugins.push(plugin);
    }

    async build() {
        await this.initJanusGateway();
        const janus = new Janus(this.server);

        for (const plugin of this.plugins) {
            janus.attachPlugin(plugin);
        }

        return janus;
    }

    async initJanusGateway() {
        return new Promise((resolve, reject) => {
            JanusGateway.init({
                debug: this.debug,
                callback: function() {
                    if (!JanusGateway.isWebrtcSupported()) {
                        reject("No WebRTC support... ");
                        return;
                    }

                    resolve();
                }
            });
        })
    }
}