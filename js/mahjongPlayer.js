const GU = require('./gameUtils.js');
const {ActionCode, CARD} = require('./mahjongConstants.js');
const checkHu = require('./checkHu.js');

var MahjongPlayer = function (user) {
    this.id = user.id;
    this.socket = user.socket;
};

p = MahjongPlayer.prototype;
// 重置数据
p._resetData = function () {
    this.actionCode = 0;
    this.handCards = [];
    this.playedCards = [];
    this.playingCard = undefined;
    this.newCard = undefined;
    this.groupCards = [];
    this.chiList = undefined;
    this.gangList = undefined;
};

/**
 * 获取玩家数据
 * @param {Boolean} needMask - 是否需要屏蔽（对别人不可见的牌）
 */
p.getData = function (needMask) {
    return {
        id: this.id,
        actionCode: needMask ? ActionCode.None : this.actionCode,
        handCards: needMask ? this.handCards.concat().fill(CARD.BACK) : this.handCards,
        playedCards: this.playedCards,
        playingCard: this.playingCard,
        newCard: this.newCard ? (needMask ? CARD.BACK : this.newCard) : this.newCard,
        groupCards: this.groupCards,
        chiList: needMask ? undefined : this.chiList,
        gangList: needMask ? undefined : (this.gangList||[]).map(g => g.card) // 客户端不需要知道这个是哪种杠（真的不需要吗？）
    };
};
// 清除玩家动作数据（包括actionCode、chiList、gangList）
p.clearActionData = function () {
    this.actionCode = 0;
    // TODO: 把chiList放在这里真的很不好，考虑解决
    this.chiList = undefined;
    this.gangList = undefined;
};
// 玩家动作
/**
 * 玩家抽卡
 */
p.drawCard = function (card) {
    this.newCard = card;
};
/**
 * 玩家杠后抽牌
 */
p.drawGangCard = function (card) {
    this.newCard = card;
}
/**
 * 玩家打出一张牌
 * @param {Number} cardIndex - 卡牌序数
 */
p.playCard = function (cardIndex) {
    let playNewCard = cardIndex==this.handCards.length, // 打出的是否新摸到的牌
        card = playNewCard ? this.newCard : this.handCards[cardIndex]; // 打出的牌
    playNewCard ? this.newCard = undefined : this.handCards.splice(cardIndex, 1); // 从手牌/摸牌中去掉打出的牌
    this.playingCard = card; // 设置打出的牌
};

/**
 * 玩家杠牌
 * @param {Number} card - 杠的牌
 * @param {Number} actionCode - 动作码
 * @param {MahjongPlayer} [currentPlayer] - 当前打出牌的玩家对象（仅当明杠时用到该值）
 */
p.gangCard = function (card, actionCode, currentPlayer) {
    let handCards = this.handCards,
        from = this.id; // 默认来自自己（暗杠、碰后杠）
    // TODO: 其实明杠是没必要整理手牌的，考虑优化
    this.sortHandCard(); // 先整理手牌
    switch (actionCode) {
        case ActionCode.AnGang:
            handCards.splice(handCards.indexOf(card), 4); // 去掉自己的4张手牌
            this.groupCards.push({actionCode, card, from}); // 组合牌中加入杠的数据
            break;
        case ActionCode.MingGang:
            from = currentPlayer.id; // 牌来自当前打出牌的玩家
            handCards.splice(handCards.indexOf(card), 3); // 去掉自己的3张手牌
            currentPlayer.playingCard = undefined; // 将当前玩家打出的牌去掉
            this.groupCards.push({actionCode, card, from}); // 组合牌中加入杠的数据
            break;
        case ActionCode.PengHouGang:
            handCards.splice(handCards.indexOf(card), 1); // 去掉自己的1张手牌
            // 找到碰的数据，并将其改造为碰后杠数据
            let pengGroupCard = this.groupCards.find(gc => gc.actionCode===ActionCode.Peng && gc.card===card);
            pengGroupCard.actionCode = ActionCode.PengHouGang;
            break;
    }
};

/**
 * 玩家碰
 * @param {Number} card - 碰的牌
 * @param {MahjongPlayer} currentPlayer - 当前打出牌的玩家对象
 */
p.pengCard = function (card, currentPlayer) {
    let handCards = this.handCards,
        from = currentPlayer.id;
    handCards.splice(handCards.indexOf(card), 2); // 去掉自己的2张手牌
    currentPlayer.playingCard = undefined; // 将当前玩家打出的牌去掉
    this.groupCards.push({actionCode: ActionCode.Peng, card: card, from}); // 组合牌中加入碰的数据
};

