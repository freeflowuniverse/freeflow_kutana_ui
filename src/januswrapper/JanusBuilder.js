import { Janus as JanusGateway } from 'janus-gateway';
import { Janus } from './Janus';

export class JanusBuilder {
    constructor(server, debug) {
        this.server = server;
        this.debug = debug;
        this.plugins = [];
    }

    addPlugin(plugin) {
        this.plugins.push(plugin);
        return this;
    }

    async build() {
        await this.initJanusGateway();

        const janus = new Janus(this.server);
        await janus.initializeJanusGateway();

        for (const plugin of this.plugins) {
            await janus.attachPlugin(plugin);
        }

        return janus;
    }

    // This initializes the global Janus instance for us to work with it.
    async initJanusGateway() {
        return new Promise((resolve, reject) => {
            JanusGateway.init({
                debug: "all",
                callback: function() {
                    if (!JanusGateway.isWebrtcSupported()) {
                        reject('No WebRTC support... ');
                        return;
                    }

                    resolve();
                },
            });
        });
    }
}
