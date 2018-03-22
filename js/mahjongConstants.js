/**
 * 本文件存储麻将中的常量信息
 */
// 可执行动作码
const ActionCode = {
    ZiMo: 128, // 自摸
    DianPao: 64, // 点炮
    Hu: 192, // 胡
    AnGang: 32, // 暗杠
    MingGang: 16, // 明杠
    PengHouGang: 8, // 碰后杠
    Gang: 56, // 杠
    Peng: 4, // 碰
    Chi: 2, // 吃
    Pass: 1 // 过
};

// 等待玩家时限
const WaitTimeLimit = {
    ACTION: 15000, // 15s
};

// 游戏状态
const STATE = {
    NONE: 'none',
    WAIT_PLAYER_ACTION: 'waitPlayerAction',
    WAIT_OHTERS_ACTION: 'waitOthersAction',
    GAME_OVER: 'gameOver'
};

module.exports = {
    ActionCode
};