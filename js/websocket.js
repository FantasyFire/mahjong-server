const ws = require("nodejs-websocket");

let server = null;

exports.init = function(port) {
    return new Promise(function(resolve, reject) {
        server = ws.createServer(function(conn) {
            conn.on('text', function(str) {
                let json = JSON.parse(str);
                console.log(`处理${str}`);
                eventHandler(json, conn);
            });
            conn.on("close", function (code, reason) {
                console.log(`Connection closed, code:${code}, reason:${reason}`);
            });
            conn.on("error", function (err) {
                // console.log(`Caught error:${err}`);
            });
        }).listen(port);
        console.log(`Websocket启动`);
        resolve();
    });
};