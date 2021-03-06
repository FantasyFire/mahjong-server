/**
 * 游戏基类
 */
var Game = function () {
    this.playerDatas = {}; // 玩家数据：玩家id - 玩家数据对象
};

var p = Game.prototype;

// 以下为必须实现的接口
p.canStart = function () {
    console.error('接口canStart未实现 in Game.canStart');
    return false;
};
p.start = function () {
    console.error('接口start未实现 in Game.start');
    return false;
};
p.joinIn = function (user) {
    console.error('接口joinIn未实现 in Game.joinIn');
    return false;
};
p.gameOver = function () {
    console.error('接口gameOver未实现 in Game.gameOver');
    return false;
};
p.reconnect = function (playerId, socket) {
    console.error('接口reconnect未实现 in Game.gameOver');
    return false;
};

// 通用接口
// 判断当前是否处于某状态
p.inState = function (state) {
    return (this.state&state)!=0;
}

module.exports = Game;