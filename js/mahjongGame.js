const GU = require('./gameUtils.js');
// const TurnBasedGame = require('./turn-based.js');
const Game = require('./game.js');
const util = require('util');

var MahjongGame = function (data, config) {
    Game.call(this);
    // 将数据合并到本对象
    for (let key in data) this[key] = data[key];
    // 设置配置对象
    let defaultConfig = {
        needPlayerCount: 4,
        cards: [11,11,11,11,12,12,12,12,13,13,13,13,14,14,14,14,15,15,15,15,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,31,31,31,31,32,32,32,32,33,33,33,33,34,34,34,34,35,35,35,35,36,36,36,36,37,37,37,37,38,38,38,38,39,39,39,39,51,51,51,51,52,52,52,52,53,53,53,53,54,54,54,54,55,55,55,55,56,56,56,56,57,57,57,57,58,58,58,58,59,59,59,59,70,70,70,70,73,73,73,73,76,76,76,76,79,79,79,79,90,90,90,90,93,93,93,93,96,96,96,96],
        handCardCount: 13
    };
    this.config = Object.assign(defaultConfig, config || {});
    // 重写游戏状态
    this.STATE = {
        NONE: 0,
        WAIT_CURRENT_PLAYER_ACTION: 1,
        WAIT_OHTER_PLAYERS_ACTION: 2,
        GAME_OVER: 4
    };
    this.state = this.STATE.NONE;
};

var p = MahjongGame.prototype;

// 私有接口
// 用于管理麻将牌
/**
 * 返回顶部的卡牌
 * @param {Number} card - 希望获取的卡牌，如果不传，则正常返回顶部卡牌
 * @return {Number}
 */
p._getTopCard = function (card) {
    if (this.cardCount <= 0) return -1;
    if (card != undefined) {
        let idx = this.cards.indexOf(card);
        if (idx != -1 && this.topIdx<=idx && idx<=this.bottomIdx) {
            let temp = this.cards[idx];
            this.cards[idx] = this.cards[this.topIdx];
            this.cards[topIdx] = temp;
        }
    } else {
        card = this.cards[this.topIdx];
    }
    this.topIdx++;
    this.cardCount--;
    return card;
};

/**
 * 返回顶部的卡牌
 * @param {Number} card - 希望获取的卡牌，如果不传，则正常返回顶部卡牌
 * @return {Number}
 */
p._getBottomCard = function (card) {
    if (this.cardCount <= 0) return -1;
    if (card != undefined) {
        let idx = this.cards.indexOf(card);
        if (idx != -1 && this.topIdx<=idx && idx<=this.bottomIdx) {
            let temp = this.cards[idx];
            this.cards[idx] = this.cards[this.bottomIdx];
            this.cards[bottomIdx] = temp;
        }
    } else {
        card = this.cards[this.bottomIdx];
    }
    this.bottomIdx--;
    this.cardCount--;
    return card;
};

p._resetCards = function () {
    // 初始化麻将牌
    this.cards = GU.shuffle([].concat(this.config.cards));
    this.topIdx = 0;
    this.bottomIdx = this.cards.length - 1;
    this.cardCount = this.cards.length;
};

p._allocateCards = function () {
    let i;
    for (i=0; i<this.config.handCardCount; i++) {
        for (let playerId in this.playerDatas) {
            this.playerDatas[playerId].handCards.push(this._getTopCard());
        }
    }
};

// 初始化时用到的参数
/**
 * 重置单局玩家数据
 */
p._resetPlayerData = function () {
    let self = this;
    this.playerSequence.forEach(function (playerId) {
        let pd = self.playerDatas[playerId] = {};
        pd.handCards = [];
        pd.groupCards = [];
    });
    this.currentPlayerId = this.playerSequence[0];
};

/**
 * 分配卡牌
 */
p._allocateCards = function () {
    let i;
    for (i=0; i<this.config.handCardCount; i++) {
        for (let playerId in this.playerDatas) {
            this.playerDatas[playerId].handCards.push(this._getTopCard());
        }
    }
};

/**
 * 玩家抽卡
 * @param {String} playerId - 玩家id
 */
p._drawCard = function (playerId) {
    this.playerDatas[playerId].newCard = this._getTopCard();
    // todo: 广播抽卡信息
};

p._getNextPlayerId = function () {
    return this.playerSequence[(this.playerSequence.indexOf(this.currentPlayer)+1)%this.playerSequence.length];
}

// 实现Game的接口
p.joinIn = function (playerId) {
    let self = this;
    return new Promise((resolve, reject) => {
        let exist = self.playerSequence.includes(playerId);
        if (!exist) {
            self.playerSequence.push(playerId);
            self.playerDatas[playerId] = {};
            resolve({'error': false, 'result': `player: ${playerId} 成功进入游戏`});
        } else {
            reject({'error': true, 'result': '用户已经进入房间'});
        }
    });
};
p.canStart = function () {
    return this.playerSequence.length == this.config.needPlayerCount;
};
p.start = function () {
    let self = this;
    return new Promise((resolve, reject) => {
        // todo: 修改游戏数据
        // todo: 重置单局数据
        self._resetCards();
        self._resetPlayerData();
        // todo: 开始新一局
        self._allocateCards();

        self._drawCard(self.currentPlayerId);
        // 回合制游戏属性初始化
        this.turnCount = 0;

        // todo: 进入等待当前玩家动作状态
        self.state = self.STATE.WAIT_CURRENT_PLAYER_ACTION;
        resolve({'error': false, result: '游戏开始'});
    });
};

util.inherits(MahjongGame, Game);

module.exports = MahjongGame;