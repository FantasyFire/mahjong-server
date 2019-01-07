const co = require('co');
const express = require('express');
// const cookieParser=require("cookie-parser");
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const MahjongRoom = require('./js/mahjong/mahjongRoom');
const MahjongGame = require('./js/mahjong/mahjongGame');

// http
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});
app.use(express.static(__dirname + '/public'));
http.listen(3000, function () {
    console.log('http listening on port: 3000');
});

// websocket
var room = new MahjongRoom("room1000", MahjongGame);

io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('chat message', function(msg){
        console.log('message: ' + msg);
        try {
            let data = JSON.parse(msg);
            let res = room.game.doAction(data.playerId, data.action, data.data);
            console.log(res);
            // socket.emit('news', JSON.stringify(room.game._getGameState()));
        } catch (err) {
            console.error('sth. wrong, msg: ', msg);
        }
    });
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
    socket.on('login', async function (msg) {
        console.log('login: ' + msg);
        try {
            let data = JSON.parse(msg), playerId = data.playerId;
            if (!room.inState(room.STATE.INGAME)) {
                let res = await room.joinIn({id:playerId, socket})
                console.log('room.joinIn res:' + JSON.stringify(res));
                // TODO: 方便测试
                if (room.playerSequence.length == 4 && !room.inState(room.STATE.INGAME)) room.startGame();
            } else {
                room.reconnect(playerId, socket);
            }
        } catch (err) {
            console.error('sth. wrong, msg: ', err);
        }
    })
});