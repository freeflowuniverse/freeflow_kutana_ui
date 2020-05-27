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