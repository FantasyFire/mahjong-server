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
    socket.on('chat message', function(msg){
        console.log('message: ' + msg);
        let data = JSON.parse(msg);
        let res = room.game.doAction(data.playerId, data.action, data.data);
        console.log(res);
        socket.emit('news', JSON.stringify(room.game._getGameState()));
    });
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
});

http.listen(3000, function () {
    console.log('http listening on port: 3000');
});


co(function* () {
    yield room.joinIn('player1');
    yield room.joinIn('player2');
    yield room.joinIn('player3');
    yield room.joinIn('player4');

    // console.log('game canStart: ', table.canStart());
    yield room.startGame();
    console.log(1);
    // console.log('room: ', room);
    // console.log('game: ', room.game);
    // room.game.doAction('player1', 'playCard', 7);
    // console.log(JSON.stringify(room.game._getGameState('player1')));
    // console.log(room.game.playCard('player1', 3));
    // console.log('action list: ', actionList);
});