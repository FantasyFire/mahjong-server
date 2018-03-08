const table = require('./js/mahjongTable')();

table.reset();

table.joinIn('player1');
table.joinIn('player2');
table.joinIn('player3');
table.joinIn('player4');

console.log('game canStart: ', table.canStart());
table.gameStart();
console.log('player data: ', table.playerData);