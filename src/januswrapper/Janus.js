import { Janus as JanusGateway } from 'janus-gateway';

export class Janus {
    constructor(server) {
        this.users = [];
        this.server = server;
    }

    async initializeJanusGateway() {
        return new Promise((resolve, reject) => {
            //             console.log("Attempting to connect to: " + this.server)
            this.janusGateway = new JanusGateway({
                server: this.server,
                success: resolve,
                error: reject,
                destroyed: this.janusGatewayInitializationDestroyed,
            });
        });
    }

    janusGatewayInitializationDestroyed() {
        // console.log("Destroyed")
    }

    attachPlugin(plugin) {
        plugin.addEventListener('attachSubscriberPlugin', subscriberAttach => {
            this.janusGateway.attach(subscriberAttach);
        });

        this.janusGateway.attach(plugin.attach());
    }
}
