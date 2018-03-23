const GU = require('./gameUtils.js');
const {ActionCode, STATE} = require('./mahjongConstants.js');
const Game = require('./game.js');
const util = require('util');
const StateMachine = require('javascript-state-machine');

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
    // 重置游戏变量
    this.othersActionList = []; // 当前玩家打牌后，其他玩家的可执行动作列表
    // 重写游戏状态
    // 使用 javascript-state-machine 做状态机
    // todo: 添加各transition
    let self = this;
    this.fsm = new StateMachine({
        init: STATE.NONE,
        transitions: [
            {name: 'start', from: STATE.NONE, to: STATE.WAIT_PLAYER_ACTION},
            {name: 'playCard', from: STATE.WAIT_PLAYER_ACTION, to: STATE.WAIT_OHTERS_ACTION},
            {name: 'gang', from: [STATE.WAIT_PLAYER_ACTION,STATE.WAIT_OHTERS_ACTION], to: STATE.WAIT_PLAYER_ACTION},
            {name: 'peng', from: STATE.WAIT_OHTERS_ACTION, to: STATE.WAIT_PLAYER_ACTION},
            {name: 'chi', from: STATE.WAIT_OHTERS_ACTION, to: STATE.WAIT_PLAYER_ACTION},
            {name: 'hu', from: STATE.WAIT_PLAYER_ACTION, to: STATE.GAME_OVER},
        ],
        methods: {
            onPlayCard () {
                self.othersActionList = self._retrieveOthersActionList();
                // todo: 开始按顺序询问动作
            }
        }
    });
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

// 初始化方法
/**
 * 重置单局玩家数据
 */
p._resetPlayerData = function () {
    let self = this;
    this.playerSequence.forEach(function (playerId) {
        let pd = self.playerDatas[playerId] = {};
        pd.handCards = [];
        pd.playedCards = [];
        pd.playCard = undefined;
        pd.newCard = undefined;
        pd.groupCards = [];
    });
    this.currentPlayerId = this.playerSequence[0];
};

/**
 * 发牌
 */
p._dealCards = function () {
    for (let i=0; i<this.config.handCardCount; i++) {
        for (let playerId in this.playerDatas) {
            this.playerDatas[playerId].handCards.push(this._getTopCard());
        }
    }
};

// 玩家动作
/**
 * 玩家抽卡
 * @param {String} playerId - 玩家id
 */
p._drawCard = function (playerId) {
    this.playerDatas[playerId].newCard = this._getTopCard();
};
/**
 * 玩家打出一张牌
 * @param {String} playerData - 玩家数据
 * @param {Number} cardIndex - 卡牌序数
 */
p._playCard = function (playerData, cardIndex) {
    let playNewCard = cardIndex==playerData.handCards.length, // 打出的是否新摸到的牌
        card = playNewCard ? playerData.newCard : playerData.handCards[cardIndex]; // 打出的牌
    playNewCard ? playerData.newCard = undefined : playerData.handCards.splice(cardIndex, 1); // 从手牌/摸牌中去掉打出的牌
    playerData.playCard = card; // 设置打出的牌
};
/**
 * 玩家杠牌
 */
// to check: 未测试
p._gangCard = function (playerId, card, actionCode) {
    let playerData = this.playerDatas[playerId]; // 默认来自自己（暗杠、碰后杠）
    // todo: 其实明杠是没必要整理手牌的，考虑优化
    this._sortHandCard(playerData); // 先整理手牌
    switch (actionCode) {
        case ActionCode.AnGang:
            let handCards = playerData.handCards,
                from = playerId; // 牌来自自己
            handCards.splice(handCards.indexOf(card), 4); // 去掉自己的4张手牌
            playerData.groupCards.push({actionCode, card, from}); // 组合牌中加入杠的数据
            break;
        case ActionCode.MingGang:
            let handCards = playerData.handCards,
                from = this.currentPlayerId, // 牌来自当前打出牌的玩家
                currentPlayerData = this.playerDatas[from];
            handCards.splice(handCards.indexOf(card), 3); // 去掉自己的3张手牌
            currentPlayerData.playCard = undefined; // 将当前玩家打出的牌去掉
            playerData.groupCards.push({actionCode, card, from}); // 组合牌中加入杠的数据
            break;
        case ActionCode.PengHouGang:
            let handCards = playerData.handCards;
            handCards.splice(handCards.indexOf(card), 1); // 去掉自己的1张手牌
            // 找到碰的数据，并将其改造为碰后杠数据
            let pengGroupCard = playerData.groupCards.find(gc => gc.actionCode===ActionCode.Peng && gc.card===card);
            pengGroupCard.actionCode = ActionCode.PengHouGang;
            break;
    }
};

