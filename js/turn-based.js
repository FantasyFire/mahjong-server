const Game = require('./game.js');
const util = require('util');

var TurnBasedGame = function () {
    Game.call(this);
    this.playerSequence = [];
    this.STATE = { // 游戏状态
        NONE: 0,
        WAIT_CURRENT_PLAYER_ACTION: 1,
        WAIT_OHTER_PLAYERS_ACTION: 2,
        GAME_OVER: 4
    };
};

TurnBasedGame.prototype = {
    reset () {
        this.turnCount = 0;
        this.currentPlayerId = this.playerSequence[0];
    },
    getNextPlayerId () {
        return this.playerSequence[(this.playerSequence.indexOf(this.currentPlayer)+1)%this.playerSequence.length];
    }
}


util.inherits(TurnBasedGame, Game);

module.exports = TurnBasedGame;