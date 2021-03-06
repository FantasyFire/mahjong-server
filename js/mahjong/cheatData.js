const GU = require('../gameUtils.js');

// 作弊数据
let cheat = [];
// 1：暗杠
cheat[1] = {
    p1:[32,11,11,51,51,51],
    p2:[32,32,11],
    head: [51]
};
// 2：碰后杠
cheat[2] = {
    p1:[11,11],
    p2:[11],
    head:[14,15,16,16,17,11]
};
// 3：吃
cheat[3] = {
    p1:[11,12,13],
    p2:[11,12,13,14,15]
};
// 4：同时可吃可碰
cheat[4] = {
    p1:[11,11],
    p2:[11],
    p3:[12,13]
};
// 5：明杠
cheat[5] = {
    p1:[11],
    p2:[11,11,11]
};
// 6：判胡
cheat[6] = {
    p1: [11,12,13,13,13,13,15,15,15,53,53,53,70,70]
}

// 返回第index组作弊卡序
exports.getCheatCards = function (gameConfig, index) {
    let cheatData = cheat[index];
    let cards = GU.shuffle([].concat(gameConfig.cards));
    // 默认值
    cheatData = {p1:[],p2:[],p3:[],p4:[],head:[],tail:[],...cheatData};
    let cheatIdx = []; // 作弊的牌不能被替换
    // 4个玩家的初始牌
    for (let i = 1; i <= 4; i++) {
        cheatData[`p${i}`].forEach((c, idx) => safeFindAndSwap(idx*4+(i-1), c, cheatIdx, cards));
    }
    // 发牌后摸的牌
    let si = gameConfig.handCardCount * gameConfig.needPlayerCount;
    cheatData.head.forEach((c, idx) => safeFindAndSwap(si+idx, c, cheatIdx, cards));
    // TODO: 鬼牌尚未实现，具体规则未定，这里当做是杠牌
    // 末尾的牌（杠牌、鬼牌...）
    cheatData.tail.forEach((c, idx) => safeFindAndSwap(-idx-1, c, cheatIdx, cards));

    return cards;
};

// 从cards中找到不在cheatIdx中的card，并与swapIdx1交换位置
function safeFindAndSwap(swapIdx1, card, cheatIdx, cards) {
    // 负数认为是倒数第n张的意思
    if (swapIdx1 < 0) swapIdx1 = cards.length + swapIdx1;
    let swapIdx2 = -1;
    do {
        swapIdx2 = cards.indexOf(card, swapIdx2+1);
    }
    while (swapIdx2 != -1 && cheatIdx.includes(swapIdx2))
    if (swapIdx2 == -1) {
        console.error(`作弊数据出错，找不到需要的牌${c}`);
    } else {
        // 交换位置
        let temp = cards[swapIdx1];
        cards[swapIdx1] = cards[swapIdx2];
        cards[swapIdx2] = temp;
        cheatIdx.push(swapIdx1);
    }
}