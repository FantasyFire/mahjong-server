const Game = require('./game.js');
const util = require('util');

var TurnBasedGame = function () {
    Game.call(this);

    this.type = "turn-based";
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