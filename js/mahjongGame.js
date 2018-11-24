const GU = require('./gameUtils.js');
const {ACTION_CODE, STATE} = require('./mahjongConstants.js');
const MahjongPlayer = require('./mahjongPlayer.js');
const Game = require('./game.js');
const util = require('util');
const StateMachine = require('javascript-state-machine');
const Log = require('./logger.js')();
const Cheat = require('./cheatData.js');

var MahjongGame = function (data, config) {
    Game.call(this);
    let self = this;
    // 将数据合并到本对象
    for (let key in data) this[key] = data[key];
    // 初始化玩家对象
    this.players = {};
    this.users.forEach(user => self.players[user.id] = new MahjongPlayer(user));
    // 设置配置对象
    let defaultConfig = {
        needPlayerCount: 4,
        cards: [11,11,11,11,12,12,12,12,13,13,13,13,14,14,14,14,15,15,15,15,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,31,31,31,31,32,32,32,32,33,33,33,33,34,34,34,34,35,35,35,35,36,36,36,36,37,37,37,37,38,38,38,38,39,39,39,39,51,51,51,51,52,52,52,52,53,53,53,53,54,54,54,54,55,55,55,55,56,56,56,56,57,57,57,57,58,58,58,58,59,59,59,59,70,70,70,70,73,73,73,73,76,76,76,76,79,79,79,79,90,90,90,90,93,93,93,93,96,96,96,96],
        handCardCount: 13,
        cheat: 2
    };
    this.config = Object.assign(defaultConfig, config || {});
    // 重置游戏变量
    // TODO: 不应该在构造的时候初始化，应该再start里初始化
    this.othersActionList = []; // 当前玩家打牌后，其他玩家的可执行动作列表
    // 重写游戏状态
    // 使用 javascript-state-machine 做状态机
    // TODO: 添加各transition
    this.fsm = new StateMachine({
        init: STATE.NONE,
        transitions: [
            {name: 'start', from: STATE.NONE, to: STATE.WAIT_PLAYER_ACTION},
            {name: 'playCard', from: STATE.WAIT_PLAYER_ACTION, to: STATE.WAIT_OHTERS_ACTION},
            {name: 'gang', from: [STATE.WAIT_PLAYER_ACTION,STATE.WAIT_OHTERS_ACTION], to: STATE.WAIT_PLAYER_ACTION},
            {name: 'peng', from: STATE.WAIT_OHTERS_ACTION, to: STATE.WAIT_PLAYER_ACTION},
            {name: 'chi', from: STATE.WAIT_OHTERS_ACTION, to: STATE.WAIT_PLAYER_ACTION},
            {name: 'hu', from: [STATE.WAIT_PLAYER_ACTION,STATE.WAIT_OHTERS_ACTION], to: STATE.GAME_OVER},
            {name: 'pass', from: STATE.WAIT_OHTERS_ACTION, to: STATE.WAIT_OHTERS_ACTION},
            {name: 'next', from: STATE.WAIT_OHTERS_ACTION, to: STATE.WAIT_PLAYER_ACTION}
        ],
        methods: {
            onBeforeStart () {
                console.log('onStart');
                let player = self.players[self.currentPlayerId];
                player.drawCard(self._getTopCard());
                // TODO: 通知更新玩家状态（整个状态）
                self._sendToPlayer(JSON.stringify(self._getGameState()));
            },
            onBeforePlayCard () {
                console.log('onBeforePlayCard');
                // 获取其他玩家可执行动作队列
                self.othersActionList = self._retrieveOthersActionList();
                // 这里应该先将当前玩家打牌的状态更新到客户端
                self._sendToPlayer(JSON.stringify(self._getGameState()));
            },
            onBeforeGang (transition, playerId) {
                console.log('onGang');
                self.currentPlayerId = playerId;
                let player = self.players[self.currentPlayerId];
                // 杠后抽牌
                player.drawGangCard(self._getBottomCard());
                // 对于暗杠/碰后杠，重新检测当前玩家可执行动作，并告知
                // TODO: 由于fsm中从A转换到A不会触发onA事件，以下代码实际是onWaitPlayerAction的逻辑，考虑怎么优雅地解决这个问题
                if (transition.from === STATE.WAIT_PLAYER_ACTION) {
                    self._clearActionData();
                    self.othersActionList = [];
                    let playerData = self._updateCurrentPlayerAction();
                    // TODO: 通知更新玩家状态（整个状态）
                    self._sendToPlayer(JSON.stringify(self._getGameState()));
                    console.log(`通知玩家${self.currentPlayerId}可执行动作: `, playerData.actionCode);
                }
            },
            onBeforePeng (transition, playerId) {
                console.log('onPeng');
                self.currentPlayerId = playerId;
            },
            onBeforeChi (transition, playerId) {
                console.log('onChi');
                self.currentPlayerId = playerId;
            },
            onBeforePass (transition, playerId) {
                console.log('onPass');
                self._clearActionData(self._getOtherPlayerIdsByOrder());
                // TODO: 与暗杠/碰后杠类似的问题，由于fsm的原因，下面的代码实际是onWaitOthersAction，考虑优化
                setTimeout(function () {
                    self._checkNextOthersAction();
                }, 1000);
            },
            onBeforeHu (transition, playerId) {
                console.log('onHu');
                self._clearActionData();
            },
            onBeforeNext () {
                console.log('onBeforeNext');
                let lastPlayer = self.players[self.currentPlayerId];
                lastPlayer.playCardEnd();
                self.currentPlayerId = self._getNextPlayerId();
                let player = self.players[self.currentPlayerId];
                player.drawCard(self._getTopCard());
            },
            onWaitPlayerAction () {
                console.log('onWaitPlayerAction');
                self._clearActionData();
                self.othersActionList = [];
                let player = self._updateCurrentPlayerAction();
                // TODO: 通知更新玩家状态（整个状态）
                self._sendToPlayer(JSON.stringify(self._getGameState()));
                console.log(`通知玩家${self.currentPlayerId}可执行动作: `, player.actionCode);
            },
            onWaitOthersAction () {
                console.log('onWaitOthersAction');
                // 等1s，解决fsm的上一个transition还未完成就next的问题
                // TODO: 这个解决办法不是很好，考虑别的解决办法
                setTimeout(function () {
                    self._checkNextOthersAction();
                }, 1000);
            },
            onGameOver () {
                console.log('onGameOver');
                self._sendToPlayer(JSON.stringify(self._getGameState()));
                // self._sendToPlayer(JSON.stringify({msg:"游戏结束"}));
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

// 获取剩余可抽牌数
p._getCardRemain = function () {
    return this.cardCount;
};

// 初始化麻将牌相关数据
// 根据config.cheat决定是否使用作弊数据
p._resetCards = function () {
    this.cards = GU.shuffle([].concat(this.config.cards));
    this.config.cheat && (this.cards = Cheat.getCheatCards(this.config, this.config.cheat));
    this.topIdx = 0;
    this.bottomIdx = this.cards.length - 1;
    this.cardCount = this.cards.length;
};
/**
 * 清空玩家的actionCode、chiList和gangList
 * @param {String|Array.<String>|undefined} playerId - 需要情况的玩家id，若不传则清除所有玩家的可执行动作
 */
p._clearActionData = function (playerId) {
    let self = this, playerIds = playerId ? [].concat(playerId) : self.playerSequence;
    playerIds.forEach(playerId => self.players[playerId].clearActionData());
};

// 初始化方法
/**
 * 重置单局玩家数据
 */
p._resetPlayerData = function () {
    let self = this;
    this.playerSequence.forEach(playerId => self.players[playerId]._resetData());
};

/**
 * 发牌（按playerSequence顺序来轮流抽handCardCount张牌）
 */
p._dealCards = function () {
    let self = this;
    for (let i=0; i<this.config.handCardCount; i++) {
        this.playerSequence.forEach(playerId => self.players[playerId].handCards.push(self._getTopCard()));
    }
};

// 计算玩家可执行的动作
// 检查当前玩家能做什么动作，检测胡（自摸）、杠（暗杠、补杠）
p._updateCurrentPlayerAction = function () {
    let playerId = this.currentPlayerId,
        player = this.players[playerId]
        actionCode = 0;
    player.canHu(player.newCard) && (actionCode += ACTION_CODE.Hu);
    let gangList = player.retrieveGangList();
    gangList.length > 0 && (actionCode += ACTION_CODE.Gang, player.setGangList(gangList));
    player.setActionCode(actionCode);
    return player;
};
/**
 * 在当前玩家打出牌后，计算出其他玩家的可执行动作列表，以优先度排序
 */
// TODO: 以下方法名的retrieve我都觉得不合适，以后考虑改名
// TODO: 这里没有考虑一炮多响的情况
p._retrieveOthersActionList = function () {
    let currentPlayer = this.players[this.currentPlayerId],
        currentPlayCard = currentPlayer.playingCard,
        otherPlayerIds = this._getOtherPlayerIdsByOrder(),
        res = [];
    for (let playerId of otherPlayerIds) { // 分别统计出玩家的可执行动作码
        let actionCode = 0,
            player = this.players[playerId],
            r = {playerId};
        player.canHu(currentPlayCard) && (actionCode += ACTION_CODE.Hu);
        if (player.canGangCard(currentPlayCard, currentPlayer)) {
            actionCode += ACTION_CODE.Gang;
            r.gangList = [{actionCode:ACTION_CODE.MingGang, card:currentPlayCard}];
        }
        player.canPengCard(currentPlayCard, currentPlayer) && (actionCode += ACTION_CODE.Peng);
        let chiList = this._getNextPlayerId()===playerId ? player.retrieveChiList(currentPlayCard) : [];
        chiList.length > 0 && (actionCode += ACTION_CODE.Chi, r.chiList = chiList);
        if (actionCode > 0) {
            actionCode += ACTION_CODE.Pass; // 过 的actionCode
            r.actionCode = actionCode;
            res.push(r);
        }
    }
    // to check: 多个人胡且不能一炮多响时，能否按正确的顺序排序？
    // 按actionCode大小排序
    return res.sort((a, b) => b.actionCode-a.actionCode);
};

// 检查下一个其他玩家的可执行动作
// TODO: 感觉这个方法命名不好，耦合度很高，考虑优化
p._checkNextOthersAction = function () {
    let playerAction = this.othersActionList.shift();
    if (playerAction === undefined) { // 没有其他玩家可执行动作，进入下一回合
        this.fsm.next();
    } else {
        let player = this.players[playerAction.playerId];
        // TODO: 通知玩家更新界面状态（动作按钮状态更新）
        // TODO: 这里将gangList、chiList直接放在playerData感觉不够优雅
        player.setActionCode(playerAction.actionCode);
        player.setGangList(playerAction.gangList);
        player.setChiList(playerAction.chiList);
        this._sendToPlayer(JSON.stringify(this._getGameState()));
        console.log(`通知玩家: `, playerAction);
    }
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

// 关于通信
// TODO: 返回一对某玩家的游戏状态
p._getGameState = function (playerId) {
    let self = this;
    // 桌面数据应该是对所有玩家公开的
    let tableData = {
        cardRemain: this._getCardRemain(),
        currentPlayerId: this.currentPlayerId,
        state: this.fsm.state
    };
    // TODO: 玩家数据，本人数据公开，其他玩家数据屏蔽（屏蔽考虑加一个私有方法实现）
    let playerDatas = {};
    this.playerSequence.forEach(pid => playerDatas[pid] = self.players[pid].getData(false, true));
    return {tableData, playerDatas};
};

// 通知玩家信息
p._sendToPlayer = function (msg, playerId) {
    // TODO: 测试时，直接用this.socket
    Log.log(`send to ${playerId || 'all'}`, msg);
    // TODO: 暂时只返回给player1
    this.players[this.playerSequence[0]].socket.emit('news', msg);
};

// 实现Game的接口
// 开始游戏
p.start = function () {
    let self = this;
    return new Promise((resolve, reject) => {
        // TODO: 重置单局数据
        self.othersActionList = [];
        self.currentPlayerId = self.playerSequence[0];
        self._resetCards();
        self._resetPlayerData();
        // 发牌
        self._dealCards();
        // TODO: 通知发牌结果
        // 整理手牌
        for (let playerId in self.players) self.players[playerId].sortHandCard();
        // TODO: 通知整理手牌结果

        // 回合制游戏属性初始化
        this.turnCount = 0;

        // TODO: 进入等待当前玩家动作状态
        self.fsm.start();
        // self.state = self.STATE.WAIT_CURRENT_PLAYER_ACTION;
        resolve({'error': false, result: '游戏开始'});
    });
};
// 断线重连
p.reconnect = function (playerId, socket) {
    this.players[playerId].socket = socket;
    this._sendToPlayer(JSON.stringify(this._getGameState(playerId)), playerId);
};

// 玩家动作接口
// 玩家动作总接口
// TODO: 这里通过状态机统一验证player能否做action，然后再分别调用子action动作进行详细验证
p.doAction = function (playerId, action, data) {
    let message = '';
    // TODO: 缺少动作合法性判断（动作是否存在）
    // TODO: 这里的错误信息应该更详细
    if (this.fsm.is(STATE.WAIT_PLAYER_ACTION) && playerId !== this.currentPlayerId) {
        message = '在等待当前玩家动作时，非当前玩家请求动作';
    }
    if (this.fsm.is(STATE.WAIT_OHTERS_ACTION) && playerId === this.currentPlayerId) {
        if (playerId === this.currentPlayerId)
            message = '在等待其他玩家动作时，当前玩家请求动作';
        // to check: 此时this.othersActionList能确保有至少1个元素么？
        else if (playerId !== this.othersActionList[0].playerId)
            message = '在等待其他玩家动作时，非当前询问玩家请求动作';
    }
    if (this.fsm.cannot(action)) {
        message = '当前游戏状态下，玩家不可以执行该动作';
    }
    if (message) {
        return {'error': true, 'result': message};
    } else {
        // to check: 是否所有动作都能正确调用，及返回
        let res = this[action](playerId, data);
        if (res.error) {
            return res;
        } else {
            this.fsm[action](playerId);
            return res;
        }
    }
};
// 打出一张牌
p.playCard = function (playerId, cardIndex) {
    let message = '', player = this.players[playerId];
    // if (!this.inState(this.STATE.WAIT_CURRENT_PLAYER_ACTION)) {
    if (player.hasCardIndex(cardIndex)) {
        message = `玩家${playerId}手中没有第${cardIndex+1}张牌`;
    }
    if (message) { // 如果有message，意味着有错误
        return {'error': true, 'result': message};
    } else {
        player.playCard(cardIndex);
        player.sortHandCard();
        message = `玩家${playerId}打出${player.playingCard}`;
        return {'error': false, 'result': message};
    }
};
/**
 * 杠（明杠、暗杠、碰后杠）
 * @param {String} playerId - 玩家id
 * @param {Number} index - 第index种杠法
 */
p.gang = function (playerId, index) {
    let player = this.players[playerId],
        gangData = (player.gangList||[])[index],
        currentPlayer = this.players[this.currentPlayerId];
    if (gangData) {
        let actionCode = gangData.actionCode, card = gangData.card;
        if (actionCode === ACTION_CODE.PengHouGang) {
            // TODO: 碰后杠需要轮询确认是否有人抢杠
        }
        player.gangCard(card, actionCode, currentPlayer);
        // TODO: 应详细描述是什么杠，杠谁的什么牌
        return {'error': false, 'result': `玩家${playerId}杠${card}`};
    } else {
        return {'error': true, 'result': `玩家${playerId}不存在第${index}种杠法，playerData：${JSON.stringify(player.getData())}`};
    }
};
/**
 * 杠（明杠、暗杠、碰后杠）
 * @param {String} playerId - 玩家id
 */
p.peng = function (playerId) {
    let currentPlayer = this.players[this.currentPlayerId],
        card = currentPlayer.playingCard,
        player = this.players[playerId];
    if (player.actionCode&ACTION_CODE.Peng) {
        player.pengCard(card, currentPlayer);
        return {'error': false, 'result': `玩家${playerId}碰${card}玩家${this.currentPlayerId}打出的牌${card}`};
    } else {
        return {'error': true, 'result': `玩家${playerId}不满足碰的条件，当前玩家${this.currentPlayerId}打出牌${card}`};
    }
};
/**
 * 吃
 * @param {String} playerId - 玩家id
 * @param {Array.<Number>} index - 第index种吃法
 */
p.chi = function (playerId, index) {
    if (this._getNextPlayerId() !== playerId) {
        return {'error': true, 'result': `玩家非当前玩家的下家`};
    }
    let player = this.players[playerId],
        chiData = (player.chiList||[])[index],
        currentPlayer = this.players[this.currentPlayerId];
    if (chiData) {
        player.chi(chiData[0], chiData.slice(1), currentPlayer);
        return {'error': false, 'result': `玩家${playerId}吃玩家${this.currentPlayerId}打出的牌${chiData[0]}`};
    } else {
        return {'error': true, 'result': `玩家${playerId}不满足吃的条件，当前玩家${this.currentPlayerId}`};
    }
};

/**
 * 过
 * @param {String} playerId - 玩家id
 */
p.pass = function (playerId) {
    // 除了合法性检测不需要干别的事
    let player = this.players[playerId];
    if (player.actionCode&ACTION_CODE.Pass) {
        return {'error': false, 'result': `玩家${playerId}跳过，他当前可执行动作为${player.actionCode}`};
    } else {
        return {'error': true, 'result': `玩家${playerId}不可执行过动作`};
    }
};

/**
 * 胡
 * @param {String} playerId - 玩家id
 */
p.hu = function (playerId) {
    // 除了合法性检测不需要干别的事
    let player = this.players[playerId];
    if (player.actionCode&ACTION_CODE.Hu) {
        return {'error': false, 'result': `玩家${playerId}胡牌，他当前可执行动作为${player.actionCode}`};
    } else {
        return {'error': true, 'result': `玩家${playerId}不可执行过动作`};
    }
};

util.inherits(MahjongGame, Game);

module.exports = MahjongGame;