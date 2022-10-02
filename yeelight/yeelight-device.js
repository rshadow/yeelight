module.exports = function (RED) {

    const { Yeelight } = require('yeelight-node')

    function YeelightDeviceNode(config) {
        RED.nodes.createNode(this, config);

        var node = this;

        node.name = config.name;
        node.host = config.host;
        node.port = config.port;

        try {
            node.yeelight = new Yeelight({ ip: node.host, port: node.port });

            // Connection in advance to show initial device status
            setTimeout(
                function () {
                    if (!node.yeelight.connected) {
                        node.yeelight._connect();
                    }
                }, 1000 + Math.floor(Math.random() * 500)
            );
        } catch (exception) {
            console.error('exception:', exception);
        }
    }

    RED.nodes.registerType("yeelight-device", YeelightDeviceNode);
}
