const Game = require('./base/game.js');
const util = require('util');

var FrameSyncGame = function () {
    Game.call(this);
    
};

FrameSyncGame.prototype = {
    reset () {
        this.turnCount = 0;
        this.currentPlayerId = this.playerSequence[0];
    },
    getNextPlayerId () {
        return this.playerSequence[(this.playerSequence.indexOf(this.currentPlayer)+1)%this.playerSequence.length];
    }
}


util.inherits(FrameSyncGame, Game);

module.exports = TurnBasedGame;