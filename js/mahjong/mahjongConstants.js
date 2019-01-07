/**
 * 本文件存储麻将中的常量信息
 */
// 可执行动作码
const ACTION_CODE = {
    ZiMo: 128, // 自摸
    DianPao: 64, // 点炮
    Hu: 192, // 胡
    AnGang: 32, // 暗杠
    MingGang: 16, // 明杠
    PengHouGang: 8, // 碰后杠
    Gang: 56, // 杠
    Peng: 4, // 碰
    Chi: 2, // 吃
    Pass: 1, // 过
    None: 0 // 无动作
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

// 麻将牌
const CARD = {
    NONE: 100 // 背面
};

// 玩家数据
const PLAYER_STATE = {
    ID: 1,
    ACTION_CODE: 2,
    HAND_CARDS: 3,
    PLAYED_CARDS: 4,
    PLAYING_CARD: 5,
    NEW_CARD: 6,
    GROUP_CARDS: 7,
    CHI_LIST: 8,
    GANG_LIST: 9
}

module.exports = {
    ACTION_CODE,
    WaitTimeLimit,
    STATE,
    CARD,
    PLAYER_STATE
};