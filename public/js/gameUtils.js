/**
 * 保证前后端通用
 */
(function (exports) {
    // 抄自jQuery
    const class2type = {"[object Boolean]":"boolean","[object Number]":"number","[object String]":"string","[object Function]":"function","[object Array]":"array","[object Date]":"date","[object RegExp]":"regexp","[object Object]":"object","[object Error]":"error"};
    const hasOwn = ({}).hasOwnProperty;
    /**
     * 返回随机整型值
     */
    var randomInt = exports.randomInt = function (min, max) {
        if (max == undefined) {
            max = min;
            min = 0;
        }
        return min + (Math.floor(Math.random() * (max - min + 1)));
    };

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
    };

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
    // TODO: 限时任务（使用setTimeout实现）
    var TimeLimitTask = exports.TimeLimitTask = function () {
        
    };

    var objFilter = exports.objFilter = function (obj, fn) {
        let result = [];
        for (let key in obj) {
            if (fn(obj[key], key)) result.push({key, value: obj[key]});
        }
        return result;
    };

    // 将输入的对象压缩，并输出压缩后的对象
    // 最多只支持3906（62+62*62）个不同的key值
    class JsonCompressor {
        constructor () {
            this._compressMap = new Map;
            this._uncompressMap = new Map;
            this._newKeyList = [];
        }
        /**
         * 压缩所给的json，返回压缩后的json及对应的解压映射表
         * 应注意输入json必须为plainObject
         * @param {Object} json - 待压缩json
         * @return {Object}
         */
        compress (json) {
            if (!isPlainObject(json)) return json;
            let compressedJson = {}, // 压缩后的json
                newKeyList = []; // 未出现过的key列表
            for (let key in json) {
                let compressedKey = "";
                if (this._compressMap.has(key)) {
                    compressedKey = this._compressMap.get(key);
                } else {
                    newKeyList.push(key);
                    compressedKey = this._getNextCompressKey();
                    this._compressMap.set(key, compressedKey);
                    this._uncompressMap.set(compressedKey, key);
                }
                compressedJson[compressedKey] = this.compress(json[key]);
            }
            this._newKeyList = this._newKeyList.concat(newKeyList);
            return compressedJson;
        }
        /**
         * 将json转换为压缩字符串
         */
        toCompressString (json) {
            if (!isPlainObject(json)) return JSON.stringify(json);
            let res = "{";
            for (let key in json) {
                res += `${key}:${this.toCompressString(json[key])},`;
            }
            return res.substr(0, res.length-1) + "}";
        }
        /**
         * 解压所给的json
         */
        uncompress (json) {
            if (!isPlainObject(json)) return json;
            let uncompressedJson = {}
            for (let key in json) {
                let uncompressedKey = this._uncompressMap.has(key) ? this._uncompressMap.get(key) : key;
                uncompressedJson[uncompressedKey] = this.uncompress(json[key]);
            }
            return uncompressedJson;
        }
        /**
         * 从压缩json字符串转换为json
         */
        fromCompressString (str) {
            let jsonStr = str.replace(/'/g,'"').replace(/[{,]{1}[^":,]+:/g, function (str) {
                return str[0] + '"' + str.substr(1, str.length-2) + '"' + str[str.length-1];
            });
            return JSON.parse(jsonStr);
        }
        /**
         * 导入解压映射表
         */
        importUncompressMap (uncompressMap) {
            for (let compressedKey in uncompressMap) {
                let key = uncompressMap[compressedKey];
                this._compressMap.set(key, compressedKey);
                this._uncompressMap.set(compressedKey, key);
            }
        }
        /**
         * 导出解压映射表
         * @param {Boolean} fullList - 是否导出整张映射表（否时，只返回未导出过的部分）
         * @return {Objecet} - 解压映射表，json格式
         */
        exportUncompressMap (fullList = false) {
            if (fullList) {
                this._newKeyList = [];
                return map2Json(this._uncompressMap);
            } else {
                let json = {};
                for (let key of this._newKeyList) json[key] = this._compressMap.get(key);
                this._newKeyList = [];
                return json;
            }
        }
        // 根据当前已生成压缩key值数量获取下一个压缩key值
        _getNextCompressKey () {
            let nextKey = "", alphabet = JsonCompressor._alphabet;
            if (alphabet.length <= this._compressMap.size) {
                nextKey += alphabet[~~(this._compressMap.size/alphabet.length)-1];
            }
            nextKey += alphabet[this._compressMap.size%alphabet.length];
            return nextKey;
        }
    }
    JsonCompressor._alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    exports.JsonCompressor = JsonCompressor;

    /**
     * 抄自jQuery.isPlainObject，有所修改
     * Description: Check to see if an object is a plain object (created using "{}" or "new Object").
     */
    var isPlainObject = exports.isPlainObject = function (obj) {
        var key;
        // Must be an Object.
        // Because of IE, we also have to check the presence of the constructor property.
        // Make sure that DOM nodes and window objects don't pass through, as well
        if ( !obj || type(obj) !== "object" || obj.nodeType ) {
            return false;
        }
        try {
            // Not own constructor property must be Object
            if ( obj.constructor &&
                !hasOwn.call(obj, "constructor") &&
                !hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
                return false;
            }
        } catch ( e ) {
            // IE8,9 Will throw exceptions on certain host objects #9897
            return false;
        }
        // Own properties are enumerated firstly, so to speed up,
        // if last one is own, then all properties are own.
        for ( key in obj ) {}

        return key === undefined || hasOwn.call( obj, key );
    };

    /**
     * 抄自jQuery.type
     * 用于获取对象类型
     */
    var type = exports.type = function (obj) {
        if ( obj == null ) {
            return obj + "";
        }
        return typeof obj === "object" || typeof obj === "function" ?
            class2type[ toString.call(obj) ] || "object" :
            typeof obj;
    };

    var map2Json = exports.map2Json = function (map) {
        let json = {};
        for (let [k,v] of map) json[k] = v;
        return json;
    }
}(typeof(window) == "undefined" ? exports : window))