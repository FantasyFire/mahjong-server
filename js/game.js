var Game = function () {
    this.playerSequence = [];
};

var p = Game.prototype;

p.joinIn = function (player) {
    console.error('接口joinIn未实现 in Game.joinIn');
    return false;
};
p.canStart = function () {
    console.error('接口canStart未实现 in Game.canStart');
    return false;
};
p.gameStart = function () {
    console.error('接口gameStart未实现 in Game.gameStart');
    return false;
};
p.gameOver = function () {
    console.error('接口gameOver未实现 in Game.gameOver');
    return false;
};

module.exports = Game;