/**
 * 玩家碰
 */
p._pengCard = function (playerId, card) {
    let playerData = this.playerDatas[playerId],
        handCards = playerData.handCards,
        from = this.currentPlayerId,
        currentPlayerData = this.playerDatas[from];
    handCards.splice(handCards.indexOf(card), 2); // 去掉自己的2张手牌
    currentPlayerData.playCard = undefined; // 将当前玩家打出的牌去掉
    playerData.groupCards.push({actionCode: ActionCode.Peng, card, from}); // 组合牌中加入碰的数据
};
/**
 * 玩家吃
 */
p._chiCardWith2HandCards = function (playerId, card, handCards) {
    let playerData = this.playerDatas[playerId],
        handCards = playerData.handCards,
        from = this.currentPlayerId,
        currentPlayerData = this.playerDatas[from];
    handCards.forEach(c => handCards.splice(handCards.indexOf(c), 1)); // 去掉2张手牌
    currentPlayerData.playCard = undefined; // 将当前玩家打出的牌去掉
    playerData.groupCard.push({actionCode: ActionCode.Chi, cards: [card].concat(handCards), from}); // 组合牌中加入吃的数据
};


// 动作执行合法性判断
// todo: 将独立写一个模块判胡
p._canHu = function (playerId, card) {
    return false;
};
// todo: _canGangCard 和 _canPengCard 代码有大部分重复，考虑是否合并
/**
 * 检查玩家是否能杠某张牌
 * @return {false|Number} - 不能杠返回false，能杠返回可以杠的ActionCode
 */
// to check: 未测试
p._canGangCard = function (playerId, card) {
    let playerData = this.playerDatas[playerId],
        isCurrentPlayer = this.currentPlayerId === playerId,
        handCards = isCurrentPlayer ? this._sortHandCard(playerData, true) : playerData.handCards, // 对于当前玩家，需要将手牌和摸到的牌合并再检测
        needCount = isCurrentPlayer ? 4 : 3; // 需要找到多少张牌
    if (isCurrentPlayer) { // 对于当前玩家，查找是否有碰了这牌，且他自己有这张牌（碰后杠的情况）
        let groupCard = playerData.groupCards.find(gc => gc.type===ActionCode.Peng && gc.card===card);
        if (groupCard && handCards.includes(card)) return ActionCode.PengHouGang;
    } else { // 非当前玩家，需要判断当前玩家是否打出card这张牌，若不是，直接判错
        if (this.playerDatas[playerId].playCard !== card) return false;
    }
    // 查找是否能找到needCount张card
    // to check: 约定玩家手牌已排序
    for (let i = handCards.length; i--; ) {
        if (handCards[i] < card) return false;
        if (handCards[i] === card) 
            return handCards[i-needCount+1] === card ? isCurrentPlayer ? ActionCode.AnGang : ActionCode.MingGang : false;
    }
    return false;
};
// 检查玩家是否能碰某张牌
p._canPengCard = function (playerId, card) {
    let handCards = this.playerDatas[playerId].handCards,
        currentPlayerData = this.playerDatas[this.currentPlayerId];
    if (currentPlayerData.playCard !== card) return false; // 当前玩家不是打出card这张牌，直接判错
    // to check: 约定玩家手牌已排序
    for (let i = handCards.length; i--; ) {
        if (handCards[i] < card) return false;
        if (handCards[i] === card) return handCards[i-2] === card;
    }
    return false;
};
// 检查是否能以某2张手牌吃某张牌
// to check: 此处的 handCards 应为长度为2且已排序的数组
p._canChiCardWith2HandCards = function (card, handCards) {
    let i, currentPlayerData = this.playerDatas[this.currentPlayerId];
    if (currentPlayerData.playCard !== card) return false; // 当前玩家不是打出card这张牌，直接判错
    for (i = handCards.length; i--; ) { // 将card顺序插入handCards
        if (card > handCards[i]) {
            handCards.splice(i+1, 0, card);
            break;
        }
    }
    i===-1 && (handCards.splice(0, 0, card));
    return handCards[0]+1===handCards[1] && handCards[1]+1===handCards[2];
};

// 计算玩家可执行的动作
/**
 * 在当前玩家打出牌后，计算出其他玩家的可执行动作列表，以优先度排序
 */
