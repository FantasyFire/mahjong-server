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