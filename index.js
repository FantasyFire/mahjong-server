const co = require('co');
const MahjongRoom = require('./js/mahjongRoom');
const MahjongGame = require('./js/mahjongGame');

var room = new MahjongRoom('1000', MahjongGame);

co(function* () {
    yield room.joinIn('player1');
    yield room.joinIn('player2');
    yield room.joinIn('player3');
    yield room.joinIn('player4');

    // console.log('game canStart: ', table.canStart());
    yield room.startGame();
    // console.log('player data: ', table.playerDatas);
});