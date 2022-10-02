// const { addAbortSignal } = require('stream');

module.exports = function (RED) {

    function YeelightNode(config) {
        RED.nodes.createNode(this, config);

        var node = this;

        // Network errors handler
        function _error(source, error) {
            switch (error.code) {
                case 'EHOSTUNREACH':
                    node.status({ fill: "grey", shape: "ring", text: "offline" });
                    break;
                default:
                    node.error(`${source}: ${error}`);
                    node.status({ fill: "red", shape: "dot", text: "error" });
                    break;
            }
        }

        try {
            // Initial status
            node.status({ fill: "grey", shape: "ring", text: "offline" });

            node.device = RED.nodes.getNode(config.device);

            // Register socket events to show status
            // https://nodejs.org/api/net.html#event-close_1
            node.device.yeelight.client.on('connect', () => {
                node.debug('connect');
                node.status({ fill: "green", shape: "dot", text: "connected" });
            });
            node.device.yeelight.client.on('error', (error) => {
                _error('error', error);
            });
            node.device.yeelight.client.on('lookup', (error, address, family, host) => {
                _error('lookup', error);
            });
            node.device.yeelight.client.on('close', (hadError) => {
                node.debug(`close: ${hadError ? 'error' : 'ok'}`);
                if (!hadError) {
                    node.status({ fill: "grey", shape: "ring", text: "offline" });
                }
            });
            node.device.yeelight.client.on('end', () => {
                node.trace('end');
                node.status({ fill: "grey", shape: "ring", text: "offline" });
            });

            // Main input
            node.on('input', function (msg) {
                node.trace(
                    `method:${config.method}`
                    + `, type:${config.payloadType}`
                    + `, payload:${JSON.stringify(config.payload)}`
                    + `, msg:${JSON.stringify(msg)}`
                );


                var method = config.method;
                var params = [];

                switch (config.payloadType) {
                    case 'msg':
                        params = msg[config.payload];
                        break;
                    case 'flow':
                        params = node.context().flow[config.payload];
                        break;
                    case 'global':
                        params = node.context().global[config.payload];
                        break;
                    default:
                        if (!params.length) params = config.payload;
                        break;
                }

                // Predefined scenes
                if (method == '#moon') {
                    method = 'set_power';
                    params = [params, 'smooth', 500, 5];
                }

                if (!Array.isArray(params)) params = [params];

                // Send command
                node.trace(`call: ${method}(${params})`);
                node.device.yeelight[method](...params)
                    .then(function (data) {
                        msg.payload = JSON.parse(data);
                        node.trace(`complate:${JSON.stringify(msg)} `);
                        node.send(msg);
                    })
                    .catch(function (error) {
                        _error('call', error);
                    });
            });
        } catch (exception) {
            node.error(`exception: ${exception} `);
            node.status({ fill: "red", shape: "ring", text: "break" });
        }
    }

    RED.nodes.registerType("yeelight", YeelightNode);
}