// to check: 写完未测试
// todo: 这里没有考虑一炮多响的情况
p._retrieveOthersActionList = function () {
    let currentPlayerData = this.playerDatas[this.currentPlayerId],
        currentPlayCard = currentPlayerData.playCard,
        otherPlayerIds = this._getOtherPlayerIdsByOrder(),
        res = [];
    for (let playerId of otherPlayerIds) { // 分别统计出玩家的可执行动作码
        let actionCode = 0,
            r = {playerId};
        this._canHu(playerId, currentPlayCard) && (actionCode += ActionCode.Hu);
        this._canGangCard(playerId, currentPlayCard) && (actionCode += ActionCode.Gang);
        this._canPengCard(playerId, currentPlayCard) && (actionCode += ActionCode.Peng);
        let chiList = this._retrieveChiList(playerId, currentPlayCard);
        chiList.length > 0 && (actionCode += ActionCode.Chi, r.chiList = chiList);
        if (actionCode > 0) {
            actionCode += ActionCode.Pass; // 过 的actionCode
            r.actionCode = actionCode;
            res.push(r);
        }
    }
    // 按actionCode大小排序
    return res.sort((a, b) => a.actionCode-b.actionCode);
};
/**
 * 获取玩家能吃的组合
 * @return {Array.<Array.<Number>>} - 形如 [[2,1,3],[2,3,4]] 每个数组元素中的第一个数字为吃的牌
 */
p._retrieveChiList = function (playerId, card) {
    let handCards = this.playerDatas[playerId].handCards,
        nearCards = [0,0,0,0,0], // 分别记录玩家手牌中 card-2,card-1,card,card+1,card+2 的数量
        res = [];
    for (let i = handCards.length; i--; ) { // 统计出nearCards
        let hd = handCards[i];
        if (hd > card+2) continue;
        if (hd < card-2) break;
        nearCards[hd-card+2]++;
    }
    [[0,1],[1,3],[3,4]].forEach(g => nearCards[g[0]] && nearCards[g[1]] && res.push([card, card+g[0]-2, card+g[1]-2]));
    return res;
};

// 工具方法
// 获取下一个玩家的id
p._getNextPlayerId = function (playerId) {
    playerId = playerId || this.currentPlayerId;
    if (!this.playerSequence.includes(playerId)) console.error(`playerId ${playerId} 在this.playerSequence ${this.playerSequence} 中找不到 in mahjongGame._getNextPlayerId`);
    return this.playerSequence[(this.playerSequence.indexOf(playerId)+1)%this.playerSequence.length];
};
// 获取除 playerId 之外的玩家id数组（按顺序的）
p._getOtherPlayerIdsByOrder = function (playerId) {
    playerId = playerId || this.currentPlayerId;
    let ps = this.playerSequence,
        idx = ps.indexOf(playerId);
    return ps.slice(idx+1, ps.length).concat(ps.slice(0, idx));
};
// 判断玩家是否存在某index的卡牌
p._hasCardIndex = function (playerData, cardIndex) {
    let allHandCardCount = playerData.handCards.length + (playerData.newCard ? 1 : 0); // 获取手牌+（可能存在）新摸到的牌总数
    return cardIndex < 0 || cardIndex >= allHandCardCount;
};
// 整理手牌（如有newCard，则将newCard也整理进手牌中）
// todo: 效率有待改进
p._sortHandCard = function (playerData, clone = false) {
    let res = clone ? playerData.handCards.concat() : playerData.handCards;
    if (playerData.newCard) {
        res.push(playerData.newCard);
        playerData.newCard = undefined;
    }
    res.sort();
    return res;
};

// 关于通信
// todo: 创建一个轮询对象
p._createPolling = function (actionList, onFinished) {
    let idx = -1;
    return {
        next () {
            idx++;
            if (idx >= actionList.length) {
                onFinished();
            } else {
                
            }
        }
    };
};

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
// 开始游戏
p.start = function () {
    let self = this;
    return new Promise((resolve, reject) => {
        // todo: 重置单局数据
        self._resetCards();
        self._resetPlayerData();
        // todo: 开始新一局
        // 发牌
        self._dealCards();
        // todo: 通知发牌结果
        // 整理手牌
        for (let playerId in self.playerDatas) self._sortHandCard(self.playerDatas[playerId]);
        // todo: 通知整理手牌结果
        // 当前玩家摸牌
        // self._drawCard(self.currentPlayerId);
        // todo: 通知摸牌结果
        // 回合制游戏属性初始化
        this.turnCount = 0;

        // todo: 进入等待当前玩家动作状态
        self.fsm.start();
        // self.state = self.STATE.WAIT_CURRENT_PLAYER_ACTION;
        resolve({'error': false, result: '游戏开始'});
    });
};

