/**
 * 返回随机整型值
 */
var randomInt = exports.randomInt = function (min, max) {
    if (max == undefined) {
        max = min;
        min = 0;
    }
    return min + (Math.floor(Math.random() * (max - min + 1)));
}

/**
 * 返回打乱顺序后的数组
 * @param {Array.<any>} arr - 需要打乱顺序的数组
 * @return {Array.<any>}
 */
var shuffle = exports.shuffle = function (arr) {
    let len = arr.length, shuffled = Array(len);
    for (let i=0, rand; i<len; i++) {
        rand = randomInt(i);
        if (rand !== i) shuffled[i] = shuffled[rand];
        shuffled[rand] = arr[i];
    }
    return shuffled;
}

var deepCopy = exports.deepCopy = function (any) {
    return _deepCopy(any, []);
};

function _deepCopy(any, referenceList) {
    let ret = any;
    switch (typeof(any)) {
        case 'object':
            let ref = referenceList.find(r => r.oldRef===any);
            if (ref) {
                ret = ref.newRef;
                break;
            }
            ret = any instanceof Array ? [] : {};
            referenceList.push({oldRef: any, newRef: ret});
            for (let key in any) {
                ret[key] = _deepCopy(any[key], referenceList);
            }
        default:
            // just do nothing
    }
    return ret;
}

var findPatternInArray = exports.findPatternInArray = function (arr, pattern) {
    
};

/**
 * 统计字符串或数组中每个字符/元素的出现次数
 * @param {String|Array.<Number|String>} stringOrArray - 待统计的字符串或数组
 * @return {Object} - 以元素名为key，出现次数为value的键值对对象
 */
var countWord = exports.countWord = function (stringOrArray) {
    return (typeof(stringOrArray)=='string'?stringOrArray.split(''):stringOrArray)
        .reduce((pre, cur) => (pre[cur]++ || (pre[cur]=1), pre), {});
};

// 构造方法
// todo: 限时任务（使用setTimeout实现）
var TimeLimitTask = exports.TimeLimitTask = function () {
    
};

var objFilter = exports.objFilter = function (obj, fn) {
    let result = [];
    for (let key in obj) {
        if (fn(obj[key], key)) result.push({key, value: obj[key]});
    }
    return result;
};