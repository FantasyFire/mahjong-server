const Room = require('./room.js');
const util = require('util');
/**
 * 麻将房间基类，实现房间类的接口
 * @param {String} - 房间id
 * @param {Function} - 麻将游戏构造函数
 */
var MahjongRoom = function (roomId, gameConstructor) {
    Room.call(this, roomId, gameConstructor);
};

MahjongRoom.prototype = {
    // 私有方法
    _joinIn (user) {
        this.playerSequence.push(user.id);
        this.playerDatas[user.id] = user;
    },
    _exit (playerId) {
        this.playerSequence.splice(this.playerSequence.indexOf(playerId), 1);
        delete this.playerDatas[playerId];
    },
    _initGame () {
        let self = this;
        // TODO: 构造游戏数据对象，如第几局，有什么算分规则之类的
        let data = {
            playerSequence: this.playerSequence,
            users: this.playerSequence.map(pid => self.playerDatas[pid])
        };
        // TODO: 构造游戏配置对象，如第几局，有什么算分规则之类的
        let gameConfig = {
        };
        this.game = new this.gameConstructor(data, gameConfig);
    },
    _startGame () {
        this.state = this.STATE.INGAME;
        this._initGame();
        this.game.start();
    },
    // 实现Room的接口
    joinIn (user) {
        let self = this;
        return new Promise((resolve, reject) => {
            let exist = self.playerSequence.includes(user.id);
            if (self.inState(self.STATE.INGAME)) {
                reject({'error': true, 'result': `房间${self.roomId}已开始游戏，不能中途加入房间`});
            } else if (!exist) {
                self._joinIn(user);
                resolve({'error': false, 'result': `player: ${user.id} 成功进入房间`});
            } else {
                reject({'error': true, 'result': `用户${user.id}已经进入房间${self.roomId}`});
            }
        });
    },
    exit (playerId) {
        let self = this;
        return new Promise((resolve, reject) => {
            let exist = self.playerSequence.includes(playerId);
            if (exist) {
                if (self.inState(self.STATE.INGAME)) {
                    reject({'error': true, 'result': `房间${self.roomId}已开始游戏，不能中途退出房间`});
                } else {
                    self._exit(playerId);
                    resolve({'error': false, 'result': `player: ${playerId} 成功退出房间`});
                }
            } else {
                reject({'error': true, 'result': `用户${playerId}不在房间${self.roomId}里面`});
            }
        });
    },
    startGame () {
        let self = this;
        return new Promise((resolve, reject) => {
            if (!self.inState(self.STATE.INGAME)) {
                self._startGame();
                resolve({'error': false, 'result': `成功开始游戏`});
            } else {
                reject({'error': true, 'result': `游戏已经开始`});
            }
        });
    },
    reconnect (playerId, socket) {
        this.game.reconnect(playerId, socket);
    }
};

util.inherits(MahjongRoom, Room);

module.exports = MahjongRoom;