// 玩家动作接口
// 玩家动作总接口
// todo: 这里通过状态机统一验证player能否做action，然后再分别调用子action动作进行详细验证
p.doAction = function (playerId, action, data) {
    let message = '';
    // todo: 这里简单地对执行人做合法性判断
    // todo: 这里的错误信息应该更详细
    if (this.fsm.is(STATE.WAIT_PLAYER_ACTION) && playerId !== this.currentPlayerId) {
        message = '在等待当前玩家动作时，非当前玩家请求动作';
    }
    if (this.fsm.is(STATE.WAIT_OHTERS_ACTION) && playerId === this.currentPlayerId) {
        message = '在等待其他玩家动作时，当前玩家请求动作';
    }
    if (this.fsm.cannot(action)) {
        message = '当前状态下，玩家不可以执行该动作';
    }
    if (message) {
        return {'error': true, 'result': message};
    } else {
        // to check: 是否所有动作都能正确调用，及返回
        return this[action](playerId, data);
    }
};
// 打出一张牌
p.playCard = function (playerId, cardIndex) {
    let message = '', playerData = this.playerDatas[playerId];
    // if (!this.inState(this.STATE.WAIT_CURRENT_PLAYER_ACTION)) {
    if (this._hasCardIndex(playerData, cardIndex)) {
        message = `玩家${playerId}手中没有第${cardIndex+1}张牌`;
    }
    if (message) { // 如果有message，意味着有错误
        return {'error': true, 'result': message};
    } else {
        this._playCard(playerData, cardIndex);
        this._sortHandCard(playerData);
        message = `玩家${playerId}打出${playerData.playCard}`;
        return {'error': false, 'result': message};
    }
};
/**
 * 杠（明杠、暗杠、碰后杠）
 * @param {String} playerId - 玩家id
 * @param {Number} card - 卡牌
 */
p.gang = function (playerId, card) {
    let actionCode = this._canGangCard(playerId, card);
    if (actionCode) {
        if (actionCode === ActionCode.PengHouGang) {
            // todo: 碰后杠需要轮询确认是否有人抢杠
        } else {
            this._gangCard(playerId, card, actionCode);
            // todo: 应详细描述是什么杠，杠谁的什么牌
            return {'error': false, 'result': `玩家${playerId}杠${card}`};
        }
    } else {
        return {'error': true, 'result': `玩家${playerId}不满足杠的条件`};
    }
};
/**
 * 杠（明杠、暗杠、碰后杠）
 * @param {String} playerId - 玩家id
 */
p.peng = function (playerId) {
    let currentPlayerData = this.playerDatas[this.currentPlayerId],
        card = currentPlayerData.playCard;
    if (this._canPengCard(playerId, card)) {
        this._pengCard(playerId, card);
        return {'error': false, 'result': `玩家${playerId}碰${card}玩家${this.currentPlayerId}打出的牌${card}`};
    } else {
        return {'error': true, 'result': `玩家${playerId}不满足碰的条件，当前玩家${this.currentPlayerId}打出牌${card}`};
    }
};
/**
 * 吃
 * @param {String} playerId - 玩家id
 * @param {Array.<Number>} handCards - 长度为2的手牌数组
 */
p.chi = function (playerId, handCards) {
    let currentPlayerData = this.playerDatas[this.currentPlayerId],
        card = currentPlayerData.playCard;
    if (this._getNextPlayerId() !== playerId) {
        return {'error': true, 'result': `玩家非当前玩家的下家`};
    }
    if ((!handCards instanceof Array) || handCards.length!==2) {
        return {'error': true, 'result': `玩家${playerId}请求吃动作时，传入handCards不为数组或长度不为2`};
    }
    if (this._canChiCardWith2HandCards(card, handCards)) {
        this._chiCardWith2HandCards(playerId, card, handCards);
        return {'error': false, 'result': `玩家${playerId}吃${card}玩家${this.currentPlayerId}打出的牌${card}`};
    } else {
        return {'error': true, 'result': `玩家${playerId}不满足吃的条件，当前玩家${this.currentPlayerId}打出牌${card}`};
    }
};

util.inherits(MahjongGame, Game);

module.exports = MahjongGame;