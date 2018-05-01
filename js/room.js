/**
 * 房间基类构造函数
 * @param {String} - 房间id
 * @param {Function} - 游戏构造函数
 */
var Room = function (roomId, gameConstructor, socket) {
    this.roomId = roomId;
    this.gameConstructor = gameConstructor;
    this.socket = socket;
    this.gameCount = 0; // 记录游戏局数
    this.playerSequence = []; // 玩家顺序
    this.playerDatas = {}; // 玩家数据：玩家id - 玩家数据对象
    this.game = null; // 游戏对象
    
    // 状态枚举，这里提供一个格式例子
    // 继承的子类应根据需要重写状态枚举
    this.STATE = {
        NONE: 0,
        WAIT: 1,
        INGAME: 2
    };
    // 初始状态
    this.state = 0;
};

Room.prototype = {
    // 必须实现的接口
    joinIn (playerId) {
        console.error('接口joinIn未实现 in Game.joinIn');
        return false;
    },
    exit (playerId) {
        console.error('接口exit未实现 in Game.exit');
        return false;
    },
    startGame () {
        console.error('接口startGame未实现 in Game.startGame');
        return false;
    },
    // 通用接口
    // 判断当前是否处于某状态
    inState (state) {
        return (this.state&state)!=0;
    }
};

module.exports = Room;