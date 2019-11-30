// =========
// = humps =
// =========
// Underscore-to-camelCase converter (and vice versa)
// for strings and object keys

// humps is copyright © 2012+ Dom Christie
// Released under the MIT license.


;(function(global) {

  var _processKeys = function(convert, obj, options) {
    if(!_isObject(obj) || _isDate(obj) || _isRegExp(obj) || _isBoolean(obj) || _isFunction(obj)) {
      return obj;
    }

    var output,
        i = 0,
        l = 0;

    if(_isArray(obj)) {
      output = [];
      for(l=obj.length; i<l; i++) {
        output.push(_processKeys(convert, obj[i], options));
      }
    }
    else {
      output = {};
      for(var key in obj) {
        if(Object.prototype.hasOwnProperty.call(obj, key)) {
          output[convert(key, options)] = _processKeys(convert, obj[key], options);
        }
      }
    }
    return output;
  };
  var commonInitialisms = ['API', 'ASCII', 'CPU', 'CSS', 'DNS', 'EOF', 'GUID', 'HTML', 'HTTP', 'HTTPS', 'ID', 'IP', 'JSON', 'LHS', 'QPS', 'RAM', 'RHS', 'RPC', 'SLA', 'SMTP', 'SSH', 'TLS', 'TTL', 'UID', 'UI', 'UUID', 'URI', 'URL', 'UTF8', 'VM', 'XML', 'XSRF', 'XSS'];

  // String conversion methods

  var separateWords = function(string, options) {
    options = options || {};
    var separator = options.separator || '_';
    var words = [];
    var firstSegment = split(string);
    for(var i = 0,len = firstSegment.length; i < len; i++){
      if (/[A-Z0-9]+$/.test(firstSegment[i])) {
        var secondSegment = segment(firstSegment[i], commonInitialisms, getWindowSize(commonInitialisms));
        words.push(secondSegment);
      } else {
        words.push(firstSegment[i]);
      }
    }
    return words.join(separator);
  };

  function getWindowSize(wordsDict) {
    var maxWordLen = 0;
    wordsDict.forEach(function (word, index) {
      if (word.length > maxWordLen)
        maxWordLen = word.length;
    });
    return maxWordLen;
  }

  // segment all upper case words which join by word in commonInitialisms, like 'CPUUUID' to ['CPU', 'UUID']
  // using Maximum Matching algorithm, based on https://blog.csdn.net/Elenore1997/article/details/83274720
  function segment(sentence, wordsDict, windowSize) {
    var sentenceLen = sentence.length;
    var index = 0;
    var result = [];
    while (index <= sentenceLen){
      var match =false;
      for (var i = windowSize; i > 0; i--) {
        var subStr = sentence.substring(index,index+i);
        if (wordsDict.indexOf(subStr) !== -1) {
          match = true;
          result.push(subStr);
          index += i;
          break;
        }
      }
      if (!match) {
        result.push(sentence[index]);
        index += 1;
      }
    }
    return result;
  }

  // smart split camelCase string, like 'userIDName' to ['user', 'ID', 'Name']
  function split(string) {
    var upperCaseBreakPoint = false;
    var lowerCaseChr = [];
    var upperCaseChr = [];
    var segment = [];
    for (i = 0; i < string.length; i++) {
      var chr = string.charAt(i);
      // lower case character or number
      if (/[a-z0-9]/.test(chr)) {
        if (upperCaseBreakPoint) {
          if (upperCaseChr.length > 0 ) {
            var temp = upperCaseChr.slice(0, upperCaseChr.length-1);
            if (temp.length > 0 ) {
              segment.push(temp.join(''));
            }
            lowerCaseChr.push(upperCaseChr.slice(-1));
            upperCaseChr = [];
          }
        }
        upperCaseBreakPoint = false;
        lowerCaseChr.push(chr);
      } else {
        // upper case character or number
        upperCaseBreakPoint =true;
        if (lowerCaseChr.length > 0 ) {
          segment.push(lowerCaseChr.join(''));
          lowerCaseChr = [];
        }
        upperCaseChr.push(chr);
      }
    }
    if (upperCaseChr.length > 0) {
      segment.push(upperCaseChr.join(''));
    }
    if (lowerCaseChr.length > 0) {
      segment.push(lowerCaseChr.join(''));
    }
    return segment;
  }

  var camelize = function(string) {
    if (_isNumerical(string)) {
      return string;
    }
    // not to camel words in commonInitialisms, like user_id to userID
    var words = string.split('_')
    if (words.length > 1) {
      return words
          .map((word, index) => {
            if (index === 0) {
              return word.toLowerCase();
            }
            if (commonInitialisms.indexOf(word.toUpperCase()) !== -1) {
              return word.toUpperCase();
            }
            return word.substr(0, 1).toUpperCase() + word.substr(1);
          })
          .join('');
    }
    return string.toLowerCase();
  };

  var pascalize = function(string) {
    var camelized = camelize(string);
    // Ensure 1st char is always uppercase
    return camelized.substr(0, 1).toUpperCase() + camelized.substr(1);
  };

  var decamelize = function(string, options) {
    return separateWords(string, options).toLowerCase();
    // var patten = /([a-z0-9]+)([A-Z0-9]*)?([A-Z][a-z0-9]+)|([a-z0-9]+)([A-Z0-9]*)?/
    // var group = string.match(patten)
  };

  // Utilities
  // Taken from Underscore.js

  var toString = Object.prototype.toString;

  var _isFunction = function(obj) {
    return typeof(obj) === 'function';
  };
  var _isObject = function(obj) {
    return obj === Object(obj);
  };
  var _isArray = function(obj) {
    return toString.call(obj) == '[object Array]';
  };
  var _isDate = function(obj) {
    return toString.call(obj) == '[object Date]';
  };
  var _isRegExp = function(obj) {
    return toString.call(obj) == '[object RegExp]';
  };
  var _isBoolean = function(obj) {
    return toString.call(obj) == '[object Boolean]';
  };

  // Performant way to determine if obj coerces to a number
  var _isNumerical = function(obj) {
    obj = obj - 0;
    return obj === obj;
  };

  // Sets up function which handles processing keys
  // allowing the convert function to be modified by a callback
  var _processor = function(convert, options) {
    var callback = options && 'process' in options ? options.process : options;

    if(typeof(callback) !== 'function') {
      return convert;
    }

    return function(string, options) {
      return callback(string, convert, options);
    }
  };

  var humps = {
    camelize: camelize,
    decamelize: decamelize,
    pascalize: pascalize,
    depascalize: decamelize,
    camelizeKeys: function(object, options) {
      return _processKeys(_processor(camelize, options), object);
    },
    decamelizeKeys: function(object, options) {
      return _processKeys(_processor(decamelize, options), object, options);
    },
    pascalizeKeys: function(object, options) {
      return _processKeys(_processor(pascalize, options), object);
    },
    depascalizeKeys: function () {
      return this.decamelizeKeys.apply(this, arguments);
    }
  };

  if (typeof define === 'function' && define.amd) {
    define(humps);
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = humps;
  } else {
    global.humps = humps;
  }

})(this);
