类的设置：
房间基类    派生    麻将房间基类    派生    xx麻将房间类
游戏基类    派生    麻将游戏基类    派生    xx麻将游戏类

一个房间对象有一个游戏对象
一个游戏对象仅负责处理单局游戏
当单局游戏需要受到历史游戏数据影响时，应通过游戏对象初始化时传入参数
游戏对象结束时返回游戏结果给房间对象，由房间对象处理这些结果（修改玩家分数、存数据库等）

关于注释
有 TODO: 字样为待完成的部分
有 to check: 字样为待检验部分

一些设计思路
1、
所有接口应返回promise对象
成功与否都返回形如以下格式的对象
调用成功
{
    'error': false,
    'result': 'any type data'
}
调用失败
{
    'error': true,
    'result': 'error message'
}

2、
一些接口如 startGame 一般有两部分，即判断是否可以执行与执行部分，
   此时应加入一个 _startGame 用于执行，而startGame主要用于判断是否可以执行，
   若可以，则调用_startGame来执行


3、
游戏中的状态及转换

初始 init
等待当前玩家动作 waitPlayerAction
等待其他玩家动作 waitOthersAction
结束 over

等待当前玩家动作 ----------------------------------> 等待当前玩家动作

等待当前玩家动作 ----------------------------------> 等待其他玩家动作

等待其他玩家动作 ----------------------------------> 等待当前玩家动作

4、
游戏同步机制采用状态同步，接收到玩家的动作后，服务器返回新的状态，客户端根据状态进行渲染
应尽量减少传输的信息

规定 胡（点炮、自摸）、杠（暗杠、明杠、碰后杠）、碰、吃、过，如下（在mahjongGame.js中定义ActionCode枚举对象）：
自摸：128
点炮：64
胡：192（128+64）
暗杠：32
明杠：16
碰后杠：8
杠：56（32+16+8）
碰：4
吃：2
过：1

如255表示胡、杠、碰、吃、过5个动作ui都显示，255在注释中取名“可执行动作码”，变量命名为actionCode
特殊的，如吃动作，有额外数据（可吃的组合列举）以另外的数据结构传递

5、
玩家数据结构
{
    handCards: Array.<Number>, // 手牌数组，手牌指除去已组合的牌、刚摸到的牌外的牌
    playedCards: Array.<Number>, // 已打出的牌（指未被吃碰杠胡的，完全被打出的牌）
    playCard: Number, // 当前打出的牌（等待其他玩家是否吃碰杠胡）
    newCard: Number, // 刚摸到的牌
    groupCards: Array.<Object>, // 吃碰杠后的组合好的牌
}

6、
动作数据结构
胡
{
    actionCode: Number, // 128|64
    card: Number,
    from: String
}
杠
{
    actionCode: Number, // 32|16|8
    card: Number,
    from: String
}
碰
{
    actionCode: Number, // 4
    card: Number,
    from: String
}
吃
{
    actionCode: Number, // 2
    card: Number, // 应为长度为3的数组，第一个元素为吃的牌
    from: String
}
过
{
    actionCode: Number // 1
}

7、
麻将牌对应号码
一万~九万：11~19
一条~九条：31~39
一筒~九筒：51~59
东南西北：70、73、76、79
中发白：90、93、96
背面：99

8、
玩家状态的完整结构（以后考虑将key、value简化压缩）
{
    actionCode: Number,
    groupCards: Array.<Object>, // TODO: 下面详细解释
    handCards: Array.<Number>,
    newCard: Number|undefined,
    playCard: Number|undefined
}

9、
返回前端消息结构
{
    tableData: {
        cardRemain: Number,
        currentPlayerId: String,
        state: String
    },
    playerDatas: {
        "玩家1id" : 玩家状态对象
    }
}