const { Client } = require('yeelight-node')

module.exports = function (RED) {
    function YeelightDiscoveryNode(config) {
        RED.nodes.createNode(this, config);

        var node = this;
        var client = null;

        this.status({ fill: "gray", shape: "ring", text: "inactive" });

        this.on('input', function (msg, send, done) {
            if (msg.payload) {
                // Create new client and search
                if (client) {
                    client.socket.close();
                    client = null;
                }

                client = new Client();
                client.bind(yeelight => {
                    const { ...data } = yeelight;

                    // Drop private object fields
                    Object.keys(data).forEach(function (key) {
                        if (key.startsWith('_')) delete data[key];
                    });

                    // Return full info
                    msg.payload = data;
                    this.send(msg);
                })

                this.status({ fill: "green", shape: "dot", text: "processing" });
                this.debug('Start search by input')

            } else {
                // Disable search

                if (client) {
                    client.socket.close();
                    client = null;
                }
                this.status({ fill: "gray", shape: "ring", text: "inactive" });
                this.debug('Stop search by input')
            }
        });

        this.on('close', function (removed, done) {
            if (client) client.socket.close();
            this.debug('Stop search on close')
            done();
        });
    }

    RED.nodes.registerType("yeelight-discovery", YeelightDiscoveryNode);
}
