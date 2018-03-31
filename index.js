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
    console.log(1);
    // console.log('room: ', room);
    // console.log('game: ', room.game);
    // room.game.doAction('player1', 'playCard', 7);
    // console.log(JSON.stringify(room.game._getGameState('player1')));
    // console.log(room.game.playCard('player1', 3));
    // console.log('action list: ', actionList);
});