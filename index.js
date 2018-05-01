const co = require('co');
const express = require('express')
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const MahjongRoom = require('./js/mahjongRoom');
const MahjongGame = require('./js/mahjongGame');

var room = new MahjongRoom('1000', MahjongGame);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});
app.use(express.static(__dirname + '/public'));

io.on('connection', function (socket) {
    console.log('a user connected');
    co(function* () {
        yield room.joinIn('player1');
        yield room.joinIn('player2');
        yield room.joinIn('player3');
        yield room.joinIn('player4');
        room._initGame();
        room.game.socket = socket; // 测试时，这样弄
        
        yield room.startGame();
    });
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
});

http.listen(3000, function () {
    console.log('http listening on port: 3000');
});


// co(function* () {
//     yield room.joinIn('player1');
//     yield room.joinIn('player2');
//     yield room.joinIn('player3');
//     yield room.joinIn('player4');

//     yield room.startGame();
// });