/**
 * 玩家吃
 * @param {Number} card - 吃的牌
 * @param {Array.<Number>} twoHandCards - 长度为2的数组，表示玩家吃牌的2张手牌
 * @param {MahjongPlayer} currentPlayer - 当前打出牌的玩家对象
 */
p.chi = function (card, twoHandCards, currentPlayer) {
    let handCards = this.handCards,
        from = currentPlayer.id;
    twoHandCards.forEach(c => handCards.splice(handCards.indexOf(c), 1)); // 去掉2张手牌
    currentPlayer.playingCard = undefined; // 将当前玩家打出的牌去掉
    this.groupCards.push({actionCode: ActionCode.Chi, card: [card].concat(twoHandCards), from}); // 组合牌中加入吃的数据
};

// 动作执行合法性判断
// 判胡
p.canHu = function (card) {
    return checkHu(this, this.config, card);
};
// TODO: canGangCard 和 canPengCard 代码有大部分重复，考虑是否合并

/**
 * 检查玩家是否能杠某张牌
 * @param {Number} card - 杠的牌
 * @param {MahjongPlayer} currentPlayer - 当前打出牌的玩家对象
 * @return {false|Number} - 不能杠返回false，能杠返回可以杠的ActionCode
 */
p.canGangCard = function (card, currentPlayer) {
    let isCurrentPlayer = currentPlayer.id === this.id,
        handCards = isCurrentPlayer ? this.sortHandCard(true) : this.handCards, // 对于当前玩家，需要将手牌和摸到的牌合并再检测
        needCount = isCurrentPlayer ? 4 : 3; // 需要找到多少张牌
    if (isCurrentPlayer) { // 对于当前玩家，查找是否有碰了这牌，且他自己有这张牌（碰后杠的情况）
        let groupCard = this.groupCards.find(gc => gc.type===ActionCode.Peng && gc.card===card);
        if (groupCard && handCards.includes(card)) return ActionCode.PengHouGang;
    } else { // 非当前玩家，需要判断当前玩家是否打出card这张牌，若不是，直接判错
        if (currentPlayer.playingCard !== card) return false;
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

/**
 * 检查玩家是否能碰某张牌
 * @param {Number} card - 杠的牌
 * @param {MahjongPlayer} currentPlayer - 当前打出牌的玩家对象
 * @return {Boolean} - 能否碰
 */
p.canPengCard = function (card, currentPlayer) {
    let handCards = this.handCards;
    if (currentPlayer.playingCard !== card) return false; // 当前玩家不是打出card这张牌，直接判错
    // to check: 约定玩家手牌已排序
    for (let i = handCards.length; i--; ) {
        if (handCards[i] < card) return false;
        if (handCards[i] === card) return handCards[i-1] === card;
    }
    return false;
};

/**
 * 获取玩家能吃的组合
 * @param {Number} card - 吃的牌
 * @return {Array.<Array.<Number>>} - 形如 [[2,1,3],[2,3,4]] 每个数组元素中的第一个数字为吃的牌
 */
p.retrieveChiList = function (card) {
    let handCards = this.handCards,
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
/**
 * 获取玩家能暗杠/碰后杠的牌
 * @return {Array.<Object>} - 形如 [{actionCode:32,card:5}]
 */
p.retrieveGangList = function () {
    let cardCount = GU.countWord(this._getAllHandCards()), // 统计出手中各牌的数量
        result = GU.objFilter(cardCount, count => count==4).map(kvp => ({actionCode:ActionCode.AnGang, card:kvp.key*1})); // 手上有4张的牌
    // 考虑碰后杠
    return result.concat(this.groupCards.filter(gc => gc.actionCode===ActionCode.Peng && cardCount[gc.card]).map(gc => ({actionCode:ActionCode.PengHouGang, card:gc.card, from:gc.from})));
};
// 判断玩家是否存在某index的卡牌
p.hasCardIndex = function (cardIndex) {
    let allHandCardCount = this.handCards.length + (this.newCard ? 1 : 0); // 获取手牌+（可能存在）新摸到的牌总数
    return cardIndex < 0 || cardIndex >= allHandCardCount;
};
// 整理手牌（如有newCard，则将newCard也整理进手牌中）
// TODO: 效率有待改进
p.sortHandCard = function (clone = false) {
    let res = clone ? this.handCards.concat() : this.handCards;
    if (this.newCard) {
        res.push(this.newCard);
        this.newCard = undefined;
    }
    res.sort();
    return res;
};
// 获取所有手牌（包括newCard）
p._getAllHandCards = function (sort = false) {
    if (sort) {
        return p.sortHandCard(true);
    } else {
        let allHandCards = [].concat(this.handCards);
        this.newCard !== undefined && allHandCards.push(this.newCard);
        return allHandCards;
    }
};

module.exports = MahjongPlayer;