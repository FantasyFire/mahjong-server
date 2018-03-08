const GU = require('./gameUtils.js');
const TurnBasedGame = require('./turn-based.js');
const util = require('util');

var MahjongTable = function (config) {
    TurnBasedGame.call(this);
    let defaultConfig = {
        needPlayerCount: 4,
        cards: [11,11,11,11,12,12,12,12,13,13,13,13,14,14,14,14,15,15,15,15,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,31,31,31,31,32,32,32,32,33,33,33,33,34,34,34,34,35,35,35,35,36,36,36,36,37,37,37,37,38,38,38,38,39,39,39,39,51,51,51,51,52,52,52,52,53,53,53,53,54,54,54,54,55,55,55,55,56,56,56,56,57,57,57,57,58,58,58,58,59,59,59,59,70,70,70,70,73,73,73,73,76,76,76,76,79,79,79,79,90,90,90,90,93,93,93,93,96,96,96,96],
        handCardCount: 13
    };
    this.config = Object.assign(defaultConfig, config || {});
};

var p = MahjongTable.prototype;

p.reset = function () {
    TurnBasedGame.prototype.reset.apply(this);
};

// 私有接口
// 用于管理麻将牌
/**
 * 返回顶部的卡牌
 * @param {Number} card - 希望获取的卡牌，如果不传，则正常返回顶部卡牌
 * @return {Number}
 */
p._getTop = function (card) {
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
p._getBottom = function (card) {
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

/**
 * 重置单局玩家数据
 */
p._resetPlayerData = function () {
    for (let playerId in this.playerDatas) {
        let pd = this.playerDatas[playerId];
        pd.handCards = [];
        pd.groupCards = [];
    }
};

/**
 * 分配卡牌
 */
p._allocateCards = function () {
    let i;
    for (i=0; i<this.config.handCardCount; i++) {
        for (let playerId in this.playerDatas) {
            this.playerDatas[playerId].handCards.push(this._getTop());
        }
    }
};

/**
 * 玩家抽卡
 * @param {String} playerId - 玩家id
 */
p._drawCard = function (playerId) {
    this.playerDatas[playerId].newCard = this._getTop();
    // todo: 广播抽卡信息
};

// 实现Game的接口
p.joinIn = function (playerId) {
    let exist = this.playerSequence.includes(playerId);
    if (!exist) {
        this.playerSequence.push(playerId);
        this.playerDatas[playerId] = {};
    }
    return !exist;
};
p.canStart = function () {
    return this.playerSequence.length == this.config.needPlayerCount;
};
p.gameStart = function () {
    // todo: 修改游戏数据
    // todo: 重置单局数据
    this._resetCards();
    this._resetPlayerData();
    // todo: 开始新一局
    this._allocateCards();

    this._drawCard(this.currentPlayerId);

    // todo: 进入等待当前玩家动作状态

    return true;
};

util.inherits(MahjongTable, TurnBasedGame);

module.exports = config => new MahjongTable(config);