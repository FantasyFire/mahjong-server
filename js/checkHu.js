const {ActionCode, STATE} = require('./mahjongConstants.js');

/**
 * 这里只做最简单的判胡
 * @param {Object} playerData - 玩家数据
 * @param {Object} gameConfig - 游戏配置信息
 * @param {Number} huCard - 胡的牌
 */
function checkHu(playerData, gameConfig, huCard) {
    let cards = playerData.handCards.concat(huCard).sort();
    return _checkHu3np2(cards);
}

function _checkHu3np2(cards) {
    let i, checked = {}, len = cards.length, useda;
    for (i = 0; i < len; i++) {
        let c = cards[i];
        if (!checked[c]) {
            checked[c] = true;
            useda = Array(len).fill(0);
            // 先找一对将
            if (cards[i+1]==c) {
                useda[i] = useda[i+1] = 1;
            } else { // 不能做将，跳过继续找
                continue;
            }
            // 看剩下的牌能否成胡
            if (_checkHu3n(cards, useda)) return true;
        }
    }
    return false;
}

function _checkHu3n(cards, useda) {
    let si = useda.findIndex(u => !u);
    if (si == -1) return true;
    let tuseda = [].concat(useda);
    if (_find123(cards, tuseda, si)) return _checkHu3n(cards, tuseda);
    if (_find111(cards, tuseda, si)) return _checkHu3n(cards, tuseda);
    return false;
}

// 尝试找到顺子
function _find123(cards, useda, si) {
    let i2 = si+1, i3, c = cards[si];
    while (useda[i2] && cards[i2]==c) i2++;
    if (cards[i2] != c+1) return false;
    i3 = i2+1;
    while (useda[i3] && cards[i3]==c+1) i3++;
    if (cards[i3] != c+2) return false;
    useda[si] = useda[i2] = useda[i3] = 1;
    return true;
}

// 尝试找到刻子
function _find111(cards, useda, si) {
    if (cards[si+2] != cards[si]) return false;
    useda[si] = useda[si+1] = useda[si+2] = 1;
    return true;
}

module.exports = checkHu;