/**
 * Sinon.JS 1.17.2, 2015/10/21
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @author Contributors: https://github.com/cjohansen/Sinon.JS/blob/master/AUTHORS
 *
 * (The BSD License)
 *
 * Copyright (c) 2010-2014, Christian Johansen, christian@cjohansen.no
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright notice,
 *       this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright notice,
 *       this list of conditions and the following disclaimer in the documentation
 *       and/or other materials provided with the distribution.
 *     * Neither the name of Christian Johansen nor the names of his contributors
 *       may be used to endorse or promote products derived from this software
 *       without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Sinon core utilities. For internal use only.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
var sinon = (function () {
  "use strict";
  // eslint-disable-line no-unused-vars

  var sinonModule;
  var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

  function loadDependencies(require, exports, module) {
    sinonModule = module.exports = require("./sinon/util/core");
    require("./sinon/extend");
    require("./sinon/walk");
    require("./sinon/typeOf");
    require("./sinon/times_in_words");
    require("./sinon/spy");
    require("./sinon/call");
    require("./sinon/behavior");
    require("./sinon/stub");
    require("./sinon/mock");
    require("./sinon/collection");
    require("./sinon/assert");
    require("./sinon/sandbox");
    require("./sinon/test");
    require("./sinon/test_case");
    require("./sinon/match");
    require("./sinon/format");
    require("./sinon/log_error");
  }

  if (isAMD) {
    define(loadDependencies);
  } else if (isNode) {
    loadDependencies(require, module.exports, module);
    sinonModule = module.exports;
  } else {
    sinonModule = {};
  }

  return sinonModule;
}());

/**
 * @depend ../../sinon.js
 */
/**
 * Sinon core utilities. For internal use only.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
(function (sinonGlobal) {

  var div = typeof document !== "undefined" && document.createElement("div");
  var hasOwn = Object.prototype.hasOwnProperty;

  function isDOMNode(obj) {
    var success = false;

    try {
      obj.appendChild(div);
      success = div.parentNode === obj;
    } catch (e) {
      return false;
    } finally {
      try {
        obj.removeChild(div);
      } catch (e) {
        // Remove failed, not much we can do about that
      }
    }

    return success;
  }

  function isElement(obj) {
    return div && obj && obj.nodeType === 1 && isDOMNode(obj);
  }

  function isFunction(obj) {
    return typeof obj === "function" || !!(obj && obj.constructor && obj.call && obj.apply);
  }

  function isReallyNaN(val) {
    return typeof val === "number" && isNaN(val);
  }

  function mirrorProperties(target, source) {
    for (var prop in source) {
      if (!hasOwn.call(target, prop)) {
        target[prop] = source[prop];
      }
    }
  }

  function isRestorable(obj) {
    return typeof obj === "function" && typeof obj.restore === "function" && obj.restore.sinon;
  }

  // Cheap way to detect if we have ES5 support.
  var hasES5Support = "keys" in Object;

  function makeApi(sinon) {
    sinon.wrapMethod = function wrapMethod(object, property, method) {
      if (!object) {
        throw new TypeError("Should wrap property of object");
      }

      if (typeof method !== "function" && typeof method !== "object") {
        throw new TypeError("Method wrapper should be a function or a property descriptor");
      }

      function checkWrappedMethod(wrappedMethod) {
        var error;

        if (!isFunction(wrappedMethod)) {
          error = new TypeError("Attempted to wrap " + (typeof wrappedMethod) + " property " +
              property + " as function");
        } else if (wrappedMethod.restore && wrappedMethod.restore.sinon) {
          error = new TypeError("Attempted to wrap " + property + " which is already wrapped");
        } else if (wrappedMethod.calledBefore) {
          var verb = wrappedMethod.returns ? "stubbed" : "spied on";
          error = new TypeError("Attempted to wrap " + property + " which is already " + verb);
        }

        if (error) {
          if (wrappedMethod && wrappedMethod.stackTrace) {
            error.stack += "\n--------------\n" + wrappedMethod.stackTrace;
          }
          throw error;
        }
      }

      var error, wrappedMethod, i;

      // IE 8 does not support hasOwnProperty on the window object and Firefox has a problem
      // when using hasOwn.call on objects from other frames.
      var owned = object.hasOwnProperty ? object.hasOwnProperty(property) : hasOwn.call(object, property);

      if (hasES5Support) {
        var methodDesc = (typeof method === "function") ? {value: method} : method;
        var wrappedMethodDesc = sinon.getPropertyDescriptor(object, property);

        if (!wrappedMethodDesc) {
          error = new TypeError("Attempted to wrap " + (typeof wrappedMethod) + " property " +
              property + " as function");
        } else if (wrappedMethodDesc.restore && wrappedMethodDesc.restore.sinon) {
          error = new TypeError("Attempted to wrap " + property + " which is already wrapped");
        }
        if (error) {
          if (wrappedMethodDesc && wrappedMethodDesc.stackTrace) {
            error.stack += "\n--------------\n" + wrappedMethodDesc.stackTrace;
          }
          throw error;
        }

        var types = sinon.objectKeys(methodDesc);
        for (i = 0; i < types.length; i++) {
          wrappedMethod = wrappedMethodDesc[types[i]];
          checkWrappedMethod(wrappedMethod);
        }

        mirrorProperties(methodDesc, wrappedMethodDesc);
        for (i = 0; i < types.length; i++) {
          mirrorProperties(methodDesc[types[i]], wrappedMethodDesc[types[i]]);
        }
        Object.defineProperty(object, property, methodDesc);
      } else {
        wrappedMethod = object[property];
        checkWrappedMethod(wrappedMethod);
        object[property] = method;
        method.displayName = property;
      }

      method.displayName = property;

      // Set up a stack trace which can be used later to find what line of
      // code the original method was created on.
      method.stackTrace = (new Error("Stack Trace for original")).stack;

      method.restore = function () {
        // For prototype properties try to reset by delete first.
        // If this fails (ex: localStorage on mobile safari) then force a reset
        // via direct assignment.
        if (!owned) {
          // In some cases `delete` may throw an error
          try {
            delete object[property];
          } catch (e) {} // eslint-disable-line no-empty
          // For native code functions `delete` fails without throwing an error
          // on Chrome < 43, PhantomJS, etc.
        } else if (hasES5Support) {
          Object.defineProperty(object, property, wrappedMethodDesc);
        }

        // Use strict equality comparison to check failures then force a reset
        // via direct assignment.
        if (object[property] === method) {
          object[property] = wrappedMethod;
        }
      };

      method.restore.sinon = true;

      if (!hasES5Support) {
        mirrorProperties(method, wrappedMethod);
      }

      return method;
    };

    sinon.create = function create(proto) {
      var F = function () {};
      F.prototype = proto;
      return new F();
    };

    sinon.deepEqual = function deepEqual(a, b) {
      if (sinon.match && sinon.match.isMatcher(a)) {
        return a.test(b);
      }

      if (typeof a !== "object" || typeof b !== "object") {
        return isReallyNaN(a) && isReallyNaN(b) || a === b;
      }

      if (isElement(a) || isElement(b)) {
        return a === b;
      }

      if (a === b) {
        return true;
      }

      if ((a === null && b !== null) || (a !== null && b === null)) {
        return false;
      }

      if (a instanceof RegExp && b instanceof RegExp) {
        return (a.source === b.source) && (a.global === b.global) &&
            (a.ignoreCase === b.ignoreCase) && (a.multiline === b.multiline);
      }

      var aString = Object.prototype.toString.call(a);
      if (aString !== Object.prototype.toString.call(b)) {
        return false;
      }

      if (aString === "[object Date]") {
        return a.valueOf() === b.valueOf();
      }

      var prop;
      var aLength = 0;
      var bLength = 0;

      if (aString === "[object Array]" && a.length !== b.length) {
        return false;
      }

      for (prop in a) {
        if (a.hasOwnProperty(prop)) {
          aLength += 1;

          if (!(prop in b)) {
            return false;
          }

          if (!deepEqual(a[prop], b[prop])) {
            return false;
          }
        }
      }

      for (prop in b) {
        if (b.hasOwnProperty(prop)) {
          bLength += 1;
        }
      }

      return aLength === bLength;
    };

    sinon.functionName = function functionName(func) {
      var name = func.displayName || func.name;

      // Use function decomposition as a last resort to get function
      // name. Does not rely on function decomposition to work - if it
      // doesn't debugging will be slightly less informative
      // (i.e. toString will say 'spy' rather than 'myFunc').
      if (!name) {
        var matches = func.toString().match(/function ([^\s\(]+)/);
        name = matches && matches[1];
      }

      return name;
    };

    sinon.functionToString = function toString() {
      if (this.getCall && this.callCount) {
        var thisValue,
            prop;
        var i = this.callCount;

        while (i--) {
          thisValue = this.getCall(i).thisValue;

          for (prop in thisValue) {
            if (thisValue[prop] === this) {
              return prop;
            }
          }
        }
      }

      return this.displayName || "sinon fake";
    };

    sinon.objectKeys = function objectKeys(obj) {
      if (obj !== Object(obj)) {
        throw new TypeError("sinon.objectKeys called on a non-object");
      }

      var keys = [];
      var key;
      for (key in obj) {
        if (hasOwn.call(obj, key)) {
          keys.push(key);
        }
      }

      return keys;
    };

    sinon.getPropertyDescriptor = function getPropertyDescriptor(object, property) {
      var proto = object;
      var descriptor;

      while (proto && !(descriptor = Object.getOwnPropertyDescriptor(proto, property))) {
        proto = Object.getPrototypeOf(proto);
      }
      return descriptor;
    };

    sinon.getConfig = function (custom) {
      var config = {};
      custom = custom || {};
      var defaults = sinon.defaultConfig;

      for (var prop in defaults) {
        if (defaults.hasOwnProperty(prop)) {
          config[prop] = custom.hasOwnProperty(prop) ? custom[prop] : defaults[prop];
        }
      }

      return config;
    };

    sinon.defaultConfig = {
      injectIntoThis: true,
      injectInto: null,
      properties: ["spy", "stub", "mock", "clock", "server", "requests"],
      useFakeTimers: true,
      useFakeServer: true
    };

    sinon.timesInWords = function timesInWords(count) {
      return count === 1 && "once" ||
          count === 2 && "twice" ||
          count === 3 && "thrice" ||
          (count || 0) + " times";
    };

    sinon.calledInOrder = function (spies) {
      for (var i = 1, l = spies.length; i < l; i++) {
        if (!spies[i - 1].calledBefore(spies[i]) || !spies[i].called) {
          return false;
        }
      }

      return true;
    };

    sinon.orderByFirstCall = function (spies) {
      return spies.sort(function (a, b) {
        // uuid, won't ever be equal
        var aCall = a.getCall(0);
        var bCall = b.getCall(0);
        var aId = aCall && aCall.callId || -1;
        var bId = bCall && bCall.callId || -1;

        return aId < bId ? -1 : 1;
      });
    };

    sinon.createStubInstance = function (constructor) {
      if (typeof constructor !== "function") {
        throw new TypeError("The constructor should be a function.");
      }
      return sinon.stub(sinon.create(constructor.prototype));
    };

    sinon.restore = function (object) {
      if (object !== null && typeof object === "object") {
        for (var prop in object) {
          if (isRestorable(object[prop])) {
            object[prop].restore();
          }
        }
      } else if (isRestorable(object)) {
        object.restore();
      }
    };

    return sinon;
  }

  var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

  function loadDependencies(require, exports) {
    makeApi(exports);
  }

  if (isAMD) {
    define(loadDependencies);
    return;
  }

  if (isNode) {
    loadDependencies(require, module.exports, module);
    return;
  }

  if (sinonGlobal) {
    makeApi(sinonGlobal);
  }
}(
    typeof sinon === "object" && sinon // eslint-disable-line no-undef
));

/**
 * @depend util/core.js
 */
(function (sinonGlobal) {

  function makeApi(sinon) {

    // Adapted from https://developer.mozilla.org/en/docs/ECMAScript_DontEnum_attribute#JScript_DontEnum_Bug
    var hasDontEnumBug = (function () {
      var obj = {
        constructor: function () {
          return "0";
        },
        toString: function () {
          return "1";
        },
        valueOf: function () {
          return "2";
        },
        toLocaleString: function () {
          return "3";
        },
        prototype: function () {
          return "4";
        },
        isPrototypeOf: function () {
          return "5";
        },
        propertyIsEnumerable: function () {
          return "6";
        },
        hasOwnProperty: function () {
          return "7";
        },
        length: function () {
          return "8";
        },
        unique: function () {
          return "9";
        }
      };

      var result = [];
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          result.push(obj[prop]());
        }
      }
      return result.join("") !== "0123456789";
    })();

    /* Public: Extend target in place with all (own) properties from sources in-order. Thus, last source will
     *         override properties in previous sources.
     *
     * target - The Object to extend
     * sources - Objects to copy properties from.
     *
     * Returns the extended target
     */
    function extend(target /*, sources */) {
      var sources = Array.prototype.slice.call(arguments, 1);
      var source, i, prop;

      for (i = 0; i < sources.length; i++) {
        source = sources[i];

        for (prop in source) {
          if (source.hasOwnProperty(prop)) {
            target[prop] = source[prop];
          }
        }

        // Make sure we copy (own) toString method even when in JScript with DontEnum bug
        // See https://developer.mozilla.org/en/docs/ECMAScript_DontEnum_attribute#JScript_DontEnum_Bug
        if (hasDontEnumBug && source.hasOwnProperty("toString") && source.toString !== target.toString) {
          target.toString = source.toString;
        }
      }

      return target;
    }

    sinon.extend = extend;
    return sinon.extend;
  }

  function loadDependencies(require, exports, module) {
    var sinon = require("./util/core");
    module.exports = makeApi(sinon);
  }

  var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

  if (isAMD) {
    define(loadDependencies);
    return;
  }

  if (isNode) {
    loadDependencies(require, module.exports, module);
    return;
  }

  if (sinonGlobal) {
    makeApi(sinonGlobal);
  }
}(
    typeof sinon === "object" && sinon // eslint-disable-line no-undef
));

/**
 * Minimal Event interface implementation
 *
 * Original implementation by Sven Fuchs: https://gist.github.com/995028
 * Modifications and tests by Christian Johansen.
 *
 * @author Sven Fuchs (svenfuchs@artweb-design.de)
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2011 Sven Fuchs, Christian Johansen
 */
if (typeof sinon === "undefined") {
  this.sinon = {};
}

(function () {

  var push = [].push;

  function makeApi(sinon) {
    sinon.Event = function Event(type, bubbles, cancelable, target) {
      this.initEvent(type, bubbles, cancelable, target);
    };

    sinon.Event.prototype = {
      initEvent: function (type, bubbles, cancelable, target) {
        this.type = type;
        this.bubbles = bubbles;
        this.cancelable = cancelable;
        this.target = target;
      },

      stopPropagation: function () {},

      preventDefault: function () {
        this.defaultPrevented = true;
      }
    };

    sinon.ProgressEvent = function ProgressEvent(type, progressEventRaw, target) {
      this.initEvent(type, false, false, target);
      this.loaded = progressEventRaw.loaded || null;
      this.total = progressEventRaw.total || null;
      this.lengthComputable = !!progressEventRaw.total;
    };

    sinon.ProgressEvent.prototype = new sinon.Event();

    sinon.ProgressEvent.prototype.constructor = sinon.ProgressEvent;

    sinon.CustomEvent = function CustomEvent(type, customData, target) {
      this.initEvent(type, false, false, target);
      this.detail = customData.detail || null;
    };

    sinon.CustomEvent.prototype = new sinon.Event();

    sinon.CustomEvent.prototype.constructor = sinon.CustomEvent;

    sinon.EventTarget = {
      addEventListener: function addEventListener(event, listener) {
        this.eventListeners = this.eventListeners || {};
        this.eventListeners[event] = this.eventListeners[event] || [];
        push.call(this.eventListeners[event], listener);
      },

      removeEventListener: function removeEventListener(event, listener) {
        var listeners = this.eventListeners && this.eventListeners[event] || [];

        for (var i = 0, l = listeners.length; i < l; ++i) {
          if (listeners[i] === listener) {
            return listeners.splice(i, 1);
          }
        }
      },

      dispatchEvent: function dispatchEvent(event) {
        var type = event.type;
        var listeners = this.eventListeners && this.eventListeners[type] || [];

        for (var i = 0; i < listeners.length; i++) {
          if (typeof listeners[i] === "function") {
            listeners[i].call(this, event);
          } else {
            listeners[i].handleEvent(event);
          }
        }

        return !!event.defaultPrevented;
      }
    };
  }

  var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

  function loadDependencies(require) {
    var sinon = require("./core");
    makeApi(sinon);
  }

  if (isAMD) {
    define(loadDependencies);
  } else if (isNode) {
    loadDependencies(require);
  } else {
    makeApi(sinon); // eslint-disable-line no-undef
  }
}());

/**
 * @depend util/core.js
 */
/**
 * Logs errors
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2014 Christian Johansen
 */
(function (sinonGlobal) {

  // cache a reference to setTimeout, so that our reference won't be stubbed out
  // when using fake timers and errors will still get logged
  // https://github.com/cjohansen/Sinon.JS/issues/381
  var realSetTimeout = setTimeout;

  function makeApi(sinon) {

    function log() {}

    function logError(label, err) {
      var msg = label + " threw exception: ";

      function throwLoggedError() {
        err.message = msg + err.message;
        throw err;
      }

      sinon.log(msg + "[" + err.name + "] " + err.message);

      if (err.stack) {
        sinon.log(err.stack);
      }

      if (logError.useImmediateExceptions) {
        throwLoggedError();
      } else {
        logError.setTimeout(throwLoggedError, 0);
      }
    }

    // When set to true, any errors logged will be thrown immediately;
    // If set to false, the errors will be thrown in separate execution frame.
    logError.useImmediateExceptions = false;

    // wrap realSetTimeout with something we can stub in tests
    logError.setTimeout = function (func, timeout) {
      realSetTimeout(func, timeout);
    };

    var exports = {};
    exports.log = sinon.log = log;
    exports.logError = sinon.logError = logError;

    return exports;
  }

  function loadDependencies(require, exports, module) {
    var sinon = require("./util/core");
    module.exports = makeApi(sinon);
  }

  var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

  if (isAMD) {
    define(loadDependencies);
    return;
  }

  if (isNode) {
    loadDependencies(require, module.exports, module);
    return;
  }

  if (sinonGlobal) {
    makeApi(sinonGlobal);
  }
}(
    typeof sinon === "object" && sinon // eslint-disable-line no-undef
));

/**
 * @depend core.js
 * @depend ../extend.js
 * @depend event.js
 * @depend ../log_error.js
 */
/**
 * Fake XDomainRequest object
 */
if (typeof sinon === "undefined") {
  this.sinon = {};
}

// wrapper for global
(function (global) {

  var xdr = { XDomainRequest: global.XDomainRequest };
  xdr.GlobalXDomainRequest = global.XDomainRequest;
  xdr.supportsXDR = typeof xdr.GlobalXDomainRequest !== "undefined";
  xdr.workingXDR = xdr.supportsXDR ? xdr.GlobalXDomainRequest : false;

  function makeApi(sinon) {
    sinon.xdr = xdr;

    function FakeXDomainRequest() {
      this.readyState = FakeXDomainRequest.UNSENT;
      this.requestBody = null;
      this.requestHeaders = {};
      this.status = 0;
      this.timeout = null;

      if (typeof FakeXDomainRequest.onCreate === "function") {
        FakeXDomainRequest.onCreate(this);
      }
    }

    function verifyState(x) {
      if (x.readyState !== FakeXDomainRequest.OPENED) {
        throw new Error("INVALID_STATE_ERR");
      }

      if (x.sendFlag) {
        throw new Error("INVALID_STATE_ERR");
      }
    }

    function verifyRequestSent(x) {
      if (x.readyState === FakeXDomainRequest.UNSENT) {
        throw new Error("Request not sent");
      }
      if (x.readyState === FakeXDomainRequest.DONE) {
        throw new Error("Request done");
      }
    }

    function verifyResponseBodyType(body) {
      if (typeof body !== "string") {
        var error = new Error("Attempted to respond to fake XDomainRequest with " +
            body + ", which is not a string.");
        error.name = "InvalidBodyException";
        throw error;
      }
    }

    sinon.extend(FakeXDomainRequest.prototype, sinon.EventTarget, {
      open: function open(method, url) {
        this.method = method;
        this.url = url;

        this.responseText = null;
        this.sendFlag = false;

        this.readyStateChange(FakeXDomainRequest.OPENED);
      },

      readyStateChange: function readyStateChange(state) {
        this.readyState = state;
        var eventName = "";
        switch (this.readyState) {
          case FakeXDomainRequest.UNSENT:
            break;
          case FakeXDomainRequest.OPENED:
            break;
          case FakeXDomainRequest.LOADING:
            if (this.sendFlag) {
              //raise the progress event
              eventName = "onprogress";
            }
            break;
          case FakeXDomainRequest.DONE:
            if (this.isTimeout) {
              eventName = "ontimeout";
            } else if (this.errorFlag || (this.status < 200 || this.status > 299)) {
              eventName = "onerror";
            } else {
              eventName = "onload";
            }
            break;
        }

        // raising event (if defined)
        if (eventName) {
          if (typeof this[eventName] === "function") {
            try {
              this[eventName]();
            } catch (e) {
              sinon.logError("Fake XHR " + eventName + " handler", e);
            }
          }
        }
      },

      send: function send(data) {
        verifyState(this);

        if (!/^(get|head)$/i.test(this.method)) {
          this.requestBody = data;
        }
        this.requestHeaders["Content-Type"] = "text/plain;charset=utf-8";

        this.errorFlag = false;
        this.sendFlag = true;
        this.readyStateChange(FakeXDomainRequest.OPENED);

        if (typeof this.onSend === "function") {
          this.onSend(this);
        }
      },

      abort: function abort() {
        this.aborted = true;
        this.responseText = null;
        this.errorFlag = true;

        if (this.readyState > sinon.FakeXDomainRequest.UNSENT && this.sendFlag) {
          this.readyStateChange(sinon.FakeXDomainRequest.DONE);
          this.sendFlag = false;
        }
      },

      setResponseBody: function setResponseBody(body) {
        verifyRequestSent(this);
        verifyResponseBodyType(body);

        var chunkSize = this.chunkSize || 10;
        var index = 0;
        this.responseText = "";

        do {
          this.readyStateChange(FakeXDomainRequest.LOADING);
          this.responseText += body.substring(index, index + chunkSize);
          index += chunkSize;
        } while (index < body.length);

        this.readyStateChange(FakeXDomainRequest.DONE);
      },

      respond: function respond(status, contentType, body) {
        // content-type ignored, since XDomainRequest does not carry this
        // we keep the same syntax for respond(...) as for FakeXMLHttpRequest to ease
        // test integration across browsers
        this.status = typeof status === "number" ? status : 200;
        this.setResponseBody(body || "");
      },

      simulatetimeout: function simulatetimeout() {
        this.status = 0;
        this.isTimeout = true;
        // Access to this should actually throw an error
        this.responseText = undefined;
        this.readyStateChange(FakeXDomainRequest.DONE);
      }
    });

    sinon.extend(FakeXDomainRequest, {
      UNSENT: 0,
      OPENED: 1,
      LOADING: 3,
      DONE: 4
    });

    sinon.useFakeXDomainRequest = function useFakeXDomainRequest() {
      sinon.FakeXDomainRequest.restore = function restore(keepOnCreate) {
        if (xdr.supportsXDR) {
          global.XDomainRequest = xdr.GlobalXDomainRequest;
        }

        delete sinon.FakeXDomainRequest.restore;

        if (keepOnCreate !== true) {
          delete sinon.FakeXDomainRequest.onCreate;
        }
      };
      if (xdr.supportsXDR) {
        global.XDomainRequest = sinon.FakeXDomainRequest;
      }
      return sinon.FakeXDomainRequest;
    };

    sinon.FakeXDomainRequest = FakeXDomainRequest;
  }

  var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

  function loadDependencies(require, exports, module) {
    var sinon = require("./core");
    require("../extend");
    require("./event");
    require("../log_error");
    makeApi(sinon);
    module.exports = sinon;
  }

  if (isAMD) {
    define(loadDependencies);
  } else if (isNode) {
    loadDependencies(require, module.exports, module);
  } else {
    makeApi(sinon); // eslint-disable-line no-undef
  }
})(typeof global !== "undefined" ? global : self);

/**
 * @depend core.js
 * @depend ../extend.js
 * @depend event.js
 * @depend ../log_error.js
 */
/**
 * Fake XMLHttpRequest object
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
(function (sinonGlobal, global) {

  function getWorkingXHR(globalScope) {
    var supportsXHR = typeof globalScope.XMLHttpRequest !== "undefined";
    if (supportsXHR) {
      return globalScope.XMLHttpRequest;
    }

    var supportsActiveX = typeof globalScope.ActiveXObject !== "undefined";
    if (supportsActiveX) {
      return function () {
        return new globalScope.ActiveXObject("MSXML2.XMLHTTP.3.0");
      };
    }

    return false;
  }

  var supportsProgress = typeof ProgressEvent !== "undefined";
  var supportsCustomEvent = typeof CustomEvent !== "undefined";
  var supportsFormData = typeof FormData !== "undefined";
  var supportsArrayBuffer = typeof ArrayBuffer !== "undefined";
  var supportsBlob = typeof Blob === "function";
  var sinonXhr = { XMLHttpRequest: global.XMLHttpRequest };
  sinonXhr.GlobalXMLHttpRequest = global.XMLHttpRequest;
  sinonXhr.GlobalActiveXObject = global.ActiveXObject;
  sinonXhr.supportsActiveX = typeof sinonXhr.GlobalActiveXObject !== "undefined";
  sinonXhr.supportsXHR = typeof sinonXhr.GlobalXMLHttpRequest !== "undefined";
  sinonXhr.workingXHR = getWorkingXHR(global);
  sinonXhr.supportsCORS = sinonXhr.supportsXHR && "withCredentials" in (new sinonXhr.GlobalXMLHttpRequest());

  var unsafeHeaders = {
    "Accept-Charset": true,
    "Accept-Encoding": true,
    Connection: true,
    "Content-Length": true,
    Cookie: true,
    Cookie2: true,
    "Content-Transfer-Encoding": true,
    Date: true,
    Expect: true,
    Host: true,
    "Keep-Alive": true,
    Referer: true,
    TE: true,
    Trailer: true,
    "Transfer-Encoding": true,
    Upgrade: true,
    "User-Agent": true,
    Via: true
  };

  // An upload object is created for each
  // FakeXMLHttpRequest and allows upload
  // events to be simulated using uploadProgress
  // and uploadError.
  function UploadProgress() {
    this.eventListeners = {
      progress: [],
      load: [],
      abort: [],
      error: []
    };
  }

  UploadProgress.prototype.addEventListener = function addEventListener(event, listener) {
    this.eventListeners[event].push(listener);
  };

  UploadProgress.prototype.removeEventListener = function removeEventListener(event, listener) {
    var listeners = this.eventListeners[event] || [];

    for (var i = 0, l = listeners.length; i < l; ++i) {
      if (listeners[i] === listener) {
        return listeners.splice(i, 1);
      }
    }
  };

  UploadProgress.prototype.dispatchEvent = function dispatchEvent(event) {
    var listeners = this.eventListeners[event.type] || [];

    for (var i = 0, listener; (listener = listeners[i]) != null; i++) {
      listener(event);
    }
  };

  // Note that for FakeXMLHttpRequest to work pre ES5
  // we lose some of the alignment with the spec.
  // To ensure as close a match as possible,
  // set responseType before calling open, send or respond;
  function FakeXMLHttpRequest() {
    this.readyState = FakeXMLHttpRequest.UNSENT;
    this.requestHeaders = {};
    this.requestBody = null;
    this.status = 0;
    this.statusText = "";
    this.upload = new UploadProgress();
    this.responseType = "";
    this.response = "";
    if (sinonXhr.supportsCORS) {
      this.withCredentials = false;
    }

    var xhr = this;
    var events = ["loadstart", "load", "abort", "loadend"];

    function addEventListener(eventName) {
      xhr.addEventListener(eventName, function (event) {
        var listener = xhr["on" + eventName];

        if (listener && typeof listener === "function") {
          listener.call(this, event);
        }
      });
    }

    for (var i = events.length - 1; i >= 0; i--) {
      addEventListener(events[i]);
    }

    if (typeof FakeXMLHttpRequest.onCreate === "function") {
      FakeXMLHttpRequest.onCreate(this);
    }
  }

  function verifyState(xhr) {
    if (xhr.readyState !== FakeXMLHttpRequest.OPENED) {
      throw new Error("INVALID_STATE_ERR");
    }

    if (xhr.sendFlag) {
      throw new Error("INVALID_STATE_ERR");
    }
  }

  function getHeader(headers, header) {
    header = header.toLowerCase();

    for (var h in headers) {
      if (h.toLowerCase() === header) {
        return h;
      }
    }

    return null;
  }

  // filtering to enable a white-list version of Sinon FakeXhr,
  // where whitelisted requests are passed through to real XHR
  function each(collection, callback) {
    if (!collection) {
      return;
    }

    for (var i = 0, l = collection.length; i < l; i += 1) {
      callback(collection[i]);
    }
  }
  function some(collection, callback) {
    for (var index = 0; index < collection.length; index++) {
      if (callback(collection[index]) === true) {
        return true;
      }
    }
    return false;
  }
  // largest arity in XHR is 5 - XHR#open
  var apply = function (obj, method, args) {
    switch (args.length) {
      case 0: return obj[method]();
      case 1: return obj[method](args[0]);
      case 2: return obj[method](args[0], args[1]);
      case 3: return obj[method](args[0], args[1], args[2]);
      case 4: return obj[method](args[0], args[1], args[2], args[3]);
      case 5: return obj[method](args[0], args[1], args[2], args[3], args[4]);
    }
  };

  FakeXMLHttpRequest.filters = [];
  FakeXMLHttpRequest.addFilter = function addFilter(fn) {
    this.filters.push(fn);
  };
  var IE6Re = /MSIE 6/;
  FakeXMLHttpRequest.onResponseEnd = function() {};
  FakeXMLHttpRequest.defake = function defake(fakeXhr, xhrArgs) {
    var xhr = new sinonXhr.workingXHR(); // eslint-disable-line new-cap

    each([
      "open",
      "setRequestHeader",
      "send",
      "abort",
      "getResponseHeader",
      "getAllResponseHeaders",
      "addEventListener",
      "overrideMimeType",
      "removeEventListener"
    ], function (method) {
      fakeXhr[method] = function () {
        return apply(xhr, method, arguments);
      };
    });

    var copyAttrs = function (args) {
      each(args, function (attr) {
        try {
          fakeXhr[attr] = xhr[attr];
        } catch (e) {
          if (!IE6Re.test(navigator.userAgent)) {
            throw e;
          }
        }
      });
    };

    var stateChange = function stateChange() {
      fakeXhr.readyState = xhr.readyState;
      if (xhr.readyState >= FakeXMLHttpRequest.HEADERS_RECEIVED) {
        copyAttrs(["status", "statusText"]);
      }
      if (xhr.readyState >= FakeXMLHttpRequest.LOADING) {
        copyAttrs(["responseText", "response"]);
      }
      if (xhr.readyState === FakeXMLHttpRequest.DONE) {
        copyAttrs(["responseXML"]);
        FakeXMLHttpRequest.onResponseEnd(fakeXhr);
      }
      if (fakeXhr.onreadystatechange) {
        fakeXhr.onreadystatechange.call(fakeXhr, { target: fakeXhr });
      }
    };

    if (xhr.addEventListener) {
      for (var event in fakeXhr.eventListeners) {
        if (fakeXhr.eventListeners.hasOwnProperty(event)) {

          /*eslint-disable no-loop-func*/
          each(fakeXhr.eventListeners[event], function (handler) {
            xhr.addEventListener(event, handler);
          });
          /*eslint-enable no-loop-func*/
        }
      }
      xhr.addEventListener("readystatechange", stateChange);
    } else {
      xhr.onreadystatechange = stateChange;
    }
    apply(xhr, "open", xhrArgs);
  };
  FakeXMLHttpRequest.useFilters = false;

  function verifyRequestOpened(xhr) {
    if (xhr.readyState !== FakeXMLHttpRequest.OPENED) {
      throw new Error("INVALID_STATE_ERR - " + xhr.readyState);
    }
  }

  function verifyRequestSent(xhr) {
    if (xhr.readyState === FakeXMLHttpRequest.DONE) {
      throw new Error("Request done");
    }
  }

  function verifyHeadersReceived(xhr) {
    if (xhr.async && xhr.readyState !== FakeXMLHttpRequest.HEADERS_RECEIVED) {
      throw new Error("No headers received");
    }
  }

  function verifyResponseBodyType(body) {
    if (typeof body !== "string") {
      var error = new Error("Attempted to respond to fake XMLHttpRequest with " +
          body + ", which is not a string.");
      error.name = "InvalidBodyException";
      throw error;
    }
  }

  function convertToArrayBuffer(body) {
    var buffer = new ArrayBuffer(body.length);
    var view = new Uint8Array(buffer);
    for (var i = 0; i < body.length; i++) {
      var charCode = body.charCodeAt(i);
      if (charCode >= 256) {
        throw new TypeError("arraybuffer or blob responseTypes require binary string, " +
            "invalid character " + body[i] + " found.");
      }
      view[i] = charCode;
    }
    return buffer;
  }

  function isXmlContentType(contentType) {
    return !contentType || /(text\/xml)|(application\/xml)|(\+xml)/.test(contentType);
  }

  function convertResponseBody(responseType, contentType, body) {
    if (responseType === "" || responseType === "text") {
      return body;
    } else if (supportsArrayBuffer && responseType === "arraybuffer") {
      return convertToArrayBuffer(body);
    } else if (responseType === "json") {
      try {
        return JSON.parse(body);
      } catch (e) {
        // Return parsing failure as null
        return null;
      }
    } else if (supportsBlob && responseType === "blob") {
      var blobOptions = {};
      if (contentType) {
        blobOptions.type = contentType;
      }
      return new Blob([convertToArrayBuffer(body)], blobOptions);
    } else if (responseType === "document") {
      if (isXmlContentType(contentType)) {
        return FakeXMLHttpRequest.parseXML(body);
      }
      return null;
    }
    throw new Error("Invalid responseType " + responseType);
  }

  function clearResponse(xhr) {
    if (xhr.responseType === "" || xhr.responseType === "text") {
      xhr.response = xhr.responseText = "";
    } else {
      xhr.response = xhr.responseText = null;
    }
    xhr.responseXML = null;
  }

  FakeXMLHttpRequest.parseXML = function parseXML(text) {
    // Treat empty string as parsing failure
    if (text !== "") {
      try {
        if (typeof DOMParser !== "undefined") {
          var parser = new DOMParser();
          return parser.parseFromString(text, "text/xml");
        }
        var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
        xmlDoc.async = "false";
        xmlDoc.loadXML(text);
        return xmlDoc;
      } catch (e) {
        // Unable to parse XML - no biggie
      }
    }

    return null;
  };

  FakeXMLHttpRequest.statusCodes = {
    100: "Continue",
    101: "Switching Protocols",
    200: "OK",
    201: "Created",
    202: "Accepted",
    203: "Non-Authoritative Information",
    204: "No Content",
    205: "Reset Content",
    206: "Partial Content",
    207: "Multi-Status",
    300: "Multiple Choice",
    301: "Moved Permanently",
    302: "Found",
    303: "See Other",
    304: "Not Modified",
    305: "Use Proxy",
    307: "Temporary Redirect",
    400: "Bad Request",
    401: "Unauthorized",
    402: "Payment Required",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    406: "Not Acceptable",
    407: "Proxy Authentication Required",
    408: "Request Timeout",
    409: "Conflict",
    410: "Gone",
    411: "Length Required",
    412: "Precondition Failed",
    413: "Request Entity Too Large",
    414: "Request-URI Too Long",
    415: "Unsupported Media Type",
    416: "Requested Range Not Satisfiable",
    417: "Expectation Failed",
    422: "Unprocessable Entity",
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
    505: "HTTP Version Not Supported"
  };

  function makeApi(sinon) {
    sinon.xhr = sinonXhr;

    sinon.extend(FakeXMLHttpRequest.prototype, sinon.EventTarget, {
      async: true,

      open: function open(method, url, async, username, password) {
        this.method = method;
        this.url = url;
        this.async = typeof async === "boolean" ? async : true;
        this.username = username;
        this.password = password;
        clearResponse(this);
        this.requestHeaders = {};
        this.sendFlag = false;

        if (FakeXMLHttpRequest.useFilters === true) {
          var xhrArgs = arguments;
          var defake = some(FakeXMLHttpRequest.filters, function (filter) {
            return filter.apply(this, xhrArgs);
          });
          if (defake) {
            return FakeXMLHttpRequest.defake(this, arguments);
          }
        }
        this.readyStateChange(FakeXMLHttpRequest.OPENED);
      },

      readyStateChange: function readyStateChange(state) {
        this.readyState = state;

        var readyStateChangeEvent = new sinon.Event("readystatechange", false, false, this);

        if (typeof this.onreadystatechange === "function") {
          try {
            this.onreadystatechange(readyStateChangeEvent);
          } catch (e) {
            sinon.logError("Fake XHR onreadystatechange handler", e);
          }
        }

        switch (this.readyState) {
          case FakeXMLHttpRequest.DONE:
            if (supportsProgress) {
              this.upload.dispatchEvent(new sinon.ProgressEvent("progress", {loaded: 100, total: 100}));
              this.dispatchEvent(new sinon.ProgressEvent("progress", {loaded: 100, total: 100}));
            }
            this.upload.dispatchEvent(new sinon.Event("load", false, false, this));
            this.dispatchEvent(new sinon.Event("load", false, false, this));
            this.dispatchEvent(new sinon.Event("loadend", false, false, this));
            break;
        }

        this.dispatchEvent(readyStateChangeEvent);
      },

      setRequestHeader: function setRequestHeader(header, value) {
        verifyState(this);

        if (unsafeHeaders[header] || /^(Sec-|Proxy-)/.test(header)) {
          throw new Error("Refused to set unsafe header \"" + header + "\"");
        }

        if (this.requestHeaders[header]) {
          this.requestHeaders[header] += "," + value;
        } else {
          this.requestHeaders[header] = value;
        }
      },

      // Helps testing
      setResponseHeaders: function setResponseHeaders(headers) {
        verifyRequestOpened(this);
        this.responseHeaders = {};

        for (var header in headers) {
          if (headers.hasOwnProperty(header)) {
            this.responseHeaders[header] = headers[header];
          }
        }

        if (this.async) {
          this.readyStateChange(FakeXMLHttpRequest.HEADERS_RECEIVED);
        } else {
          this.readyState = FakeXMLHttpRequest.HEADERS_RECEIVED;
        }
      },

      // Currently treats ALL data as a DOMString (i.e. no Document)
      send: function send(data) {
        verifyState(this);

        if (!/^(get|head)$/i.test(this.method)) {
          var contentType = getHeader(this.requestHeaders, "Content-Type");
          if (this.requestHeaders[contentType]) {
            var value = this.requestHeaders[contentType].split(";");
            this.requestHeaders[contentType] = value[0] + ";charset=utf-8";
          } else if (supportsFormData && !(data instanceof FormData)) {
            this.requestHeaders["Content-Type"] = "text/plain;charset=utf-8";
          }

          this.requestBody = data;
        }

        this.errorFlag = false;
        this.sendFlag = this.async;
        clearResponse(this);
        this.readyStateChange(FakeXMLHttpRequest.OPENED);

        if (typeof this.onSend === "function") {
          this.onSend(this);
        }

        this.dispatchEvent(new sinon.Event("loadstart", false, false, this));
      },

      abort: function abort() {
        this.aborted = true;
        clearResponse(this);
        this.errorFlag = true;
        this.requestHeaders = {};
        this.responseHeaders = {};

        if (this.readyState > FakeXMLHttpRequest.UNSENT && this.sendFlag) {
          this.readyStateChange(FakeXMLHttpRequest.DONE);
          this.sendFlag = false;
        }

        this.readyState = FakeXMLHttpRequest.UNSENT;

        this.dispatchEvent(new sinon.Event("abort", false, false, this));

        this.upload.dispatchEvent(new sinon.Event("abort", false, false, this));

        if (typeof this.onerror === "function") {
          this.onerror();
        }
      },

      getResponseHeader: function getResponseHeader(header) {
        if (this.readyState < FakeXMLHttpRequest.HEADERS_RECEIVED) {
          return null;
        }

        if (/^Set-Cookie2?$/i.test(header)) {
          return null;
        }

        header = getHeader(this.responseHeaders, header);

        return this.responseHeaders[header] || null;
      },

      getAllResponseHeaders: function getAllResponseHeaders() {
        if (this.readyState < FakeXMLHttpRequest.HEADERS_RECEIVED) {
          return "";
        }

        var headers = "";

        for (var header in this.responseHeaders) {
          if (this.responseHeaders.hasOwnProperty(header) &&
              !/^Set-Cookie2?$/i.test(header)) {
            headers += header + ": " + this.responseHeaders[header] + "\r\n";
          }
        }

        return headers;
      },

      setResponseBody: function setResponseBody(body) {
        verifyRequestSent(this);
        verifyHeadersReceived(this);
        verifyResponseBodyType(body);
        var contentType = this.getResponseHeader("Content-Type");

        var isTextResponse = this.responseType === "" || this.responseType === "text";
        clearResponse(this);
        if (this.async) {
          var chunkSize = this.chunkSize || 10;
          var index = 0;

          do {
            this.readyStateChange(FakeXMLHttpRequest.LOADING);

            if (isTextResponse) {
              this.responseText = this.response += body.substring(index, index + chunkSize);
            }
            index += chunkSize;
          } while (index < body.length);
        }

        this.response = convertResponseBody(this.responseType, contentType, body);
        if (isTextResponse) {
          this.responseText = this.response;
        }

        if (this.responseType === "document") {
          this.responseXML = this.response;
        } else if (this.responseType === "" && isXmlContentType(contentType)) {
          this.responseXML = FakeXMLHttpRequest.parseXML(this.responseText);
        }
        this.readyStateChange(FakeXMLHttpRequest.DONE);
      },

      respond: function respond(status, headers, body) {
        this.status = typeof status === "number" ? status : 200;
        this.statusText = FakeXMLHttpRequest.statusCodes[this.status];
        this.setResponseHeaders(headers || {});
        this.setResponseBody(body || "");
      },

      uploadProgress: function uploadProgress(progressEventRaw) {
        if (supportsProgress) {
          this.upload.dispatchEvent(new sinon.ProgressEvent("progress", progressEventRaw));
        }
      },

      downloadProgress: function downloadProgress(progressEventRaw) {
        if (supportsProgress) {
          this.dispatchEvent(new sinon.ProgressEvent("progress", progressEventRaw));
        }
      },

      uploadError: function uploadError(error) {
        if (supportsCustomEvent) {
          this.upload.dispatchEvent(new sinon.CustomEvent("error", {detail: error}));
        }
      }
    });

    sinon.extend(FakeXMLHttpRequest, {
      UNSENT: 0,
      OPENED: 1,
      HEADERS_RECEIVED: 2,
      LOADING: 3,
      DONE: 4
    });

    sinon.useFakeXMLHttpRequest = function () {
      FakeXMLHttpRequest.restore = function restore(keepOnCreate) {
        if (sinonXhr.supportsXHR) {
          global.XMLHttpRequest = sinonXhr.GlobalXMLHttpRequest;
        }

        if (sinonXhr.supportsActiveX) {
          global.ActiveXObject = sinonXhr.GlobalActiveXObject;
        }

        delete FakeXMLHttpRequest.restore;

        if (keepOnCreate !== true) {
          delete FakeXMLHttpRequest.onCreate;
        }
      };
      if (sinonXhr.supportsXHR) {
        global.XMLHttpRequest = FakeXMLHttpRequest;
      }

      if (sinonXhr.supportsActiveX) {
        global.ActiveXObject = function ActiveXObject(objId) {
          if (objId === "Microsoft.XMLHTTP" || /^Msxml2\.XMLHTTP/i.test(objId)) {

            return new FakeXMLHttpRequest();
          }

          return new sinonXhr.GlobalActiveXObject(objId);
        };
      }

      return FakeXMLHttpRequest;
    };

    sinon.FakeXMLHttpRequest = FakeXMLHttpRequest;
  }

  var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

  function loadDependencies(require, exports, module) {
    var sinon = require("./core");
    require("../extend");
    require("./event");
    require("../log_error");
    makeApi(sinon);
    module.exports = sinon;
  }

  if (isAMD) {
    define(loadDependencies);
    return;
  }

  if (isNode) {
    loadDependencies(require, module.exports, module);
    return;
  }

  if (sinonGlobal) {
    makeApi(sinonGlobal);
  }
}(
    typeof sinon === "object" && sinon, // eslint-disable-line no-undef
    typeof global !== "undefined" ? global : self
));

/**
 * @depend util/core.js
 */
/**
 * Format functions
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2014 Christian Johansen
 */
(function (sinonGlobal, formatio) {

  function makeApi(sinon) {
    function valueFormatter(value) {
      return "" + value;
    }

    function getFormatioFormatter() {
      var formatter = formatio.configure({
        quoteStrings: false,
        limitChildrenCount: 250
      });

      function format() {
        return formatter.ascii.apply(formatter, arguments);
      }

      return format;
    }

    function getNodeFormatter() {
      try {
        var util = require("util");
      } catch (e) {
        /* Node, but no util module - would be very old, but better safe than sorry */
      }

      function format(v) {
        var isObjectWithNativeToString = typeof v === "object" && v.toString === Object.prototype.toString;
        return isObjectWithNativeToString ? util.inspect(v) : v;
      }

      return util ? format : valueFormatter;
    }

    var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
    var formatter;

    if (isNode) {
      try {
        formatio = require("formatio");
      }
      catch (e) {} // eslint-disable-line no-empty
    }

    if (formatio) {
      formatter = getFormatioFormatter();
    } else if (isNode) {
      formatter = getNodeFormatter();
    } else {
      formatter = valueFormatter;
    }

    sinon.format = formatter;
    return sinon.format;
  }

  function loadDependencies(require, exports, module) {
    var sinon = require("./util/core");
    module.exports = makeApi(sinon);
  }

  var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

  if (isAMD) {
    define(loadDependencies);
    return;
  }

  if (isNode) {
    loadDependencies(require, module.exports, module);
    return;
  }

  if (sinonGlobal) {
    makeApi(sinonGlobal);
  }
}(
    typeof sinon === "object" && sinon, // eslint-disable-line no-undef
    typeof formatio === "object" && formatio // eslint-disable-line no-undef
));

/**
 * @depend fake_xdomain_request.js
 * @depend fake_xml_http_request.js
 * @depend ../format.js
 * @depend ../log_error.js
 */
/**
 * The Sinon "server" mimics a web server that receives requests from
 * sinon.FakeXMLHttpRequest and provides an API to respond to those requests,
 * both synchronously and asynchronously. To respond synchronuously, canned
 * answers have to be provided upfront.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
(function () {

  var push = [].push;

  function responseArray(handler) {
    var response = handler;

    if (Object.prototype.toString.call(handler) !== "[object Array]") {
      response = [200, {}, handler];
    }

    if (typeof response[2] !== "string") {
      throw new TypeError("Fake server response body should be string, but was " +
          typeof response[2]);
    }

    return response;
  }

  var wloc = typeof window !== "undefined" ? window.location : {};
  var rCurrLoc = new RegExp("^" + wloc.protocol + "//" + wloc.host);

  function matchOne(response, reqMethod, reqUrl) {
    var rmeth = response.method;
    var matchMethod = !rmeth || rmeth.toLowerCase() === reqMethod.toLowerCase();
    var url = response.url;
    var matchUrl = !url || url === reqUrl || (typeof url.test === "function" && url.test(reqUrl));

    return matchMethod && matchUrl;
  }

  function match(response, request) {
    var requestUrl = request.url;

    if (!/^https?:\/\//.test(requestUrl) || rCurrLoc.test(requestUrl)) {
      requestUrl = requestUrl.replace(rCurrLoc, "");
    }

    if (matchOne(response, this.getHTTPMethod(request), requestUrl)) {
      if (typeof response.response === "function") {
        var ru = response.url;
        var args = [request].concat(ru && typeof ru.exec === "function" ? ru.exec(requestUrl).slice(1) : []);
        return response.response.apply(response, args);
      }

      return true;
    }

    return false;
  }

  function makeApi(sinon) {
    sinon.fakeServer = {
      create: function (config) {
        var server = sinon.create(this);
        server.configure(config);
        if (!sinon.xhr.supportsCORS) {
          this.xhr = sinon.useFakeXDomainRequest();
        } else {
          this.xhr = sinon.useFakeXMLHttpRequest();
        }
        server.requests = [];

        this.xhr.onCreate = function (xhrObj) {
          server.addRequest(xhrObj);
        };

        return server;
      },
      configure: function (config) {
        var whitelist = {
          "autoRespond": true,
          "autoRespondAfter": true,
          "respondImmediately": true,
          "fakeHTTPMethods": true
        };
        var setting;

        config = config || {};
        for (setting in config) {
          if (whitelist.hasOwnProperty(setting) && config.hasOwnProperty(setting)) {
            this[setting] = config[setting];
          }
        }
      },
      addRequest: function addRequest(xhrObj) {
        var server = this;
        push.call(this.requests, xhrObj);

        xhrObj.onSend = function () {
          server.handleRequest(this);

          if (server.respondImmediately) {
            server.respond();
          } else if (server.autoRespond && !server.responding) {
            var request = this;
            var state = Leonardo.fetchStatesByUrlAndMethod(request.url, request.method);
            var delay;
            if(state && state.activeOption && state.activeOption.hasOwnProperty('delay')) {
              delay = state.activeOption.delay;
            } else {
              delay = server.autoRespondAfter || 10;
            }

            setTimeout(function () {
              server.responding = false;
              server.respond();
            }, delay);

            server.responding = true;
          }
        };
      },

      getHTTPMethod: function getHTTPMethod(request) {
        if (this.fakeHTTPMethods && /post/i.test(request.method)) {
          var matches = (request.requestBody || "").match(/_method=([^\b;]+)/);
          return matches ? matches[1] : request.method;
        }

        return request.method;
      },

      handleRequest: function handleRequest(xhr) {
        if (xhr.async) {
          if (!this.queue) {
            this.queue = [];
          }

          push.call(this.queue, xhr);
        } else {
          this.processRequest(xhr);
        }
      },

      log: function log(response, request) {
        var str;

        str = "Request:\n" + sinon.format(request) + "\n\n";
        str += "Response:\n" + sinon.format(response) + "\n\n";

        sinon.log(str);
      },

      respondWith: function respondWith(method, url, body) {
        if (arguments.length === 1 && typeof method !== "function") {
          this.response = responseArray(method);
          return;
        }

        if (!this.responses) {
          this.responses = [];
        }

        if (arguments.length === 1) {
          body = method;
          url = method = null;
        }

        if (arguments.length === 2) {
          body = url;
          url = method;
          method = null;
        }

        push.call(this.responses, {
          method: method,
          url: url,
          response: typeof body === "function" ? body : responseArray(body)
        });
      },

      respond: function respond() {
        if (arguments.length > 0) {
          this.respondWith.apply(this, arguments);
        }

        var queue = this.queue || [];
        var requests = queue.splice(0, queue.length);

        for (var i = 0; i < requests.length; i++) {
          this.processRequest(requests[i]);
        }
      },

      processRequest: function processRequest(request) {
        try {
          if (request.aborted) {
            return;
          }

          var response = this.response || [404, {}, ""];

          if (this.responses) {
            for (var l = this.responses.length, i = l - 1; i >= 0; i--) {
              if (match.call(this, this.responses[i], request)) {
                response = this.responses[i].response;
                break;
              }
            }
          }

          if (request.readyState !== 4) {
            this.log(response, request);
            request.respond(response[0], response[1], response[2]);
          }
        } catch (e) {
          sinon.logError("Fake server request processing", e);
        }
      },

      restore: function restore() {
        return this.xhr.restore && this.xhr.restore.apply(this.xhr, arguments);
      }
    };
  }

  var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

  function loadDependencies(require, exports, module) {
    var sinon = require("./core");
    require("./fake_xdomain_request");
    require("./fake_xml_http_request");
    require("../format");
    makeApi(sinon);
    module.exports = sinon;
  }

  if (isAMD) {
    define(loadDependencies);
  } else if (isNode) {
    loadDependencies(require, module.exports, module);
  } else {
    makeApi(sinon); // eslint-disable-line no-undef
  }
}());

/**
 * Fake timer API
 * setTimeout
 * setInterval
 * clearTimeout
 * clearInterval
 * tick
 * reset
 * Date
 *
 * Inspired by jsUnitMockTimeOut from JsUnit
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
(function () {

  function makeApi(s, lol) {
    /*global lolex */
    var llx = typeof lolex !== "undefined" ? lolex : lol;

    s.useFakeTimers = function () {
      var now;
      var methods = Array.prototype.slice.call(arguments);

      if (typeof methods[0] === "string") {
        now = 0;
      } else {
        now = methods.shift();
      }

      var clock = llx.install(now || 0, methods);
      clock.restore = clock.uninstall;
      return clock;
    };

    s.clock = {
      create: function (now) {
        return llx.createClock(now);
      }
    };

    s.timers = {
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      setImmediate: (typeof setImmediate !== "undefined" ? setImmediate : undefined),
      clearImmediate: (typeof clearImmediate !== "undefined" ? clearImmediate : undefined),
      setInterval: setInterval,
      clearInterval: clearInterval,
      Date: Date
    };
  }

  var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

  function loadDependencies(require, epxorts, module, lolex) {
    var core = require("./core");
    makeApi(core, lolex);
    module.exports = core;
  }

  if (isAMD) {
    define(loadDependencies);
  } else if (isNode) {
    loadDependencies(require, module.exports, module, require("lolex"));
  } else {
    makeApi(sinon); // eslint-disable-line no-undef
  }
}());

/**
 * @depend fake_server.js
 * @depend fake_timers.js
 */
/**
 * Add-on for sinon.fakeServer that automatically handles a fake timer along with
 * the FakeXMLHttpRequest. The direct inspiration for this add-on is jQuery
 * 1.3.x, which does not use xhr object's onreadystatehandler at all - instead,
 * it polls the object for completion with setInterval. Dispite the direct
 * motivation, there is nothing jQuery-specific in this file, so it can be used
 * in any environment where the ajax implementation depends on setInterval or
 * setTimeout.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
(function () {

  function makeApi(sinon) {
    function Server() {}
    Server.prototype = sinon.fakeServer;

    sinon.fakeServerWithClock = new Server();

    sinon.fakeServerWithClock.addRequest = function addRequest(xhr) {
      if (xhr.async) {
        if (typeof setTimeout.clock === "object") {
          this.clock = setTimeout.clock;
        } else {
          this.clock = sinon.useFakeTimers();
          this.resetClock = true;
        }

        if (!this.longestTimeout) {
          var clockSetTimeout = this.clock.setTimeout;
          var clockSetInterval = this.clock.setInterval;
          var server = this;

          this.clock.setTimeout = function (fn, timeout) {
            server.longestTimeout = Math.max(timeout, server.longestTimeout || 0);

            return clockSetTimeout.apply(this, arguments);
          };

          this.clock.setInterval = function (fn, timeout) {
            server.longestTimeout = Math.max(timeout, server.longestTimeout || 0);

            return clockSetInterval.apply(this, arguments);
          };
        }
      }

      return sinon.fakeServer.addRequest.call(this, xhr);
    };

    sinon.fakeServerWithClock.respond = function respond() {
      var returnVal = sinon.fakeServer.respond.apply(this, arguments);

      if (this.clock) {
        this.clock.tick(this.longestTimeout || 0);
        this.longestTimeout = 0;

        if (this.resetClock) {
          this.clock.restore();
          this.resetClock = false;
        }
      }

      return returnVal;
    };

    sinon.fakeServerWithClock.restore = function restore() {
      if (this.clock) {
        this.clock.restore();
      }

      return sinon.fakeServer.restore.apply(this, arguments);
    };
  }

  var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

  function loadDependencies(require) {
    var sinon = require("./core");
    require("./fake_server");
    require("./fake_timers");
    makeApi(sinon);
  }

  if (isAMD) {
    define(loadDependencies);
  } else if (isNode) {
    loadDependencies(require);
  } else {
    makeApi(sinon); // eslint-disable-line no-undef
  }
}());

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function leoConfiguration() {
    var _states = [], _scenarios = {}, _requestsLog = [], _savedStates = [], _statesChangedEvent = new CustomEvent('leonardo:setStates'), _eventsElem = document.body;
    return {
        addState: addState,
        addStates: addStates,
        getActiveStateOption: getActiveStateOption,
        getStates: fetchStates,
        deactivateState: deactivateState,
        toggleActivateAll: toggleActivateAll,
        activateStateOption: activateStateOption,
        addScenario: addScenario,
        addScenarios: addScenarios,
        getScenario: getScenario,
        getScenarios: getScenarios,
        setActiveScenario: setActiveScenario,
        getRecordedStates: getRecordedStates,
        getRequestsLog: getRequestsLog,
        loadSavedStates: loadSavedStates,
        addSavedState: addSavedState,
        addOrUpdateSavedState: addOrUpdateSavedState,
        fetchStatesByUrlAndMethod: fetchStatesByUrlAndMethod,
        removeState: removeState,
        removeOption: removeOption,
        onStateChange: onSetStates,
        statesChanged: statesChanged,
        _logRequest: logRequest
    };
    function upsertOption(state, name, active) {
        var statesStatus = Leonardo.storage.getStates();
        statesStatus[state] = {
            name: name || findStateOption(state).name,
            active: active
        };
        Leonardo.storage.setStates(statesStatus);
    }
    function fetchStatesByUrlAndMethod(url, method) {
        return fetchStates().filter(function (state) {
            return state.url && new RegExp(state.url).test(url) && state.verb.toLowerCase() === method.toLowerCase();
        })[0];
    }
    function fetchStates() {
        var activeStates = Leonardo.storage.getStates();
        var statesCopy = _states.map(function (state) {
            return Object.assign({}, state);
        });
        statesCopy.forEach(function (state) {
            var option = activeStates[state.name];
            state.active = !!option && option.active;
            state.activeOption = !!option ?
                state.options.filter(function (_option) {
                    return _option.name === option.name;
                })[0] : state.options[0];
        });
        return statesCopy;
    }
    function toggleActivateAll(flag) {
        var statesStatus = fetchStates();
        var statuses = statesStatus.reduce(function (obj, s) {
            var optionName = s.activeOption ? s.activeOption.name : s.options[0].name;
            obj[s.name] = { name: optionName, active: flag };
            return obj;
        }, {});
        Leonardo.storage.setStates(statuses);
        return statesStatus;
    }
    function findStateOption(name) {
        return fetchStates().filter(function (state) {
            return state.name === name;
        })[0].activeOption;
    }
    function getActiveStateOption(name) {
        var state = fetchStates().filter(function (state) {
            return state.name === name;
        })[0];
        return (state && state.active && findStateOption(name)) || null;
    }
    function addState(stateObj, overrideOption) {
        stateObj.options.forEach(function (option) {
            upsert({
                state: stateObj.name,
                url: stateObj.url,
                verb: stateObj.verb,
                name: option.name,
                from_local: !!overrideOption,
                status: option.status,
                data: option.data,
                delay: option.delay
            }, overrideOption);
        });
    }
    function addStates(statesArr, overrideOption) {
        if (overrideOption === void 0) { overrideOption = false; }
        if (Array.isArray(statesArr)) {
            statesArr.forEach(function (stateObj) {
                addState(stateObj, overrideOption);
            });
        }
        else {
            console.warn('leonardo: addStates should get an array');
        }
    }
    function upsert(configObj, overrideOption) {
        var verb = configObj.verb || 'GET', state = configObj.state, name = configObj.name, from_local = configObj.from_local, url = configObj.url, status = configObj.status || 200, data = (typeof configObj.data !== 'undefined') ? configObj.data : {}, delay = configObj.delay || 0;
        var defaultState = {};
        var defaultOption = {};
        if (!state) {
            console.log("leonardo: cannot upsert - state is mandatory");
            return;
        }
        var stateItem = _states.filter(function (_state) {
            return _state.name === state;
        })[0] || defaultState;
        Object.assign(stateItem, {
            name: state,
            url: url || stateItem.url,
            verb: verb,
            options: stateItem.options || []
        });
        if (stateItem === defaultState) {
            _states.push(stateItem);
        }
        var option = stateItem.options.filter(function (_option) {
            return _option.name === name;
        })[0];
        if (overrideOption && option) {
            Object.assign(option, {
                name: name,
                from_local: from_local,
                status: status,
                data: data,
                delay: delay
            });
        }
        else if (!option) {
            Object.assign(defaultOption, {
                name: name,
                from_local: from_local,
                status: status,
                data: data,
                delay: delay
            });
            stateItem.options.push(defaultOption);
        }
    }
    function addScenario(scenario, fromLocal) {
        if (fromLocal === void 0) { fromLocal = false; }
        if (scenario && typeof scenario.name === 'string') {
            if (fromLocal) {
                var scenarios = Leonardo.storage.getScenarios();
                scenarios.push(scenario);
                Leonardo.storage.setScenarios(scenarios);
            }
            else {
                _scenarios[scenario.name] = scenario;
            }
        }
        else {
            throw 'addScenario method expects a scenario object with name property';
        }
    }
    function addScenarios(scenarios) {
        scenarios.forEach(function (scenario) {
            addScenario(scenario);
        });
    }
    function getScenarios() {
        var scenarios = Leonardo.storage.getScenarios().map(function (scenario) { return scenario.name; });
        return Object.keys(_scenarios).concat(scenarios);
    }
    function getScenario(name) {
        var states;
        if (_scenarios[name]) {
            states = _scenarios[name].states;
        }
        else {
            states = Leonardo.storage.getScenarios()
                .filter(function (scenario) { return scenario.name === name; })[0].states;
        }
        return states;
    }
    function setActiveScenario(name) {
        var scenario = getScenario(name);
        if (!scenario) {
            console.warn("leonardo: could not find scenario named " + name);
            return;
        }
        toggleActivateAll(false);
        scenario.forEach(function (state) {
            upsertOption(state.name, state.option, true);
        });
    }
    function activateStateOption(state, optionName) {
        upsertOption(state, optionName, true);
    }
    function deactivateState(state) {
        upsertOption(state, null, false);
    }
    function logRequest(method, url, data, status) {
        if (method && url && !(url.indexOf(".html") > 0)) {
            var req = {
                verb: method,
                data: data,
                url: url.trim(),
                status: status,
                timestamp: new Date()
            };
            req.state = fetchStatesByUrlAndMethod(req.url, req.verb);
            _requestsLog.push(req);
        }
    }
    function getRequestsLog() {
        return _requestsLog;
    }
    function loadSavedStates() {
        _savedStates = Leonardo.storage.getSavedStates();
        addStates(_savedStates, true);
    }
    function addSavedState(state) {
        _savedStates.push(state);
        Leonardo.storage.setSavedStates(_savedStates);
        addState(state, true);
    }
    function addOrUpdateSavedState(state) {
        var option = state.activeOption;
        var _savedState = _savedStates.filter(function (_state) {
            return _state.name === state.name;
        })[0];
        if (_savedState) {
            var _savedOption = _savedState.options.filter(function (_option) {
                return _option.name === option.name;
            })[0];
            if (_savedOption) {
                _savedOption.status = option.status;
                _savedOption.delay = option.delay;
                _savedOption.data = option.data;
            }
            else {
                _savedState.options.push(option);
            }
            Leonardo.storage.setSavedStates(_savedStates);
        }
        else {
            addSavedState(state);
        }
        var _state = _states.filter(function (__state) {
            return __state.name === state.name;
        })[0];
        if (_state) {
            var _option = _state.options.filter(function (__option) {
                return __option.name === option.name;
            })[0];
            if (_option) {
                _option.status = option.status;
                _option.delay = option.delay;
                _option.data = option.data;
            }
            else {
                _state.options.push(option);
            }
        }
    }
    function removeStateByName(name) {
        var index = 0;
        _states.forEach(function (state, i) {
            if (state.name === name) {
                index = i;
            }
        });
        _states.splice(index, 1);
    }
    function removeSavedStateByName(name) {
        var index = 0;
        _savedStates.forEach(function (state, i) {
            if (state.name === name) {
                index = i;
            }
        });
        _savedStates.splice(index, 1);
    }
    function removeState(state) {
        removeStateByName(state.name);
        removeSavedStateByName(state.name);
        Leonardo.storage.setSavedStates(_savedStates);
    }
    function removeStateOptionByName(stateName, optionName) {
        var sIndex = null;
        var oIndex = null;
        _states.forEach(function (state, i) {
            if (state.name === stateName) {
                sIndex = i;
            }
        });
        if (sIndex !== null) {
            _states[sIndex].options.forEach(function (option, i) {
                if (option.name === optionName) {
                    oIndex = i;
                }
            });
            if (oIndex !== null) {
                _states[sIndex].options.splice(oIndex, 1);
            }
        }
    }
    function removeSavedStateOptionByName(stateName, optionName) {
        var sIndex = null;
        var oIndex = null;
        _savedStates.forEach(function (state, i) {
            if (state.name === stateName) {
                sIndex = i;
            }
        });
        if (sIndex !== null) {
            _savedStates[sIndex].options.forEach(function (option, i) {
                if (option.name === optionName) {
                    oIndex = i;
                }
            });
            if (oIndex !== null) {
                _savedStates[sIndex].options.splice(oIndex, 1);
            }
        }
    }
    function removeOption(state, option) {
        removeStateOptionByName(state.name, option.name);
        removeSavedStateOptionByName(state.name, option.name);
        Leonardo.storage.setSavedStates(_savedStates);
        activateStateOption(_states[0].name, _states[0].options[0].name);
    }
    function getRecordedStates() {
        var requestsArr = _requestsLog
            .map(function (req) {
            var state = fetchStatesByUrlAndMethod(req.url, req.verb);
            return {
                name: state ? state.name : req.verb + " " + req.url,
                verb: req.verb,
                url: req.url,
                recorded: !!req.state,
                options: [{
                        name: req.status >= 200 && req.status < 300 ? 'Success' : 'Failure',
                        status: req.status,
                        data: req.data
                    }]
            };
        });
        return requestsArr;
    }
    function onSetStates(fn) {
        _eventsElem && _eventsElem.addEventListener('leonardo:setStates', fn, false);
    }
    function statesChanged() {
        _eventsElem && _eventsElem.dispatchEvent(_statesChangedEvent);
    }
}
exports.leoConfiguration = leoConfiguration;

},{}],2:[function(require,module,exports){
var configuration_srv_1 = require('./configuration.srv');
var storage_srv_1 = require('./storage.srv');
var polyfills_1 = require('./polyfills');
var sinon_srv_1 = require('./sinon.srv');
var ui_root_1 = require('./ui/ui-root');
polyfills_1.polifylls();
window.Leonardo = window.Leonardo || {};
var configuration = configuration_srv_1.leoConfiguration();
var storage = new storage_srv_1.Storage();
Object.assign(window.Leonardo || {}, configuration, { storage: storage });
Leonardo.loadSavedStates();
new sinon_srv_1.Sinon();
new ui_root_1.default();

},{"./configuration.srv":1,"./polyfills":3,"./sinon.srv":4,"./storage.srv":5,"./ui/ui-root":11}],3:[function(require,module,exports){
function polifylls() {
    (function () {
        function CustomEvent(event, params) {
            params = params || { bubbles: false, cancelable: false, detail: undefined };
            var evt = document.createEvent('CustomEvent');
            evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
            return evt;
        }
        CustomEvent.prototype = window['Event'].prototype;
        window['CustomEvent'] = CustomEvent;
    })();
    (function () {
        if (typeof Object.assign != 'function') {
            Object.assign = function (target) {
                'use strict';
                if (target == null) {
                    throw new TypeError('Cannot convert undefined or null to object');
                }
                target = Object(target);
                for (var index = 1; index < arguments.length; index++) {
                    var source = arguments[index];
                    if (source != null) {
                        for (var key in source) {
                            if (Object.prototype.hasOwnProperty.call(source, key)) {
                                target[key] = source[key];
                            }
                        }
                    }
                }
                return target;
            };
        }
    })();
}
exports.polifylls = polifylls;

},{}],4:[function(require,module,exports){
var utils_1 = require('./utils');
var Sinon = (function () {
    function Sinon() {
        this.init();
    }
    Sinon.prototype.init = function () {
        var server = sinon.fakeServer.create({
            autoRespond: true,
            autoRespondAfter: 10
        });
        sinon.FakeXMLHttpRequest.useFilters = true;
        sinon.FakeXMLHttpRequest.addFilter(function (method, url) {
            if (url.indexOf('.html') > 0 && url.indexOf('template') >= 0) {
                return true;
            }
            var state = Leonardo.fetchStatesByUrlAndMethod(url, method);
            return !(state && state.active);
        });
        sinon.FakeXMLHttpRequest.onResponseEnd = function (xhr) {
            var res = xhr.response;
            try {
                res = JSON.parse(xhr.response);
            }
            catch (e) {
            }
            Leonardo._logRequest(xhr.method, xhr.url, res, xhr.status);
        };
        server.respondWith(function (request) {
            var state = Leonardo.fetchStatesByUrlAndMethod(request.url, request.method), activeOption = Leonardo.getActiveStateOption(state.name);
            if (!!activeOption) {
                var responseData = utils_1.default.isFunction(activeOption.data) ? activeOption.data(request) : activeOption.data;
                request.respond(activeOption.status, { "Content-Type": "application/json" }, JSON.stringify(responseData));
                Leonardo._logRequest(request.method, request.url, responseData, activeOption.status);
            }
            else {
                console.warn('could not find a state for the following request', request);
            }
        });
    };
    return Sinon;
})();
exports.Sinon = Sinon;

},{"./utils":27}],5:[function(require,module,exports){
var utils_1 = require('./utils');
var Storage = (function () {
    function Storage() {
        this.APP_PREFIX = Leonardo.APP_PREFIX || '';
        this.STATES_STORE_KEY = this.APP_PREFIX + "leonardo-states";
        this.SAVED_STATES_KEY = this.APP_PREFIX + "leonardo-unregistered-states";
        this.SCENARIOS_STORE_KEY = this.APP_PREFIX + "leonardo-scenarios";
        this.POSITION_KEY = this.APP_PREFIX + "leonardo-position";
    }
    Storage.prototype._getItem = function (key) {
        var item = window.localStorage.getItem(key);
        if (!item) {
            return null;
        }
        return utils_1.default.fromJson(item);
    };
    Storage.prototype._setItem = function (key, data) {
        window.localStorage.setItem(key, utils_1.default.toJson(data));
    };
    Storage.prototype.getStates = function () {
        return this._getItem(this.STATES_STORE_KEY) || {};
    };
    Storage.prototype.getScenarios = function () {
        return this._getItem(this.SCENARIOS_STORE_KEY) || [];
    };
    Storage.prototype.setStates = function (states) {
        this._setItem(this.STATES_STORE_KEY, states);
        Leonardo.statesChanged();
    };
    Storage.prototype.setScenarios = function (scenarios) {
        this._setItem(this.SCENARIOS_STORE_KEY, scenarios);
    };
    Storage.prototype.getSavedStates = function () {
        var states = this._getItem(this.SAVED_STATES_KEY) || [];
        states.forEach(function (state) {
            state.options.forEach(function (option) {
                option.from_local = true;
            });
        });
        return states;
    };
    Storage.prototype.setSavedStates = function (states) {
        this._setItem(this.SAVED_STATES_KEY, states);
    };
    Storage.prototype.setSavedPosition = function (position) {
        if (!position) {
            return;
        }
        this._setItem(this.POSITION_KEY, position);
    };
    Storage.prototype.getSavedPosition = function () {
        return this._getItem(this.POSITION_KEY);
    };
    return Storage;
})();
exports.Storage = Storage;

},{"./utils":27}],6:[function(require,module,exports){
var ui_utils_1 = require('../ui-utils');
var ui_events_1 = require('../ui-events');
var DropDown = (function () {
    function DropDown(items, activeItem, isDisabled, onSelectItem, onRemoveItem) {
        this.items = items;
        this.activeItem = activeItem;
        this.isDisabled = isDisabled;
        this.onSelectItem = onSelectItem;
        this.onRemoveItem = onRemoveItem;
        this.optionsState = false;
        this.toggleBinded = this.toggleDropDown.bind(this);
        this.closeDropDownBinded = this.closeDropDown.bind(this);
        this.randomID = ui_utils_1.default.guidGenerator();
        this.viewNode = ui_utils_1.default.getElementFromHtml("<div id=\"leonardo-dropdown-" + this.randomID + "\" class=\"leonardo-dropdown\"></div>");
        document.body.addEventListener('click', this.closeDropDownBinded, false);
        ui_events_1.default.on(ui_events_1.default.CLOSE_DROPDOWNS, this.closeDropDownBinded);
    }
    DropDown.prototype.get = function () {
        return this.viewNode;
    };
    DropDown.prototype.render = function () {
        this.viewNode.removeEventListener('click', this.toggleBinded, false);
        this.viewNode.innerHTML = "\n          <div class=\"leonardo-dropdown-selected\" " + this.isDisabledToken() + ">\n            <span class=\"leonardo-dropdown-selected-text\">" + this.activeItem.name + "</span>\n            <span class=\"leonardo-dropdown-selected-arrow\"></span>\n          </div>\n          <div class=\"leonardo-dropdown-options\">\n            <ul class=\"leonardo-dropdown-list\">" + this.getItems().join('') + "</ul>\n          </div>";
        this.viewNode.addEventListener('click', this.toggleBinded, false);
    };
    DropDown.prototype.disableDropDown = function () {
        this.isDisabled = true;
        this.viewNode.querySelector(".leonardo-dropdown-selected").setAttribute('disabled', 'disabled');
    };
    DropDown.prototype.enableDropDown = function () {
        this.isDisabled = false;
        this.viewNode.querySelector(".leonardo-dropdown-selected").removeAttribute('disabled');
    };
    DropDown.prototype.toggleDropDown = function (event) {
        if (this.isDisabled) {
            return;
        }
        if (event && event.target) {
            event.stopPropagation();
        }
        if (event.target['classList'].contains('leonardo-dropdown-item')) {
            this.setActiveItem(event.target['querySelector']('.leonardo-dropdown-item-text').innerHTML);
        }
        else if (event.target['classList'].contains('leonardo-dropdown-item-text')) {
            this.setActiveItem(event.target['innerHTML']);
        }
        else if (event.target['classList'].contains('leonardo-dropdown-item-x')) {
            this.removeItem(event.target['parentNode']);
        }
        if (this.optionsState) {
            this.closeDropDown();
            this.optionsState = false;
        }
        else {
            this.openDropDown();
            this.optionsState = true;
        }
    };
    DropDown.prototype.openDropDown = function () {
        var elem = this.viewNode.querySelector(".leonardo-dropdown-options");
        elem.style.display = 'block';
        var elemRec = elem.getBoundingClientRect();
        var isOverflowed = elemRec.top + elemRec.height > window.innerHeight;
        if (isOverflowed) {
            elem.style.top = -elemRec.height + 'px';
        }
        ui_events_1.default.dispatch(ui_events_1.default.CLOSE_DROPDOWNS, this.viewNode);
    };
    DropDown.prototype.closeDropDown = function (event) {
        var dropDown = this.viewNode.querySelector(".leonardo-dropdown-options");
        if (!dropDown || (event && event.detail === this.viewNode)) {
            return;
        }
        dropDown.style.display = 'none';
    };
    DropDown.prototype.setActiveItem = function (itemName) {
        if (this.activeItem.name === itemName) {
            return;
        }
        this.activeItem = this.getItemByName(itemName);
        this.viewNode.querySelector(".leonardo-dropdown-selected-text")['innerHTML'] = this.activeItem.name;
        this.onSelectItem(this.activeItem);
    };
    DropDown.prototype.getItemByName = function (itemName) {
        var retItem = this.activeItem;
        this.items.some(function (curItem) {
            if (curItem.name === itemName) {
                retItem = curItem;
                return true;
            }
        });
        return retItem;
    };
    DropDown.prototype.getItems = function () {
        return this.items.map(function (item) {
            return "<li class=\"leonardo-dropdown-item\"><span class=\"leonardo-dropdown-item-text\">" + item.name + "</span><span class=\"leonardo-dropdown-item-x\"></span></li>";
        });
    };
    DropDown.prototype.isDisabledToken = function () {
        return this.isDisabled ? 'disabled' : '';
    };
    DropDown.prototype.removeItem = function (item) {
        if (this.items.length <= 1) {
            return;
        }
        var removedItem;
        this.items = this.items.filter(function (curItem) {
            if (curItem.name === item.querySelector('.leonardo-dropdown-item-text')['innerHTML']) {
                removedItem = curItem;
            }
        });
        this.viewNode.querySelector('.leonardo-dropdown-list').removeChild(item);
        this.onRemoveItem(removedItem);
    };
    DropDown.prototype.onDestroy = function () {
        document.body.removeEventListener('click', this.closeDropDownBinded, false);
        this.viewNode.removeEventListener('click', this.toggleBinded, false);
    };
    return DropDown;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DropDown;

},{"../ui-events":10,"../ui-utils":14}],7:[function(require,module,exports){
var ui_utils_1 = require('../ui-utils');
var ui_state_srv_1 = require('../ui-state/ui-state.srv');
var HeaderView = (function () {
    function HeaderView(tabList) {
        this.tabList = tabList;
        this.onClickBinded = this.onClick.bind(this);
    }
    HeaderView.prototype.get = function () {
        var template = "<div class=\"leonardo-header-container\">\n        <span class=\"leonardo-header-label \">LEONARDO</span>\n        <span class=\"leonardo-header-tabs\">\n          <ul>\n            " + this.getTabsHtml(0) + "\n          </ul>\n      </span>\n    </div>";
        var launcher = ui_utils_1.default.getElementFromHtml(template);
        launcher.querySelector('ul').addEventListener('click', this.onClickBinded);
        return launcher;
    };
    HeaderView.prototype.getTabsHtml = function (selectedIndex) {
        return this.tabList.map(function (tab, index) {
            var selected = index === selectedIndex ? HeaderView.SELECTED_CLASS_NAME : '';
            return "<li class=\"leonardo-header-tabItem " + selected + "\" data-headertab=\"leonardo-header-" + tab.label + "\" >" + tab.label + "</li>";
        }).join('');
    };
    HeaderView.prototype.onClick = function (event) {
        this.selectTab(event.target['innerHTML']);
    };
    HeaderView.prototype.selectTab = function (tabLabel) {
        document.querySelector("." + HeaderView.SELECTED_CLASS_NAME).classList.remove("leonardo-header-tabItem-selected");
        document.querySelector("[data-headertab=\"leonardo-header-" + tabLabel + "\"]").classList.add(HeaderView.SELECTED_CLASS_NAME);
        ui_state_srv_1.default.getInstance().setCurViewState(tabLabel);
    };
    HeaderView.SELECTED_CLASS_NAME = 'leonardo-header-tabItem-selected';
    return HeaderView;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HeaderView;

},{"../ui-state/ui-state.srv":13,"../ui-utils":14}],8:[function(require,module,exports){
var ui_utils_1 = require('../ui-utils');
var ui_events_1 = require('../ui-events');
var Launcher = (function () {
    function Launcher() {
    }
    Launcher.prototype.get = function () {
        var launcher = ui_utils_1.default.getElementFromHtml("<div class=\"leonardo-launcher\"></div>");
        launcher.addEventListener('click', this.onClick);
        return launcher;
    };
    Launcher.prototype.onClick = function () {
        ui_events_1.default.dispatch(ui_events_1.default.TOGGLE_LAUNCHER);
    };
    return Launcher;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Launcher;

},{"../ui-events":10,"../ui-utils":14}],9:[function(require,module,exports){
var ui_utils_1 = require('../ui-utils');
var ui_events_1 = require('../ui-events');
var header_1 = require('../header/header');
var ui_state_data_1 = require('../ui-state/ui-state.data');
var ui_state_srv_1 = require('../ui-state/ui-state.srv');
var views_container_1 = require('../views-container/views-container');
var MainView = (function () {
    function MainView() {
        this.className = 'leonardo-main-view';
        this.hiddenClassName = this.className + "-hidden";
        ui_events_1.default.on('keydown', this.onKeyPress.bind(this));
        this.bodyView = ui_utils_1.default.getElementFromHtml("<div class=\"leonardo-main-view-body\"></div>");
        this.menuView = ui_utils_1.default.getElementFromHtml("<div class=\"leonardo-main-view-menu\"></div>");
        ui_events_1.default.on(ui_events_1.default.TOGGLE_LAUNCHER, this.toggleView.bind(this));
        ui_state_srv_1.default.getInstance().init(ui_state_data_1.UIStateList(this.menuView), ui_state_data_1.UIStateList(this.menuView)[0].name);
        this.headerView = new header_1.default(this.getTabList());
        this.viewsContainer = new views_container_1.default();
    }
    MainView.prototype.get = function () {
        this.viewNode = ui_utils_1.default.getElementFromHtml("<div class=\"" + this.className + " " + this.hiddenClassName + "\"></div>");
        return this.viewNode;
    };
    MainView.prototype.toggleView = function () {
        var el = document.querySelector("." + this.className);
        if (!el)
            return;
        if (el.classList.contains(this.hiddenClassName)) {
            el.classList.remove(this.hiddenClassName);
            if (!el.childNodes.length) {
                this.kickStart();
            }
        }
        else {
            this.closeLeo();
        }
    };
    MainView.prototype.kickStart = function () {
        this.viewNode.appendChild(this.bodyView);
        this.viewNode.appendChild(this.menuView);
        this.bodyView.appendChild(this.headerView.get());
        this.bodyView.appendChild(this.viewsContainer.get());
        this.viewsContainer.render(ui_state_srv_1.default.getInstance().getCurViewState());
    };
    MainView.prototype.getTabList = function () {
        return ui_state_srv_1.default.getInstance().getViewStates().map(function (view) { return { label: view.name }; });
    };
    MainView.prototype.closeLeo = function () {
        var el = document.querySelector("." + this.className);
        el.classList.add(this.hiddenClassName);
    };
    MainView.prototype.onKeyPress = function (event) {
        if (event.which == 27) {
            this.closeLeo();
        }
    };
    return MainView;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MainView;

},{"../header/header":7,"../ui-events":10,"../ui-state/ui-state.data":12,"../ui-state/ui-state.srv":13,"../ui-utils":14,"../views-container/views-container":15}],10:[function(require,module,exports){
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    TOGGLE_LAUNCHER: 'leonardo:toggle:launcher',
    CHANGE_VIEW: 'leonardo:change:view',
    SCENARIO_CLICKED: 'leonardo:scenario:clicked',
    FILTER_STATES: 'leonardo:filter:states',
    CLOSE_DROPDOWNS: 'leonardo:close:dropdowns',
    TOGGLE_STATES: 'leonardo:toggle:states',
    TOGGLE_SCENARIOS: 'leonardo:toggle:scenario',
    ADD_SCENARIO: 'leonardo:add:scenario',
    TOGGLE_STATE: 'leonardo:toggle:states',
    on: function (eventName, fn) {
        document.body.addEventListener(eventName, fn);
    },
    dispatch: function (eventName, details) {
        var event = new CustomEvent(eventName, { detail: details });
        document.body.dispatchEvent(event);
    }
};

},{}],11:[function(require,module,exports){
var launcher_1 = require('./launcher/launcher');
var main_view_1 = require('./main-view/main-view');
var ui_utils_1 = require('./ui-utils');
var UIRoot = (function () {
    function UIRoot() {
        this.initBinded = this.init.bind(this);
        switch (document.readyState) {
            default:
            case 'loading':
                document.addEventListener('DOMContentLoaded', this.initBinded, false);
                break;
            case 'interactive':
            case 'complete':
                this.init();
                break;
        }
    }
    UIRoot.prototype.init = function () {
        document.removeEventListener('DOMContentLoaded', this.initBinded, false);
        this.leonardoApp = ui_utils_1.default.getElementFromHtml("<div leonardo-app></div>");
        this.launcher = new launcher_1.default();
        this.mainView = new main_view_1.default();
        this.leonardoApp.appendChild(this.launcher.get());
        this.leonardoApp.appendChild(this.mainView.get());
        document.body.addEventListener('leonardo:toggle:states', this.toggleAllStates.bind(this));
        document.body.appendChild(this.leonardoApp);
    };
    UIRoot.prototype.toggleAllStates = function (event) {
        Leonardo.toggleActivateAll(event.detail);
    };
    return UIRoot;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = UIRoot;

},{"./launcher/launcher":8,"./main-view/main-view":9,"./ui-utils":14}],12:[function(require,module,exports){
var scenarios_1 = require('../views/scenarios/scenarios');
var recorder_1 = require('../views/recorder/recorder');
var export_1 = require('../views/export/export');
var uiList;
function UIStateList(menuView) {
    if (uiList) {
        return uiList;
    }
    return uiList = [
        {
            name: 'scenarios',
            component: new scenarios_1.default()
        },
        {
            name: 'recorder',
            component: new recorder_1.default(menuView)
        },
        {
            name: 'exported code',
            component: new export_1.default()
        }
    ];
}
exports.UIStateList = UIStateList;

},{"../views/export/export":16,"../views/recorder/recorder":18,"../views/scenarios/scenarios":21}],13:[function(require,module,exports){
var ui_events_1 = require('../ui-events');
var UIStateViewService = (function () {
    function UIStateViewService() {
        if (UIStateViewService._instance) {
            throw new Error('UIStateViewService should be singleton');
        }
        UIStateViewService._instance = this;
    }
    UIStateViewService.getInstance = function () {
        return UIStateViewService._instance;
    };
    UIStateViewService.prototype.init = function (viewStateList, initViewName) {
        this.viewStateList = viewStateList;
        this.curViewState = this.getViewStateByName(initViewName);
    };
    UIStateViewService.prototype.getCurViewState = function () {
        return this.curViewState;
    };
    UIStateViewService.prototype.setCurViewState = function (stateName) {
        this.curViewState = this.getViewStateByName(stateName);
        ui_events_1.default.dispatch(ui_events_1.default.CHANGE_VIEW, this.curViewState);
    };
    UIStateViewService.prototype.getViewStates = function () {
        return this.viewStateList;
    };
    UIStateViewService.prototype.addViewState = function (viewState) {
        this.viewStateList.push(viewState);
    };
    UIStateViewService.prototype.removeViewState = function (viewStateName) {
        this.viewStateList = this.viewStateList.filter(function (view) {
            return view.name === viewStateName;
        });
    };
    UIStateViewService.prototype.getViewStateByName = function (viewStateName) {
        var retView;
        this.viewStateList.some(function (view) {
            if (viewStateName === view.name) {
                return !!(retView = view);
            }
        });
        return retView || this.curViewState;
    };
    UIStateViewService._instance = new UIStateViewService();
    return UIStateViewService;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = UIStateViewService;

},{"../ui-events":10}],14:[function(require,module,exports){
var UiUtils = (function () {
    function UiUtils() {
    }
    UiUtils.getElementFromHtml = function (html) {
        var div = document.createElement('div');
        div.innerHTML = html;
        return div.firstChild;
    };
    UiUtils.guidGenerator = function () {
        var S4 = function () {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        };
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
    };
    return UiUtils;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = UiUtils;

},{}],15:[function(require,module,exports){
var ui_utils_1 = require('../ui-utils');
var ui_events_1 = require('../ui-events');
var ViewsContainer = (function () {
    function ViewsContainer() {
        ui_events_1.default.on(ui_events_1.default.CHANGE_VIEW, this.onViewChanged.bind(this));
    }
    ViewsContainer.prototype.get = function () {
        return ui_utils_1.default.getElementFromHtml("<div id=\"leonardo-views-container\" class=\"leonardo-views-container\">view container</div>");
    };
    ViewsContainer.prototype.getViewNode = function () {
        return document.getElementById('leonardo-views-container');
    };
    ViewsContainer.prototype.render = function (viewState) {
        this.currentViewState = viewState;
        this.getViewNode().innerHTML = '';
        this.getViewNode().appendChild(viewState.component.get());
        viewState.component.render();
    };
    ViewsContainer.prototype.onViewChanged = function (event) {
        this.currentViewState.component.destroy();
        this.render(event.detail);
    };
    return ViewsContainer;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ViewsContainer;

},{"../ui-events":10,"../ui-utils":14}],16:[function(require,module,exports){
var ui_utils_1 = require('../../ui-utils');
var Export = (function () {
    function Export() {
    }
    Export.prototype.get = function () {
        return this.viewNode = ui_utils_1.default.getElementFromHtml("<div id=\"leonardo-export\" class=\"leonardo-export\">\n      <button class=\"leonardo-button exportButtons\" data-clipboard-target=\"#exportedCode\"> Copy To Clipboard</button>\n      <button class=\"leonardo-button exportButtons\" > Download Code</button>\n      <code contenteditable>\n        <div id=\"exportedCode\">\n          \n        </div>\n      </code>\n    </div>");
    };
    Export.prototype.render = function () {
    };
    Export.prototype.destroy = function () {
    };
    return Export;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Export;

},{"../../ui-utils":14}],17:[function(require,module,exports){
var ui_utils_1 = require('../../../ui-utils');
var ui_events_1 = require('../../../ui-events');
var states_detail_1 = require("../state-detail/states-detail");
var RecorderList = (function () {
    function RecorderList(menuView) {
        this.menuView = menuView;
        this.stateDetail = new states_detail_1.default();
        ui_events_1.default.on(ui_events_1.default.TOGGLE_LAUNCHER, this.render.bind(this));
    }
    RecorderList.prototype.get = function () {
        return this.viewNode = ui_utils_1.default.getElementFromHtml("<div id=\"leonardo-recorder-list\" class=\"leonardo-recorder-list\"></div>");
    };
    RecorderList.prototype.render = function () {
        if (!this.viewNode) {
            return;
        }
        var list = ui_utils_1.default.getElementFromHtml("<ul class=\"leonardo-recorder-list-container\"></ul>");
        this.getStateItems().forEach(function (item) { list.appendChild(item); });
        this.viewNode.appendChild(list);
        this.menuView.appendChild(this.stateDetail.get());
    };
    RecorderList.prototype.getStateItems = function () {
        var _this = this;
        return Leonardo.getRecordedStates().map(function (state) {
            var item = ui_utils_1.default.getElementFromHtml("<li class=\"leonardo-recorder-list-item\">");
            item.innerHTML =
                "<span class=\"leonardo-recorder-list-verb leonardo-recorder-list-verb-" + state.verb.toLowerCase() + "\">" + state.verb + "</span>\n           <span class=\"leonardo-recorder-list-url\">" + state.url + "</span>";
            item.innerHTML += state.recorded ? "<span class=\"leonardo-recorder-list-name\">" + state.name + "</span>" :
                "<span class=\"leonardo-recorder-list-name leonardo-recorder-list-name-new\">New</span>";
            item.addEventListener('click', _this.toggleDetails.bind(_this, state));
            return item;
        });
    };
    RecorderList.prototype.toggleDetails = function (state) {
        state.activeOption = state.options[0];
        this.stateDetail.open(state);
    };
    return RecorderList;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RecorderList;

},{"../../../ui-events":10,"../../../ui-utils":14,"../state-detail/states-detail":19}],18:[function(require,module,exports){
var ui_utils_1 = require('../../ui-utils');
var recorder_list_1 = require('./recorder-list/recorder-list');
var Recorder = (function () {
    function Recorder(menuView) {
        this.menuView = menuView;
        this.recorderList = new recorder_list_1.default(menuView);
    }
    Recorder.prototype.get = function () {
        return this.viewNode = ui_utils_1.default.getElementFromHtml("<div id=\"leonardo-recorder\" class=\"leonardo-recorder\"</div>");
    };
    Recorder.prototype.render = function () {
        this.viewNode.appendChild(this.recorderList.get());
        this.recorderList.render();
    };
    Recorder.prototype.destroy = function () {
        this.menuView.innerHTML = '';
    };
    return Recorder;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Recorder;

},{"../../ui-utils":14,"./recorder-list/recorder-list":17}],19:[function(require,module,exports){
var ui_utils_1 = require('../../../ui-utils');
var RecorderStateDetail = (function () {
    function RecorderStateDetail() {
        this.openState = false;
        this.onCancelBinded = this.onCancel.bind(this);
        this.onSaveBinded = this.onSave.bind(this);
        this.viewNode = ui_utils_1.default.getElementFromHtml("<div id=\"leonardo-state-detail\" class=\"leonardo-state-detail-recorder\"></div>");
    }
    RecorderStateDetail.prototype.get = function () {
        return this.viewNode;
    };
    RecorderStateDetail.prototype.render = function () {
        if (this.viewNode.innerHTML) {
            this.viewNode.querySelector('.leonardo-states-detail-cancel').removeEventListener('click', this.onCancelBinded, false);
            this.viewNode.querySelector('.leonardo-states-detail-save').removeEventListener('click', this.onSaveBinded, false);
        }
        var html;
        if (this.curState.recorded) {
            html = "<div class=\"leonardo-states-detail-header\">Add mocked response for <strong>" + this.curState.name + "</strong></div>";
        }
        else {
            html = "<h1 class=\"leonardo-states-detail-header\"/>Add new state</h1>\n              <div>State name: <input class=\"leonardo-states-detail-state-name\"/></div>";
        }
        html += "<div>Option name: <input class=\"leonardo-states-detail-option-name\" value=\"" + this.curState.options[0].name + "\"/></div>\n              <div>Status code: <input class=\"leonardo-states-detail-status\" value=\"" + this.curState.options[0].status + "\"/></div>\n              <div>Delay: <input class=\"leonardo-states-detail-delay\" value=\"0\"/></div>\n              <div>Response: <textarea class=\"leonardo-states-detail-json\">" + this.getResString(this.curState.options[0].data) + "</textarea></div>\n              <button class=\"leonardo-button leonardo-states-detail-save\">Save</button>\n              <button class=\"leonardo-button leonardo-states-detail-cancel\" >Cancel</button>";
        this.viewNode.innerHTML = html;
        this.viewNode.querySelector('.leonardo-states-detail-cancel').addEventListener('click', this.onCancelBinded, false);
        this.viewNode.querySelector('.leonardo-states-detail-save').addEventListener('click', this.onSaveBinded, false);
    };
    RecorderStateDetail.prototype.open = function (state) {
        this.curState = state;
        this.render();
        this.openState = true;
        this.viewNode.style.display = '';
    };
    RecorderStateDetail.prototype.close = function (state) {
        if (state && this.curState !== state) {
            this.open(state);
            return;
        }
        this.openState = false;
        this.viewNode.style.display = 'none';
    };
    RecorderStateDetail.prototype.toggle = function (state) {
        if (this.openState) {
            this.close(state);
            return;
        }
        this.open(state);
    };
    RecorderStateDetail.prototype.getResString = function (resopnse) {
        var resStr;
        try {
            resStr = JSON.stringify(resopnse, null, 4);
        }
        catch (e) {
            resStr = typeof resopnse === 'string' ? resopnse : resopnse.toString();
        }
        return resStr;
    };
    RecorderStateDetail.prototype.onCancel = function () {
        this.close();
    };
    RecorderStateDetail.prototype.onSave = function () {
        var statusVal = this.viewNode.querySelector(".leonardo-states-detail-status").value;
        var delayVal = this.viewNode.querySelector(".leonardo-states-detail-delay").value;
        var jsonVal = this.viewNode.querySelector(".leonardo-states-detail-json").value;
        var optionNameVal = this.viewNode.querySelector(".leonardo-states-detail-option-name").value;
        this.curState.activeOption.status = statusVal;
        this.curState.activeOption.delay = delayVal;
        this.curState.activeOption.name = optionNameVal;
        if (!this.curState.recorded) {
            this.curState.name = this.viewNode.querySelector('.leonardo-states-detail-state-name').value || this.curState.name;
        }
        try {
            this.curState.activeOption.data = JSON.parse(jsonVal);
        }
        catch (e) {
            this.curState.activeOption.data = jsonVal;
        }
        Leonardo.addOrUpdateSavedState(this.curState);
        this.close();
    };
    return RecorderStateDetail;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RecorderStateDetail;

},{"../../../ui-utils":14}],20:[function(require,module,exports){
var ui_utils_1 = require('../../../ui-utils');
var ui_events_1 = require('../../../ui-events');
var ScenariosList = (function () {
    function ScenariosList() {
        this.setScenarioBinded = this.setScenario.bind(this);
        this.viewNode = ui_utils_1.default.getElementFromHtml("<div id=\"leonardo-scenarios-list\" class=\"leonardo-scenarios-list\"></div>");
        this.viewNode.addEventListener('click', this.setScenarioBinded, false);
        ui_events_1.default.on(ui_events_1.default.ADD_SCENARIO, this.addScenario.bind(this));
    }
    ScenariosList.prototype.get = function () {
        return this.viewNode;
    };
    ScenariosList.prototype.render = function () {
        this.viewNode.innerHTML = '';
        this.viewNode.appendChild(ui_utils_1.default.getElementFromHtml("<div>Scenarios</div>"));
        var ul = ui_utils_1.default.getElementFromHtml("<ul></ul>");
        Leonardo.getScenarios()
            .map(this.getScenarioElement.bind(this))
            .forEach(function (scenarioElm) {
            ul.appendChild(scenarioElm);
        });
        this.viewNode.appendChild(ul);
    };
    ScenariosList.prototype.getScenarioElement = function (scenario) {
        var _this = this;
        var el = ui_utils_1.default.getElementFromHtml("<li>" + scenario + "</li>");
        el.addEventListener('click', function () {
            ui_events_1.default.dispatch(ui_events_1.default.SCENARIO_CLICKED, { name: scenario });
            _this.viewNode.querySelectorAll('li').forEach(function (li) { return li.classList.remove(ScenariosList.SELECTED_CLASS); });
            el.classList.add(ScenariosList.SELECTED_CLASS);
        });
        return el;
    };
    ScenariosList.prototype.setScenario = function (event) {
        var scenarioName = event.target['innerHTML'];
        var states = Leonardo.getScenario(scenarioName);
        ui_events_1.default.dispatch(ui_events_1.default.TOGGLE_STATES, false);
        states.forEach(function (state) {
            ui_events_1.default.dispatch(ui_events_1.default.TOGGLE_STATES + ":" + state.name, state.option);
        });
    };
    ScenariosList.prototype.onDestroy = function () {
        this.viewNode.removeEventListener('click', this.setScenarioBinded, false);
    };
    ScenariosList.prototype.addScenario = function (event) {
        this.render();
    };
    ScenariosList.SELECTED_CLASS = 'leonardo-selected-scenario';
    return ScenariosList;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ScenariosList;

},{"../../../ui-events":10,"../../../ui-utils":14}],21:[function(require,module,exports){
var ui_utils_1 = require('../../ui-utils');
var states_list_1 = require('./states-list/states-list');
var scenarios_list_1 = require('./scenarios-list/scenarios-list');
var Scenarios = (function () {
    function Scenarios() {
        this.stateList = new states_list_1.default();
        this.scenariosList = new scenarios_list_1.default();
    }
    Scenarios.prototype.get = function () {
        var el = ui_utils_1.default.getElementFromHtml("<div id=\"leonardo-scenarios\" class=\"leonardo-scenarios\"></div>");
        el.appendChild(this.scenariosList.get());
        el.appendChild(this.stateList.get());
        return el;
    };
    Scenarios.prototype.getViewNode = function () {
        return document.getElementById('leonardo-scenarios');
    };
    Scenarios.prototype.render = function () {
        this.stateList.render();
        this.scenariosList.render();
    };
    Scenarios.prototype.destroy = function () {
    };
    return Scenarios;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Scenarios;

},{"../../ui-utils":14,"./scenarios-list/scenarios-list":20,"./states-list/states-list":26}],22:[function(require,module,exports){
var ui_utils_1 = require('../../../../ui-utils');
var StateDetail = (function () {
    function StateDetail(onSaveCB, onCancelCB) {
        this.onSaveCB = onSaveCB;
        this.onCancelCB = onCancelCB;
        this.openState = false;
        this.onCancelBinded = this.onCancel.bind(this);
        this.onSaveBinded = this.onSave.bind(this);
        this.viewNode = ui_utils_1.default.getElementFromHtml("<div id=\"leonardo-state-detail\" class=\"leonardo-state-detail\"></div>");
    }
    StateDetail.prototype.get = function () {
        return this.viewNode;
    };
    StateDetail.prototype.render = function () {
        if (this.viewNode.innerHTML) {
            this.viewNode.querySelector('.leonardo-states-detail-cancel').removeEventListener('click', this.onCancelBinded, false);
            this.viewNode.querySelector('.leonardo-states-detail-save').removeEventListener('click', this.onSaveBinded, false);
        }
        this.viewNode.innerHTML = "\n      <div class=\"leonardo-states-detail-header\"> \n        Edit option <strong>" + this.curState.activeOption.name + "</strong>\n        for <strong>" + this.curState.name + "</strong>\n        </div>\n        <div>Status code: <input class=\"leonardo-states-detail-status\" value=\"" + this.curState.activeOption.status + "\"/></div>\n        <div>Delay: <input class=\"leonardo-states-detail-delay\" value=\"" + this.curState.activeOption.delay + "\"/></div>\n        <div>Response JSON:\n          <textarea class=\"leonardo-states-detail-json\">" + this.getResString(this.curState.activeOption.data) + "</textarea>\n        </div>\n        <button class=\"leonardo-button leonardo-states-detail-save\">Save</button>\n        <button class=\"leonardo-button leonardo-states-detail-cancel\" >Cancel</button>";
        this.viewNode.querySelector('.leonardo-states-detail-cancel').addEventListener('click', this.onCancelBinded, false);
        this.viewNode.querySelector('.leonardo-states-detail-save').addEventListener('click', this.onSaveBinded, false);
    };
    StateDetail.prototype.open = function (state) {
        this.curState = state;
        this.render();
        this.openState = true;
        this.viewNode.style.right = '0px';
    };
    StateDetail.prototype.close = function (state) {
        if (state && this.curState !== state) {
            this.open(state);
            return;
        }
        this.openState = false;
        this.viewNode.style.right = '-300px';
    };
    StateDetail.prototype.toggle = function (state) {
        if (this.openState) {
            this.close(state);
            return;
        }
        this.open(state);
    };
    StateDetail.prototype.getResString = function (resopnse) {
        var resStr;
        try {
            resStr = JSON.stringify(resopnse, null, 4);
        }
        catch (e) {
            resStr = typeof resopnse === 'string' ? resopnse : resopnse.toString();
        }
        return resStr;
    };
    StateDetail.prototype.onCancel = function () {
        this.close();
        this.onCancelCB();
    };
    StateDetail.prototype.onSave = function () {
        var statusVal = this.viewNode.querySelector(".leonardo-states-detail-status").value;
        var delayVal = this.viewNode.querySelector(".leonardo-states-detail-delay").value;
        var jsonVal = this.viewNode.querySelector(".leonardo-states-detail-json").value;
        this.curState.activeOption.status = statusVal;
        this.curState.activeOption.delay = delayVal;
        try {
            this.curState.activeOption.data = JSON.parse(jsonVal);
        }
        catch (e) {
            this.curState.activeOption.data = jsonVal;
        }
        Leonardo.addOrUpdateSavedState(this.curState);
        this.close();
        this.onSaveCB();
    };
    return StateDetail;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StateDetail;

},{"../../../../ui-utils":14}],23:[function(require,module,exports){
var ui_utils_1 = require('../../../../ui-utils');
var ui_events_1 = require('../../../../ui-events');
var drop_down_1 = require('../../../../drop-down/drop-down');
var StateItem = (function () {
    function StateItem(state, onRemove) {
        this.state = state;
        this.onRemove = onRemove;
        this.toggleBinded = this.toggleState.bind(this);
        this.removeBinded = this.removeState.bind(this);
        this.viewNode = ui_utils_1.default.getElementFromHtml("<div class=\"leonardo-state-item\"></div>");
        this.randomID = ui_utils_1.default.guidGenerator();
        this.dropDown = new drop_down_1.default(this.state.options, this.state.activeOption || this.state.options[0], !this.state.active, this.changeActiveOption.bind(this), this.removeOption.bind(this));
        ui_events_1.default.on(ui_events_1.default.TOGGLE_STATES, this.toggleAllstate.bind(this));
        ui_events_1.default.on(ui_events_1.default.TOGGLE_STATES + ":" + this.state.name, this.setStateState.bind(this));
    }
    StateItem.prototype.get = function () {
        return this.viewNode;
    };
    StateItem.prototype.render = function () {
        if (this.viewNode.innerHTML) {
            this.viewNode.querySelector(".leonardo-toggle-btn").removeEventListener('click', this.toggleBinded, false);
            this.viewNode.querySelector(".leonardo-state-remove").removeEventListener('click', this.removeBinded, false);
        }
        this.viewNode.innerHTML = "\n        <input " + this.isChecked() + " id=\"leonardo-state-toggle-" + this.randomID + "\" class=\"leonardo-toggle leonardo-toggle-ios\" type=\"checkbox\"/>\n        <label class=\"leonardo-toggle-btn\" for=\"leonardo-state-toggle-" + this.randomID + "\"></label>\n        <span class=\"leonardo-state-verb leonardo-state-verb-" + this.state.verb.toLowerCase() + "\">" + this.state.verb + "</span>\n        <span class=\"leonardo-state-name\">" + this.state.name + "</span>\n        <span class=\"leonardo-state-url\">" + (this.state.url || '') + "</span>";
        this.viewNode.appendChild(this.dropDown.get());
        this.dropDown.render();
        this.viewNode.appendChild(ui_utils_1.default.getElementFromHtml("<button title=\"Remove State\" class=\"leonardo-state-remove\">Remove</button>"));
        this.viewNode.querySelector(".leonardo-toggle-btn").addEventListener('click', this.toggleBinded, false);
        this.viewNode.querySelector(".leonardo-state-remove").addEventListener('click', this.removeBinded, false);
    };
    StateItem.prototype.getName = function () {
        return this.state.name;
    };
    StateItem.prototype.getState = function () {
        return this.state;
    };
    StateItem.prototype.toggleVisible = function (show) {
        if (show) {
            this.viewNode.classList.remove('leonardo-state-item-hidden');
        }
        else {
            this.viewNode.classList.add('leonardo-state-item-hidden');
        }
    };
    StateItem.prototype.setState = function (state, setView) {
        if (setView === void 0) { setView = true; }
        this.state.active = state;
        if (state) {
            Leonardo.activateStateOption(this.state.name, this.state.activeOption.name);
            this.dropDown.enableDropDown();
            if (setView) {
                this.viewNode.querySelector('.leonardo-toggle')['checked'] = true;
            }
        }
        else {
            Leonardo.deactivateState(this.state.name);
            this.dropDown.disableDropDown();
            if (setView) {
                this.viewNode.querySelector('.leonardo-toggle')['checked'] = false;
            }
        }
    };
    StateItem.prototype.isChecked = function () {
        return this.state.active ? 'checked' : '';
    };
    StateItem.prototype.toggleState = function (event) {
        this.setState(!this.state.active, false);
    };
    StateItem.prototype.toggleAllstate = function (event) {
        this.setState(event.detail);
    };
    StateItem.prototype.setStateState = function (event) {
        var _this = this;
        this.setState(true);
        this.state.options.some(function (option) {
            if (option.name === event.detail) {
                _this.dropDown.setActiveItem(event.detail);
                _this.changeActiveOption(option);
                return true;
            }
        });
    };
    StateItem.prototype.changeActiveOption = function (option) {
        this.state.activeOption = option;
        Leonardo.activateStateOption(this.state.name, this.state.activeOption.name);
    };
    StateItem.prototype.removeState = function (event) {
        if (event) {
            event.stopPropagation();
        }
        this.onDestroy();
        this.onRemove(this.state.name, this.viewNode);
        Leonardo.removeState(this.state);
    };
    StateItem.prototype.removeOption = function (item) {
        Leonardo.removeOption(this.state, item);
    };
    StateItem.prototype.onDestroy = function () {
        this.viewNode.querySelector(".leonardo-toggle-btn").removeEventListener('click', this.toggleBinded, false);
        this.viewNode.querySelector(".leonardo-state-remove").removeEventListener('click', this.removeBinded, false);
    };
    return StateItem;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StateItem;

},{"../../../../drop-down/drop-down":6,"../../../../ui-events":10,"../../../../ui-utils":14}],24:[function(require,module,exports){
var ui_utils_1 = require('../../../../../ui-utils');
var ui_events_1 = require('../../../../../ui-events');
var default_1 = (function () {
    function default_1() {
        this.openState = false;
        this.onCancelBinded = this.onCancel.bind(this);
        this.onSaveBinded = this.onSave.bind(this);
        this.viewNode = ui_utils_1.default.getElementFromHtml("<div id=\"leonardo-add-scenario\" class=\"leonardo-add-scenario\"></div>");
    }
    default_1.prototype.get = function () {
        return this.viewNode;
    };
    default_1.prototype.render = function () {
        if (this.viewNode.innerHTML) {
            this.viewNode.querySelector('.leonardo-add-scenario-cancel').removeEventListener('click', this.onCancelBinded, false);
            this.viewNode.querySelector('.leonardo-add-scenario-save').removeEventListener('click', this.onSaveBinded, false);
        }
        this.viewNode.innerHTML = "\n        <div class=\"leonardo-add-scenario-box\">\n          <span>Scenario Name: </span>\n          <input class=\"leonardo-add-scenario-name\"/>\n          <button class=\"leonardo-button leonardo-add-scenario-save\">Save</button>\n          <button class=\"leonardo-button leonardo-add-scenario-cancel\">Cancel</button>\n        </div>";
        this.viewNode.querySelector('.leonardo-add-scenario-cancel').addEventListener('click', this.onCancelBinded, false);
        this.viewNode.querySelector('.leonardo-add-scenario-save').addEventListener('click', this.onSaveBinded, false);
    };
    default_1.prototype.open = function () {
        this.render();
        this.openState = true;
        this.viewNode.style.display = 'block';
    };
    default_1.prototype.close = function () {
        this.openState = false;
        this.viewNode.style.display = 'none';
    };
    default_1.prototype.toggle = function () {
        if (this.openState) {
            this.close();
            return;
        }
        this.open();
    };
    default_1.prototype.onCancel = function () {
        this.close();
    };
    default_1.prototype.onSave = function () {
        this.close();
        ui_events_1.default.dispatch(ui_events_1.default.ADD_SCENARIO, this.viewNode.querySelector('.leonardo-add-scenario-name').value);
    };
    return default_1;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;

},{"../../../../../ui-events":10,"../../../../../ui-utils":14}],25:[function(require,module,exports){
var ui_utils_1 = require('../../../../ui-utils');
var ui_events_1 = require('../../../../ui-events');
var state_add_scenario_1 = require('./state-add-scenario/state-add-scenario');
var StatesBar = (function () {
    function StatesBar() {
        this.searchBinded = this.searchStates.bind(this);
        this.activateAllBinded = this.toggleActivateAll.bind(this);
        this.addScenarioBinded = this.onAddScenario.bind(this);
        this.activeAllState = false;
        this.addScenario = new state_add_scenario_1.default();
        this.curSearchData = '';
        this.viewNode = ui_utils_1.default.getElementFromHtml("<div class=\"leonardo-states-bar\"></div>");
    }
    StatesBar.prototype.get = function () {
        return this.viewNode;
    };
    StatesBar.prototype.render = function () {
        if (this.viewNode.innerHTML) {
            this.viewNode.querySelector('.leonardo-search-state').removeEventListener('keyup', this.searchBinded, false);
            this.viewNode.querySelector('.leonardo-activate-all').removeEventListener('click', this.activateAllBinded, false);
            this.viewNode.querySelector('.leonardo-add-scenario-btn').removeEventListener('click', this.addScenarioBinded, false);
        }
        this.viewNode.innerHTML = "\n        <input value=\"" + this.curSearchData + "\" class=\"leonardo-search-state\" name=\"leonardo-search-state\" type=\"text\" placeholder=\"Search...\" />\n        <div>\n          <span class=\"leonardo-button leonardo-activate-all\">Activate All</span>\n          <span class=\"leonardo-button leonardo-add-scenario-btn\">Add Scenario</span>\n        </div>";
        this.viewNode.appendChild(this.addScenario.get());
        this.addScenario.render();
        this.viewNode.querySelector('.leonardo-search-state').addEventListener('keyup', this.searchBinded, false);
        this.viewNode.querySelector('.leonardo-activate-all').addEventListener('click', this.activateAllBinded, false);
        this.viewNode.querySelector('.leonardo-add-scenario-btn').addEventListener('click', this.addScenarioBinded, false);
        this.searchStates({ target: { value: this.curSearchData } });
    };
    StatesBar.prototype.searchStates = function (evt) {
        this.curSearchData = evt.target.value;
        ui_events_1.default.dispatch(ui_events_1.default.FILTER_STATES, { val: this.curSearchData });
    };
    StatesBar.prototype.toggleActivateAll = function () {
        this.activeAllState = !this.activeAllState;
        Leonardo.toggleActivateAll(this.activeAllState);
        ui_events_1.default.dispatch(ui_events_1.default.TOGGLE_STATES, this.activeAllState);
        this.viewNode.querySelector('.leonardo-activate-all').innerHTML = this.activeAllState ? 'Deactivate all' : 'Activate all';
    };
    StatesBar.prototype.onAddScenario = function () {
        this.addScenario.open();
    };
    StatesBar.prototype.onDestroy = function () {
        this.viewNode.querySelector('.leonardo-search-state').removeEventListener('keyup', this.searchBinded, false);
    };
    return StatesBar;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StatesBar;

},{"../../../../ui-events":10,"../../../../ui-utils":14,"./state-add-scenario/state-add-scenario":24}],26:[function(require,module,exports){
var ui_utils_1 = require('../../../ui-utils');
var ui_events_1 = require('../../../ui-events');
var state_item_1 = require('./state-item/state-item');
var states_bar_1 = require('./states-bar/states-bar');
var states_detail_1 = require('./state-detail/states-detail');
var StatesList = (function () {
    function StatesList() {
        this.statesBar = new states_bar_1.default();
        this.stateDetail = new states_detail_1.default(this.onStateDetailSave.bind(this), this.clearSelected.bind(this));
        this.statesElements = [];
        this.viewNode = ui_utils_1.default.getElementFromHtml("<div id=\"leonardo-states-list\" class=\"leonardo-states-list\"></div>");
        ui_events_1.default.on(ui_events_1.default.FILTER_STATES, this.onFilterStates.bind(this));
        ui_events_1.default.on(ui_events_1.default.ADD_SCENARIO, this.addScenario.bind(this));
    }
    StatesList.prototype.get = function () {
        return this.viewNode;
    };
    StatesList.prototype.render = function () {
        var _this = this;
        this.viewNode.innerHTML = '';
        this.viewNode.appendChild(this.statesBar.get());
        this.viewNode.appendChild(this.stateDetail.get());
        this.statesElements.length = 0;
        Leonardo.getStates()
            .map(function (state) { return new state_item_1.default(state, _this.removeStateByName.bind(_this)); })
            .forEach(function (stateElm) {
            _this.statesElements.push(stateElm);
            _this.viewNode.appendChild(stateElm.get());
            stateElm.viewNode.addEventListener('click', _this.toggleDetail.bind(_this, stateElm));
            stateElm.render();
        });
        this.statesBar.render();
    };
    StatesList.prototype.onFilterStates = function (data) {
        this.statesElements.forEach(function (stateElm) {
            if (stateElm.getName().toLowerCase().indexOf(data.detail.val.toLowerCase()) >= 0) {
                stateElm.toggleVisible(true);
            }
            else {
                stateElm.toggleVisible(false);
            }
        });
    };
    StatesList.prototype.removeStateByName = function (stateName, stateView) {
        this.statesElements = this.statesElements.filter(function (state) {
            return state.getName() === stateName;
        });
        this.viewNode.removeChild(stateView);
    };
    StatesList.prototype.toggleDetail = function (stateElm, event) {
        event.stopPropagation();
        var open = stateElm.viewNode.classList.contains('leonardo-state-item-detailed');
        this.clearSelected();
        if (!open) {
            stateElm.viewNode.classList.add('leonardo-state-item-detailed');
        }
        this.stateDetail.toggle(stateElm.getState());
    };
    StatesList.prototype.clearSelected = function () {
        this.statesElements.forEach(function (curState) {
            curState.viewNode.classList.remove('leonardo-state-item-detailed');
        });
    };
    StatesList.prototype.onStateDetailSave = function () {
        this.clearSelected();
    };
    StatesList.prototype.addScenario = function (event) {
        var states = this.statesElements.map(function (stateElem) {
            return stateElem.getState();
        }).filter(function (state) { return state.active; })
            .map(function (state) {
            return {
                name: state.name,
                option: state.activeOption.name
            };
        });
        Leonardo.addScenario({
            name: event.detail,
            states: states,
            from_local: true
        }, true);
    };
    return StatesList;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StatesList;

},{"../../../ui-events":10,"../../../ui-utils":14,"./state-detail/states-detail":22,"./state-item/state-item":23,"./states-bar/states-bar":25}],27:[function(require,module,exports){
var Utils = (function () {
    function Utils() {
    }
    Utils.isUndefined = function (value) { return typeof value === 'undefined'; };
    Utils.isNumber = function (value) { return typeof value === 'number'; };
    Utils.isFunction = function (value) {
        return typeof value === 'function';
    };
    Utils.isString = function (value) { return typeof value === 'string'; };
    Utils.fromJson = function (json) {
        return this.isString(json)
            ? JSON.parse(json)
            : json;
    };
    Utils.toJson = function (obj, pretty) {
        if (this.isUndefined(obj))
            return undefined;
        if (!this.isNumber(pretty)) {
            pretty = pretty ? 2 : null;
        }
        return JSON.stringify(obj, null, pretty);
    };
    return Utils;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Utils;

},{}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvbGVvbmFyZG8vY29uZmlndXJhdGlvbi5zcnYudHMiLCJzcmMvbGVvbmFyZG8vbGVvbmFyZG8udHMiLCJzcmMvbGVvbmFyZG8vcG9seWZpbGxzLnRzIiwic3JjL2xlb25hcmRvL3Npbm9uLnNydi50cyIsInNyYy9sZW9uYXJkby9zdG9yYWdlLnNydi50cyIsInNyYy9sZW9uYXJkby91aS9kcm9wLWRvd24vZHJvcC1kb3duLnRzIiwic3JjL2xlb25hcmRvL3VpL2hlYWRlci9oZWFkZXIudHMiLCJzcmMvbGVvbmFyZG8vdWkvbGF1bmNoZXIvbGF1bmNoZXIudHMiLCJzcmMvbGVvbmFyZG8vdWkvbWFpbi12aWV3L21haW4tdmlldy50cyIsInNyYy9sZW9uYXJkby91aS91aS1ldmVudHMudHMiLCJzcmMvbGVvbmFyZG8vdWkvdWktcm9vdC50cyIsInNyYy9sZW9uYXJkby91aS91aS1zdGF0ZS91aS1zdGF0ZS5kYXRhLnRzIiwic3JjL2xlb25hcmRvL3VpL3VpLXN0YXRlL3VpLXN0YXRlLnNydi50cyIsInNyYy9sZW9uYXJkby91aS91aS11dGlscy50cyIsInNyYy9sZW9uYXJkby91aS92aWV3cy1jb250YWluZXIvdmlld3MtY29udGFpbmVyLnRzIiwic3JjL2xlb25hcmRvL3VpL3ZpZXdzL2V4cG9ydC9leHBvcnQudHMiLCJzcmMvbGVvbmFyZG8vdWkvdmlld3MvcmVjb3JkZXIvcmVjb3JkZXItbGlzdC9yZWNvcmRlci1saXN0LnRzIiwic3JjL2xlb25hcmRvL3VpL3ZpZXdzL3JlY29yZGVyL3JlY29yZGVyLnRzIiwic3JjL2xlb25hcmRvL3VpL3ZpZXdzL3JlY29yZGVyL3N0YXRlLWRldGFpbC9zdGF0ZXMtZGV0YWlsLnRzIiwic3JjL2xlb25hcmRvL3VpL3ZpZXdzL3NjZW5hcmlvcy9zY2VuYXJpb3MtbGlzdC9zY2VuYXJpb3MtbGlzdC50cyIsInNyYy9sZW9uYXJkby91aS92aWV3cy9zY2VuYXJpb3Mvc2NlbmFyaW9zLnRzIiwic3JjL2xlb25hcmRvL3VpL3ZpZXdzL3NjZW5hcmlvcy9zdGF0ZXMtbGlzdC9zdGF0ZS1kZXRhaWwvc3RhdGVzLWRldGFpbC50cyIsInNyYy9sZW9uYXJkby91aS92aWV3cy9zY2VuYXJpb3Mvc3RhdGVzLWxpc3Qvc3RhdGUtaXRlbS9zdGF0ZS1pdGVtLnRzIiwic3JjL2xlb25hcmRvL3VpL3ZpZXdzL3NjZW5hcmlvcy9zdGF0ZXMtbGlzdC9zdGF0ZXMtYmFyL3N0YXRlLWFkZC1zY2VuYXJpby9zdGF0ZS1hZGQtc2NlbmFyaW8udHMiLCJzcmMvbGVvbmFyZG8vdWkvdmlld3Mvc2NlbmFyaW9zL3N0YXRlcy1saXN0L3N0YXRlcy1iYXIvc3RhdGVzLWJhci50cyIsInNyYy9sZW9uYXJkby91aS92aWV3cy9zY2VuYXJpb3Mvc3RhdGVzLWxpc3Qvc3RhdGVzLWxpc3QudHMiLCJzcmMvbGVvbmFyZG8vdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNFQTtJQUNFLElBQUksT0FBTyxHQUFHLEVBQUUsRUFDZCxVQUFVLEdBQUcsRUFBRSxFQUNmLFlBQVksR0FBRyxFQUFFLEVBQ2pCLFlBQVksR0FBRyxFQUFFLEVBQ2pCLG1CQUFtQixHQUFHLElBQUksV0FBVyxDQUFDLG9CQUFvQixDQUFDLEVBQzNELFdBQVcsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDO0lBSTlCLE1BQU0sQ0FBQztRQUNMLFFBQVEsRUFBRSxRQUFRO1FBQ2xCLFNBQVMsRUFBRSxTQUFTO1FBQ3BCLG9CQUFvQixFQUFFLG9CQUFvQjtRQUMxQyxTQUFTLEVBQUUsV0FBVztRQUN0QixlQUFlLEVBQUUsZUFBZTtRQUNoQyxpQkFBaUIsRUFBRSxpQkFBaUI7UUFDcEMsbUJBQW1CLEVBQUUsbUJBQW1CO1FBQ3hDLFdBQVcsRUFBRSxXQUFXO1FBQ3hCLFlBQVksRUFBRSxZQUFZO1FBQzFCLFdBQVcsRUFBRSxXQUFXO1FBQ3hCLFlBQVksRUFBRSxZQUFZO1FBQzFCLGlCQUFpQixF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RCxDQTNCQSxBQTJCQyxJQUFBO0FBM0JEO3VCQTJCQyxDQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJsZW9uYXJkby5kLnRzXCIgLz5cbmRlY2xhcmUgdmFyIE9iamVjdDogYW55O1xuZXhwb3J0IGZ1bmN0aW9uIGxlb0NvbmZpZ3VyYXRpb24gKCkge1xuICB2YXIgX3N0YXRlcyA9IFtdLFxuICAgIF9zY2VuYXJpb3MgPSB7fSxcbiAgICBfcmVxdWVzdHNMb2cgPSBbXSxcbiAgICBfc2F2ZWRTdGF0ZXMgPSBbXSxcbiAgICBfc3RhdGVzQ2hhbmdlZEV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCdsZW9uYXJkbzpzZXRTdGF0ZXMnKSxcbiAgICBfZXZlbnRzRWxlbSA9IGRvY3VtZW50LmJvZHk7XG4gIFxuICAvLyBDb3JlIEFQSVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tXG4gIHJldHVybiB7XG4gICAgYWRkU3RhdGU6IGFkZFN0YXRlLFxuICAgIGFkZFN0YXRlczogYWRkU3RhdGVzLFxuICAgIGdldEFjdGl2ZVN0YXRlT3B0aW9uOiBnZXRBY3RpdmVTdGF0ZU9wdGlvbixcbiAgICBnZXRTdGF0ZXM6IGZldGNoU3RhdGVzLFxuICAgIGRlYWN0aXZhdGVTdGF0ZTogZGVhY3RpdmF0ZVN0YXRlLFxuICAgIHRvZ2dsZUFjdGl2YXRlQWxsOiB0b2dnbGVBY3RpdmF0ZUFsbCxcbiAgICBhY3RpdmF0ZVN0YXRlT3B0aW9uOiBhY3RpdmF0ZVN0YXRlT3B0aW9uLFxuICAgIGFkZFNjZW5hcmlvOiBhZGRTY2VuYXJpbyxcbiAgICBhZGRTY2VuYXJpb3M6IGFkZFNjZW5hcmlvcyxcbiAgICBnZXRTY2VuYXJpbzogZ2V0U2NlbmFyaW8sXG4gICAgZ2V0U2NlbmFyaW9zOiBnZXRTY2VuYXJpb3MsXG4gICAgc2V0QWN0aXZlU2NlbmFyaW86IHNldEFjdGl2ZVNjZW5hcmlvLFxuICAgIGdldFJlY29yZGVkU3RhdGVzOiBnZXRSZWNvcmRlZFN0YXRlcyxcbiAgICBnZXRSZXF1ZXN0c0xvZzogZ2V0UmVxdWVzdHNMb2csXG4gICAgbG9hZFNhdmVkU3RhdGVzOiBsb2FkU2F2ZWRTdGF0ZXMsXG4gICAgYWRkU2F2ZWRTdGF0ZTogYWRkU2F2ZWRTdGF0ZSxcbiAgICBhZGRPclVwZGF0ZVNhdmVkU3RhdGU6IGFkZE9yVXBkYXRlU2F2ZWRTdGF0ZSxcbiAgICBmZXRjaFN0YXRlc0J5VXJsQW5kTWV0aG9kOiBmZXRjaFN0YXRlc0J5VXJsQW5kTWV0aG9kLFxuICAgIHJlbW92ZVN0YXRlOiByZW1vdmVTdGF0ZSxcbiAgICByZW1vdmVPcHRpb246IHJlbW92ZU9wdGlvbixcbiAgICBvblN0YXRlQ2hhbmdlOiBvblNldFN0YXRlcyxcbiAgICBzdGF0ZXNDaGFuZ2VkOiBzdGF0ZXNDaGFuZ2VkLFxuICAgIF9sb2dSZXF1ZXN0OiBsb2dSZXF1ZXN0XG4gIH07XG5cbiAgZnVuY3Rpb24gdXBzZXJ0T3B0aW9uKHN0YXRlLCBuYW1lLCBhY3RpdmUpIHtcbiAgICB2YXIgc3RhdGVzU3RhdHVzID0gTGVvbmFyZG8uc3RvcmFnZS5nZXRTdGF0ZXMoKTtcbiAgICBzdGF0ZXNTdGF0dXNbc3RhdGVdID0ge1xuICAgICAgbmFtZTogbmFtZSB8fCBmaW5kU3RhdGVPcHRpb24oc3RhdGUpLm5hbWUsXG4gICAgICBhY3RpdmU6IGFjdGl2ZVxuICAgIH07XG5cbiAgICBMZW9uYXJkby5zdG9yYWdlLnNldFN0YXRlcyhzdGF0ZXNTdGF0dXMpO1xuICB9XG5cbiAgZnVuY3Rpb24gZmV0Y2hTdGF0ZXNCeVVybEFuZE1ldGhvZCh1cmwsIG1ldGhvZCkge1xuICAgIHJldHVybiBmZXRjaFN0YXRlcygpLmZpbHRlcihmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgIHJldHVybiBzdGF0ZS51cmwgJiYgbmV3IFJlZ0V4cChzdGF0ZS51cmwpLnRlc3QodXJsKSAmJiBzdGF0ZS52ZXJiLnRvTG93ZXJDYXNlKCkgPT09IG1ldGhvZC50b0xvd2VyQ2FzZSgpO1xuICAgIH0pWzBdO1xuICB9XG5cbiAgZnVuY3Rpb24gZmV0Y2hTdGF0ZXMoKSB7XG4gICAgdmFyIGFjdGl2ZVN0YXRlcyA9IExlb25hcmRvLnN0b3JhZ2UuZ2V0U3RhdGVzKCk7XG4gICAgdmFyIHN0YXRlc0NvcHkgPSBfc3RhdGVzLm1hcChmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCBzdGF0ZSk7XG4gICAgfSk7XG5cbiAgICBzdGF0ZXNDb3B5LmZvckVhY2goZnVuY3Rpb24gKHN0YXRlOiBhbnkpIHtcbiAgICAgIHZhciBvcHRpb24gPSBhY3RpdmVTdGF0ZXNbc3RhdGUubmFtZV07XG4gICAgICBzdGF0ZS5hY3RpdmUgPSAhIW9wdGlvbiAmJiBvcHRpb24uYWN0aXZlO1xuICAgICAgc3RhdGUuYWN0aXZlT3B0aW9uID0gISFvcHRpb24gP1xuICAgICAgICBzdGF0ZS5vcHRpb25zLmZpbHRlcihmdW5jdGlvbiAoX29wdGlvbikge1xuICAgICAgICAgIHJldHVybiBfb3B0aW9uLm5hbWUgPT09IG9wdGlvbi5uYW1lO1xuICAgICAgICB9KVswXSA6IHN0YXRlLm9wdGlvbnNbMF07XG4gICAgfSk7XG5cbiAgICByZXR1cm4gc3RhdGVzQ29weTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRvZ2dsZUFjdGl2YXRlQWxsKGZsYWc6IGJvb2xlYW4pIHtcbiAgICBsZXQgc3RhdGVzU3RhdHVzID0gZmV0Y2hTdGF0ZXMoKTtcbiAgICBjb25zdCBzdGF0dXNlcyA9IHN0YXRlc1N0YXR1cy5yZWR1Y2UoKG9iaiwgcykgPT4ge1xuICAgICAgICB2YXIgb3B0aW9uTmFtZSA9IHMuYWN0aXZlT3B0aW9uID8gcy5hY3RpdmVPcHRpb24ubmFtZSA6IHMub3B0aW9uc1swXS5uYW1lO1xuICAgICAgICBvYmpbcy5uYW1lXSA9IHtuYW1lOiBvcHRpb25OYW1lLCBhY3RpdmU6IGZsYWd9O1xuICAgICAgICByZXR1cm4gb2JqO1xuICAgICAgfVxuICAgICwge30pO1xuICAgIExlb25hcmRvLnN0b3JhZ2Uuc2V0U3RhdGVzKHN0YXR1c2VzKTtcbiAgICByZXR1cm4gc3RhdGVzU3RhdHVzO1xuICB9XG5cbiAgZnVuY3Rpb24gZmluZFN0YXRlT3B0aW9uKG5hbWUpIHtcbiAgICByZXR1cm4gZmV0Y2hTdGF0ZXMoKS5maWx0ZXIoZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICByZXR1cm4gc3RhdGUubmFtZSA9PT0gbmFtZTtcbiAgICB9KVswXS5hY3RpdmVPcHRpb247XG4gIH1cblxuICBmdW5jdGlvbiBnZXRBY3RpdmVTdGF0ZU9wdGlvbihuYW1lKSB7XG4gICAgdmFyIHN0YXRlID0gZmV0Y2hTdGF0ZXMoKS5maWx0ZXIoZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICByZXR1cm4gc3RhdGUubmFtZSA9PT0gbmFtZVxuICAgIH0pWzBdO1xuICAgIHJldHVybiAoc3RhdGUgJiYgc3RhdGUuYWN0aXZlICYmIGZpbmRTdGF0ZU9wdGlvbihuYW1lKSkgfHwgbnVsbDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZFN0YXRlKHN0YXRlT2JqLCBvdmVycmlkZU9wdGlvbikge1xuXG4gICAgc3RhdGVPYmoub3B0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChvcHRpb24pIHtcbiAgICAgIHVwc2VydCh7XG4gICAgICAgIHN0YXRlOiBzdGF0ZU9iai5uYW1lLFxuICAgICAgICB1cmw6IHN0YXRlT2JqLnVybCxcbiAgICAgICAgdmVyYjogc3RhdGVPYmoudmVyYixcbiAgICAgICAgbmFtZTogb3B0aW9uLm5hbWUsXG4gICAgICAgIGZyb21fbG9jYWw6ICEhb3ZlcnJpZGVPcHRpb24sXG4gICAgICAgIHN0YXR1czogb3B0aW9uLnN0YXR1cyxcbiAgICAgICAgZGF0YTogb3B0aW9uLmRhdGEsXG4gICAgICAgIGRlbGF5OiBvcHRpb24uZGVsYXlcbiAgICAgIH0sIG92ZXJyaWRlT3B0aW9uKTtcbiAgICB9KTtcblxuICAgIC8vJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdsZW9uYXJkbzpzdGF0ZUNoYW5nZWQnLCBzdGF0ZU9iaik7XG4gIH1cblxuICBmdW5jdGlvbiBhZGRTdGF0ZXMoc3RhdGVzQXJyLCBvdmVycmlkZU9wdGlvbiA9IGZhbHNlKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoc3RhdGVzQXJyKSkge1xuICAgICAgc3RhdGVzQXJyLmZvckVhY2goZnVuY3Rpb24gKHN0YXRlT2JqKSB7XG4gICAgICAgIGFkZFN0YXRlKHN0YXRlT2JqLCBvdmVycmlkZU9wdGlvbik7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS53YXJuKCdsZW9uYXJkbzogYWRkU3RhdGVzIHNob3VsZCBnZXQgYW4gYXJyYXknKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB1cHNlcnQoY29uZmlnT2JqLCBvdmVycmlkZU9wdGlvbikge1xuICAgIHZhciB2ZXJiID0gY29uZmlnT2JqLnZlcmIgfHwgJ0dFVCcsXG4gICAgICBzdGF0ZSA9IGNvbmZpZ09iai5zdGF0ZSxcbiAgICAgIG5hbWUgPSBjb25maWdPYmoubmFtZSxcbiAgICAgIGZyb21fbG9jYWwgPSBjb25maWdPYmouZnJvbV9sb2NhbCxcbiAgICAgIHVybCA9IGNvbmZpZ09iai51cmwsXG4gICAgICBzdGF0dXMgPSBjb25maWdPYmouc3RhdHVzIHx8IDIwMCxcbiAgICAgIGRhdGEgPSAodHlwZW9mIGNvbmZpZ09iai5kYXRhICE9PSAndW5kZWZpbmVkJykgPyBjb25maWdPYmouZGF0YSA6IHt9LFxuICAgICAgZGVsYXkgPSBjb25maWdPYmouZGVsYXkgfHwgMDtcbiAgICB2YXIgZGVmYXVsdFN0YXRlID0ge307XG5cbiAgICB2YXIgZGVmYXVsdE9wdGlvbiA9IHt9O1xuXG4gICAgaWYgKCFzdGF0ZSkge1xuICAgICAgY29uc29sZS5sb2coXCJsZW9uYXJkbzogY2Fubm90IHVwc2VydCAtIHN0YXRlIGlzIG1hbmRhdG9yeVwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgc3RhdGVJdGVtID0gX3N0YXRlcy5maWx0ZXIoZnVuY3Rpb24gKF9zdGF0ZSkge1xuICAgICAgICByZXR1cm4gX3N0YXRlLm5hbWUgPT09IHN0YXRlO1xuICAgICAgfSlbMF0gfHwgZGVmYXVsdFN0YXRlO1xuXG4gICAgT2JqZWN0LmFzc2lnbihzdGF0ZUl0ZW0sIHtcbiAgICAgIG5hbWU6IHN0YXRlLFxuICAgICAgdXJsOiB1cmwgfHwgc3RhdGVJdGVtLnVybCxcbiAgICAgIHZlcmI6IHZlcmIsXG4gICAgICBvcHRpb25zOiBzdGF0ZUl0ZW0ub3B0aW9ucyB8fCBbXVxuICAgIH0pO1xuXG5cbiAgICBpZiAoc3RhdGVJdGVtID09PSBkZWZhdWx0U3RhdGUpIHtcbiAgICAgIF9zdGF0ZXMucHVzaChzdGF0ZUl0ZW0pO1xuICAgIH1cblxuICAgIHZhciBvcHRpb24gPSBzdGF0ZUl0ZW0ub3B0aW9ucy5maWx0ZXIoZnVuY3Rpb24gKF9vcHRpb24pIHtcbiAgICAgIHJldHVybiBfb3B0aW9uLm5hbWUgPT09IG5hbWVcbiAgICB9KVswXTtcblxuICAgIGlmIChvdmVycmlkZU9wdGlvbiAmJiBvcHRpb24pIHtcbiAgICAgIE9iamVjdC5hc3NpZ24ob3B0aW9uLCB7XG4gICAgICAgIG5hbWU6IG5hbWUsXG4gICAgICAgIGZyb21fbG9jYWw6IGZyb21fbG9jYWwsXG4gICAgICAgIHN0YXR1czogc3RhdHVzLFxuICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICBkZWxheTogZGVsYXlcbiAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIGlmICghb3B0aW9uKSB7XG4gICAgICBPYmplY3QuYXNzaWduKGRlZmF1bHRPcHRpb24sIHtcbiAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgZnJvbV9sb2NhbDogZnJvbV9sb2NhbCxcbiAgICAgICAgc3RhdHVzOiBzdGF0dXMsXG4gICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgIGRlbGF5OiBkZWxheVxuICAgICAgfSk7XG5cbiAgICAgIHN0YXRlSXRlbS5vcHRpb25zLnB1c2goZGVmYXVsdE9wdGlvbik7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYWRkU2NlbmFyaW8oc2NlbmFyaW8sIGZyb21Mb2NhbDogYm9vbGVhbiA9IGZhbHNlKSB7XG4gICAgaWYgKHNjZW5hcmlvICYmIHR5cGVvZiBzY2VuYXJpby5uYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgaWYgKGZyb21Mb2NhbCkge1xuICAgICAgICBjb25zdCBzY2VuYXJpb3MgPSBMZW9uYXJkby5zdG9yYWdlLmdldFNjZW5hcmlvcygpO1xuICAgICAgICBzY2VuYXJpb3MucHVzaChzY2VuYXJpbyk7XG4gICAgICAgIExlb25hcmRvLnN0b3JhZ2Uuc2V0U2NlbmFyaW9zKHNjZW5hcmlvcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBfc2NlbmFyaW9zW3NjZW5hcmlvLm5hbWVdID0gc2NlbmFyaW87XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93ICdhZGRTY2VuYXJpbyBtZXRob2QgZXhwZWN0cyBhIHNjZW5hcmlvIG9iamVjdCB3aXRoIG5hbWUgcHJvcGVydHknO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZFNjZW5hcmlvcyhzY2VuYXJpb3MpIHtcbiAgICBzY2VuYXJpb3MuZm9yRWFjaCgoc2NlbmFyaW8pID0+IHtcbiAgICAgIGFkZFNjZW5hcmlvKHNjZW5hcmlvKTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFNjZW5hcmlvcygpIHtcbiAgICBjb25zdCBzY2VuYXJpb3MgPSBMZW9uYXJkby5zdG9yYWdlLmdldFNjZW5hcmlvcygpLm1hcCgoc2NlbmFyaW86IGFueSkgPT4gc2NlbmFyaW8ubmFtZSk7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKF9zY2VuYXJpb3MpLmNvbmNhdChzY2VuYXJpb3MpO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0U2NlbmFyaW8obmFtZTogc3RyaW5nKSB7XG4gICAgbGV0IHN0YXRlcztcbiAgICBpZiAoX3NjZW5hcmlvc1tuYW1lXSkge1xuICAgICAgc3RhdGVzID0gX3NjZW5hcmlvc1tuYW1lXS5zdGF0ZXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXRlcyA9IExlb25hcmRvLnN0b3JhZ2UuZ2V0U2NlbmFyaW9zKClcbiAgICAgICAgLmZpbHRlcigoc2NlbmFyaW8pID0+IHNjZW5hcmlvLm5hbWUgPT09IG5hbWUpWzBdLnN0YXRlcztcbiAgICB9XG5cbiAgICByZXR1cm4gc3RhdGVzO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0QWN0aXZlU2NlbmFyaW8obmFtZSkge1xuICAgIHZhciBzY2VuYXJpbyA9IGdldFNjZW5hcmlvKG5hbWUpO1xuICAgIGlmICghc2NlbmFyaW8pIHtcbiAgICAgIGNvbnNvbGUud2FybihcImxlb25hcmRvOiBjb3VsZCBub3QgZmluZCBzY2VuYXJpbyBuYW1lZCBcIiArIG5hbWUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0b2dnbGVBY3RpdmF0ZUFsbChmYWxzZSk7XG4gICAgc2NlbmFyaW8uZm9yRWFjaChmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgIHVwc2VydE9wdGlvbihzdGF0ZS5uYW1lLCBzdGF0ZS5vcHRpb24sIHRydWUpO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gYWN0aXZhdGVTdGF0ZU9wdGlvbihzdGF0ZSwgb3B0aW9uTmFtZSkge1xuICAgIHVwc2VydE9wdGlvbihzdGF0ZSwgb3B0aW9uTmFtZSwgdHJ1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBkZWFjdGl2YXRlU3RhdGUoc3RhdGUpIHtcbiAgICB1cHNlcnRPcHRpb24oc3RhdGUsIG51bGwsIGZhbHNlKTtcbiAgfVxuXG4gIGludGVyZmFjZSBJTmV0d29ya1JlcXVlc3Qge1xuICAgIHZlcmI6IEZ1bmN0aW9uO1xuICAgIGRhdGE6IGFueTtcbiAgICB1cmw/OiBzdHJpbmc7XG4gICAgc3RhdHVzOiBzdHJpbmc7XG4gICAgdGltZXN0YW1wOiBEYXRlO1xuICAgIHN0YXRlPzogc3RyaW5nO1xuICB9XG5cbiAgZnVuY3Rpb24gbG9nUmVxdWVzdChtZXRob2QsIHVybCwgZGF0YSwgc3RhdHVzKSB7XG4gICAgaWYgKG1ldGhvZCAmJiB1cmwgJiYgISh1cmwuaW5kZXhPZihcIi5odG1sXCIpID4gMCkpIHtcbiAgICAgIHZhciByZXE6IElOZXR3b3JrUmVxdWVzdCA9IHtcbiAgICAgICAgdmVyYjogbWV0aG9kLFxuICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICB1cmw6IHVybC50cmltKCksXG4gICAgICAgIHN0YXR1czogc3RhdHVzLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKClcbiAgICAgIH07XG4gICAgICByZXEuc3RhdGUgPSBmZXRjaFN0YXRlc0J5VXJsQW5kTWV0aG9kKHJlcS51cmwsIHJlcS52ZXJiKTtcbiAgICAgIF9yZXF1ZXN0c0xvZy5wdXNoKHJlcSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0UmVxdWVzdHNMb2coKSB7XG4gICAgcmV0dXJuIF9yZXF1ZXN0c0xvZztcbiAgfVxuXG4gIGZ1bmN0aW9uIGxvYWRTYXZlZFN0YXRlcygpIHtcbiAgICBfc2F2ZWRTdGF0ZXMgPSBMZW9uYXJkby5zdG9yYWdlLmdldFNhdmVkU3RhdGVzKCk7XG4gICAgYWRkU3RhdGVzKF9zYXZlZFN0YXRlcywgdHJ1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBhZGRTYXZlZFN0YXRlKHN0YXRlKSB7XG4gICAgX3NhdmVkU3RhdGVzLnB1c2goc3RhdGUpO1xuICAgIExlb25hcmRvLnN0b3JhZ2Uuc2V0U2F2ZWRTdGF0ZXMoX3NhdmVkU3RhdGVzKTtcbiAgICBhZGRTdGF0ZShzdGF0ZSwgdHJ1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBhZGRPclVwZGF0ZVNhdmVkU3RhdGUoc3RhdGUpIHtcbiAgICB2YXIgb3B0aW9uID0gc3RhdGUuYWN0aXZlT3B0aW9uO1xuXG4gICAgLy91cGRhdGUgbG9jYWwgc3RvcmFnZSBzdGF0ZVxuICAgIHZhciBfc2F2ZWRTdGF0ZSA9IF9zYXZlZFN0YXRlcy5maWx0ZXIoZnVuY3Rpb24gKF9zdGF0ZSkge1xuICAgICAgcmV0dXJuIF9zdGF0ZS5uYW1lID09PSBzdGF0ZS5uYW1lO1xuICAgIH0pWzBdO1xuXG4gICAgaWYgKF9zYXZlZFN0YXRlKSB7XG4gICAgICB2YXIgX3NhdmVkT3B0aW9uID0gX3NhdmVkU3RhdGUub3B0aW9ucy5maWx0ZXIoZnVuY3Rpb24gKF9vcHRpb24pIHtcbiAgICAgICAgcmV0dXJuIF9vcHRpb24ubmFtZSA9PT0gb3B0aW9uLm5hbWU7XG4gICAgICB9KVswXTtcblxuICAgICAgaWYgKF9zYXZlZE9wdGlvbikge1xuICAgICAgICBfc2F2ZWRPcHRpb24uc3RhdHVzID0gb3B0aW9uLnN0YXR1cztcbiAgICAgICAgX3NhdmVkT3B0aW9uLmRlbGF5ID0gb3B0aW9uLmRlbGF5O1xuICAgICAgICBfc2F2ZWRPcHRpb24uZGF0YSA9IG9wdGlvbi5kYXRhO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIF9zYXZlZFN0YXRlLm9wdGlvbnMucHVzaChvcHRpb24pO1xuICAgICAgfVxuXG4gICAgICBMZW9uYXJkby5zdG9yYWdlLnNldFNhdmVkU3RhdGVzKF9zYXZlZFN0YXRlcyk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgYWRkU2F2ZWRTdGF0ZShzdGF0ZSk7XG4gICAgfVxuXG4gICAgLy91cGRhdGUgaW4gbWVtb3J5IHN0YXRlXG4gICAgdmFyIF9zdGF0ZSA9IF9zdGF0ZXMuZmlsdGVyKGZ1bmN0aW9uIChfX3N0YXRlKSB7XG4gICAgICByZXR1cm4gX19zdGF0ZS5uYW1lID09PSBzdGF0ZS5uYW1lO1xuICAgIH0pWzBdO1xuXG4gICAgaWYgKF9zdGF0ZSkge1xuICAgICAgdmFyIF9vcHRpb24gPSBfc3RhdGUub3B0aW9ucy5maWx0ZXIoZnVuY3Rpb24gKF9fb3B0aW9uKSB7XG4gICAgICAgIHJldHVybiBfX29wdGlvbi5uYW1lID09PSBvcHRpb24ubmFtZTtcbiAgICAgIH0pWzBdO1xuXG4gICAgICBpZiAoX29wdGlvbikge1xuICAgICAgICBfb3B0aW9uLnN0YXR1cyA9IG9wdGlvbi5zdGF0dXM7XG4gICAgICAgIF9vcHRpb24uZGVsYXkgPSBvcHRpb24uZGVsYXk7XG4gICAgICAgIF9vcHRpb24uZGF0YSA9IG9wdGlvbi5kYXRhO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIF9zdGF0ZS5vcHRpb25zLnB1c2gob3B0aW9uKTtcbiAgICAgIH1cblxuICAgICAgLy8kcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2xlb25hcmRvOnN0YXRlQ2hhbmdlZCcsIF9zdGF0ZSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlU3RhdGVCeU5hbWUobmFtZSkge1xuICAgIHZhciBpbmRleCA9IDA7XG4gICAgX3N0YXRlcy5mb3JFYWNoKGZ1bmN0aW9uIChzdGF0ZSwgaSkge1xuICAgICAgaWYgKHN0YXRlLm5hbWUgPT09IG5hbWUpIHtcbiAgICAgICAgaW5kZXggPSBpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgX3N0YXRlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlU2F2ZWRTdGF0ZUJ5TmFtZShuYW1lKSB7XG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICBfc2F2ZWRTdGF0ZXMuZm9yRWFjaChmdW5jdGlvbiAoc3RhdGUsIGkpIHtcbiAgICAgIGlmIChzdGF0ZS5uYW1lID09PSBuYW1lKSB7XG4gICAgICAgIGluZGV4ID0gaTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIF9zYXZlZFN0YXRlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlU3RhdGUoc3RhdGUpIHtcblxuICAgIHJlbW92ZVN0YXRlQnlOYW1lKHN0YXRlLm5hbWUpO1xuICAgIHJlbW92ZVNhdmVkU3RhdGVCeU5hbWUoc3RhdGUubmFtZSk7XG5cbiAgICBMZW9uYXJkby5zdG9yYWdlLnNldFNhdmVkU3RhdGVzKF9zYXZlZFN0YXRlcyk7XG4gIH1cblxuICBmdW5jdGlvbiByZW1vdmVTdGF0ZU9wdGlvbkJ5TmFtZShzdGF0ZU5hbWUsIG9wdGlvbk5hbWUpIHtcbiAgICB2YXIgc0luZGV4ID0gbnVsbDtcbiAgICB2YXIgb0luZGV4ID0gbnVsbDtcblxuICAgIF9zdGF0ZXMuZm9yRWFjaChmdW5jdGlvbiAoc3RhdGUsIGkpIHtcbiAgICAgIGlmIChzdGF0ZS5uYW1lID09PSBzdGF0ZU5hbWUpIHtcbiAgICAgICAgc0luZGV4ID0gaTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGlmIChzSW5kZXggIT09IG51bGwpIHtcbiAgICAgIF9zdGF0ZXNbc0luZGV4XS5vcHRpb25zLmZvckVhY2goZnVuY3Rpb24gKG9wdGlvbiwgaSkge1xuICAgICAgICBpZiAob3B0aW9uLm5hbWUgPT09IG9wdGlvbk5hbWUpIHtcbiAgICAgICAgICBvSW5kZXggPSBpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgaWYgKG9JbmRleCAhPT0gbnVsbCkge1xuICAgICAgICBfc3RhdGVzW3NJbmRleF0ub3B0aW9ucy5zcGxpY2Uob0luZGV4LCAxKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZW1vdmVTYXZlZFN0YXRlT3B0aW9uQnlOYW1lKHN0YXRlTmFtZSwgb3B0aW9uTmFtZSkge1xuICAgIHZhciBzSW5kZXggPSBudWxsO1xuICAgIHZhciBvSW5kZXggPSBudWxsO1xuXG4gICAgX3NhdmVkU3RhdGVzLmZvckVhY2goZnVuY3Rpb24gKHN0YXRlLCBpKSB7XG4gICAgICBpZiAoc3RhdGUubmFtZSA9PT0gc3RhdGVOYW1lKSB7XG4gICAgICAgIHNJbmRleCA9IGk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAoc0luZGV4ICE9PSBudWxsKSB7XG4gICAgICBfc2F2ZWRTdGF0ZXNbc0luZGV4XS5vcHRpb25zLmZvckVhY2goZnVuY3Rpb24gKG9wdGlvbiwgaSkge1xuICAgICAgICBpZiAob3B0aW9uLm5hbWUgPT09IG9wdGlvbk5hbWUpIHtcbiAgICAgICAgICBvSW5kZXggPSBpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgaWYgKG9JbmRleCAhPT0gbnVsbCkge1xuICAgICAgICBfc2F2ZWRTdGF0ZXNbc0luZGV4XS5vcHRpb25zLnNwbGljZShvSW5kZXgsIDEpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbW92ZU9wdGlvbihzdGF0ZSwgb3B0aW9uKSB7XG4gICAgcmVtb3ZlU3RhdGVPcHRpb25CeU5hbWUoc3RhdGUubmFtZSwgb3B0aW9uLm5hbWUpO1xuICAgIHJlbW92ZVNhdmVkU3RhdGVPcHRpb25CeU5hbWUoc3RhdGUubmFtZSwgb3B0aW9uLm5hbWUpO1xuXG4gICAgTGVvbmFyZG8uc3RvcmFnZS5zZXRTYXZlZFN0YXRlcyhfc2F2ZWRTdGF0ZXMpO1xuXG4gICAgYWN0aXZhdGVTdGF0ZU9wdGlvbihfc3RhdGVzWzBdLm5hbWUsIF9zdGF0ZXNbMF0ub3B0aW9uc1swXS5uYW1lKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFJlY29yZGVkU3RhdGVzKCkge1xuICAgIHZhciByZXF1ZXN0c0FyciA9IF9yZXF1ZXN0c0xvZ1xuICAgICAgLm1hcChmdW5jdGlvbiAocmVxKSB7XG4gICAgICAgIHZhciBzdGF0ZSA9IGZldGNoU3RhdGVzQnlVcmxBbmRNZXRob2QocmVxLnVybCwgcmVxLnZlcmIpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG5hbWU6IHN0YXRlID8gc3RhdGUubmFtZSA6IHJlcS52ZXJiICsgXCIgXCIgKyByZXEudXJsLFxuICAgICAgICAgIHZlcmI6IHJlcS52ZXJiLFxuICAgICAgICAgIHVybDogcmVxLnVybCxcbiAgICAgICAgICByZWNvcmRlZDogISFyZXEuc3RhdGUsXG4gICAgICAgICAgb3B0aW9uczogW3tcbiAgICAgICAgICAgIG5hbWU6IHJlcS5zdGF0dXMgPj0gMjAwICYmIHJlcS5zdGF0dXMgPCAzMDAgPyAnU3VjY2VzcycgOiAnRmFpbHVyZScsXG4gICAgICAgICAgICBzdGF0dXM6IHJlcS5zdGF0dXMsXG4gICAgICAgICAgICBkYXRhOiByZXEuZGF0YVxuICAgICAgICAgIH1dXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIHJldHVybiByZXF1ZXN0c0FycjtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uU2V0U3RhdGVzKGZuKSB7XG4gICAgX2V2ZW50c0VsZW0gJiYgX2V2ZW50c0VsZW0uYWRkRXZlbnRMaXN0ZW5lcignbGVvbmFyZG86c2V0U3RhdGVzJywgZm4gLCBmYWxzZSk7XG4gIH1cblxuICBmdW5jdGlvbiBzdGF0ZXNDaGFuZ2VkKCkge1xuICAgIF9ldmVudHNFbGVtICYmIF9ldmVudHNFbGVtLmRpc3BhdGNoRXZlbnQoX3N0YXRlc0NoYW5nZWRFdmVudCk7XG4gIH1cbn1cbiIsImltcG9ydCB7bGVvQ29uZmlndXJhdGlvbn0gZnJvbSAnLi9jb25maWd1cmF0aW9uLnNydic7XG5pbXBvcnQge1N0b3JhZ2V9IGZyb20gJy4vc3RvcmFnZS5zcnYnO1xuaW1wb3J0IHtwb2xpZnlsbHN9IGZyb20gJy4vcG9seWZpbGxzJztcbmltcG9ydCB7U2lub259IGZyb20gJy4vc2lub24uc3J2JztcbmltcG9ydCBVSVJvb3QgZnJvbSAnLi91aS91aS1yb290JztcblxuZGVjbGFyZSBjb25zdCB3aW5kb3c7XG5kZWNsYXJlIGNvbnN0IE9iamVjdDtcblxucG9saWZ5bGxzKCk7XG5cbi8vSW5pdCBDb25maWd1cmF0aW9uXG53aW5kb3cuTGVvbmFyZG8gPSB3aW5kb3cuTGVvbmFyZG8gfHwge307XG5jb25zdCBjb25maWd1cmF0aW9uID0gbGVvQ29uZmlndXJhdGlvbigpO1xuY29uc3Qgc3RvcmFnZSA9IG5ldyBTdG9yYWdlKCk7XG5PYmplY3QuYXNzaWduKHdpbmRvdy5MZW9uYXJkbyB8fCB7fSwgY29uZmlndXJhdGlvbiwgeyBzdG9yYWdlIH0pO1xuTGVvbmFyZG8ubG9hZFNhdmVkU3RhdGVzKCk7XG5cbi8vIEluaXQgU2lub25cbm5ldyBTaW5vbigpOyAgXG5cbi8vSW5pdCBVSVxubmV3IFVJUm9vdCgpO1xuIiwiZXhwb3J0IGZ1bmN0aW9uIHBvbGlmeWxscygpIHtcblxuICAvLyBDdXN0b21FdmVudFxuICAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEN1c3RvbUV2ZW50KGV2ZW50LCBwYXJhbXMpIHtcbiAgICAgIHBhcmFtcyA9IHBhcmFtcyB8fCB7YnViYmxlczogZmFsc2UsIGNhbmNlbGFibGU6IGZhbHNlLCBkZXRhaWw6IHVuZGVmaW5lZH07XG4gICAgICB2YXIgZXZ0ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50Jyk7XG4gICAgICBldnQuaW5pdEN1c3RvbUV2ZW50KGV2ZW50LCBwYXJhbXMuYnViYmxlcywgcGFyYW1zLmNhbmNlbGFibGUsIHBhcmFtcy5kZXRhaWwpO1xuICAgICAgcmV0dXJuIGV2dDtcbiAgICB9XG5cbiAgICBDdXN0b21FdmVudC5wcm90b3R5cGUgPSB3aW5kb3dbJ0V2ZW50J10ucHJvdG90eXBlO1xuXG4gICAgd2luZG93WydDdXN0b21FdmVudCddID0gQ3VzdG9tRXZlbnQ7XG4gIH0pKCk7XG5cbiAgLy8gT2JqZWN0LmFzc2lnblxuICAoZnVuY3Rpb24oKSB7XG4gICAgaWYgKHR5cGVvZiAoPGFueT5PYmplY3QpLmFzc2lnbiAhPSAnZnVuY3Rpb24nKSB7XG4gICAgICAoPGFueT5PYmplY3QpLmFzc2lnbiA9IGZ1bmN0aW9uKHRhcmdldCkge1xuICAgICAgICAndXNlIHN0cmljdCc7XG4gICAgICAgIGlmICh0YXJnZXQgPT0gbnVsbCkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjb252ZXJ0IHVuZGVmaW5lZCBvciBudWxsIHRvIG9iamVjdCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGFyZ2V0ID0gT2JqZWN0KHRhcmdldCk7XG4gICAgICAgIGZvciAodmFyIGluZGV4ID0gMTsgaW5kZXggPCBhcmd1bWVudHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgdmFyIHNvdXJjZSA9IGFyZ3VtZW50c1tpbmRleF07XG4gICAgICAgICAgaWYgKHNvdXJjZSAhPSBudWxsKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gc291cmNlKSB7XG4gICAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoc291cmNlLCBrZXkpKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgICAgfTtcbiAgICB9XG5cbiAgfSkoKVxufVxuXG4iLCJpbXBvcnQgVXRpbHMgZnJvbSAnLi91dGlscyc7XG5cbmRlY2xhcmUgdmFyIHNpbm9uO1xuXG5leHBvcnQgY2xhc3MgU2lub24ge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuaW5pdCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBpbml0KCkge1xuICAgIHZhciBzZXJ2ZXIgPSBzaW5vbi5mYWtlU2VydmVyLmNyZWF0ZSh7XG4gICAgICBhdXRvUmVzcG9uZDogdHJ1ZSxcbiAgICAgIGF1dG9SZXNwb25kQWZ0ZXI6IDEwXG4gICAgfSk7XG5cblxuICAgIHNpbm9uLkZha2VYTUxIdHRwUmVxdWVzdC51c2VGaWx0ZXJzID0gdHJ1ZTtcbiAgICBzaW5vbi5GYWtlWE1MSHR0cFJlcXVlc3QuYWRkRmlsdGVyKGZ1bmN0aW9uIChtZXRob2QsIHVybCkge1xuICAgICAgaWYgKHVybC5pbmRleE9mKCcuaHRtbCcpID4gMCAmJiB1cmwuaW5kZXhPZigndGVtcGxhdGUnKSA+PSAwKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgdmFyIHN0YXRlID0gTGVvbmFyZG8uZmV0Y2hTdGF0ZXNCeVVybEFuZE1ldGhvZCh1cmwsIG1ldGhvZCk7XG4gICAgICByZXR1cm4gIShzdGF0ZSAmJiBzdGF0ZS5hY3RpdmUpO1xuICAgIH0pO1xuXG4gICAgc2lub24uRmFrZVhNTEh0dHBSZXF1ZXN0Lm9uUmVzcG9uc2VFbmQgPSBmdW5jdGlvbiAoeGhyKSB7XG4gICAgICB2YXIgcmVzID0geGhyLnJlc3BvbnNlO1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2UpO1xuICAgICAgfVxuICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgIH1cbiAgICAgIExlb25hcmRvLl9sb2dSZXF1ZXN0KHhoci5tZXRob2QsIHhoci51cmwsIHJlcywgeGhyLnN0YXR1cyk7XG4gICAgfTtcblxuICAgIHNlcnZlci5yZXNwb25kV2l0aChmdW5jdGlvbiAocmVxdWVzdCkge1xuICAgICAgdmFyIHN0YXRlID0gTGVvbmFyZG8uZmV0Y2hTdGF0ZXNCeVVybEFuZE1ldGhvZChyZXF1ZXN0LnVybCwgcmVxdWVzdC5tZXRob2QpLFxuICAgICAgICBhY3RpdmVPcHRpb24gPSBMZW9uYXJkby5nZXRBY3RpdmVTdGF0ZU9wdGlvbihzdGF0ZS5uYW1lKTtcblxuICAgICAgaWYgKCEhYWN0aXZlT3B0aW9uKSB7XG4gICAgICAgIHZhciByZXNwb25zZURhdGEgPSBVdGlscy5pc0Z1bmN0aW9uKGFjdGl2ZU9wdGlvbi5kYXRhKSA/IGFjdGl2ZU9wdGlvbi5kYXRhKHJlcXVlc3QpIDogYWN0aXZlT3B0aW9uLmRhdGE7XG4gICAgICAgIHJlcXVlc3QucmVzcG9uZChhY3RpdmVPcHRpb24uc3RhdHVzLCB7XCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCJ9LCBKU09OLnN0cmluZ2lmeShyZXNwb25zZURhdGEpKTtcbiAgICAgICAgTGVvbmFyZG8uX2xvZ1JlcXVlc3QocmVxdWVzdC5tZXRob2QsIHJlcXVlc3QudXJsLCByZXNwb25zZURhdGEsIGFjdGl2ZU9wdGlvbi5zdGF0dXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdjb3VsZCBub3QgZmluZCBhIHN0YXRlIGZvciB0aGUgZm9sbG93aW5nIHJlcXVlc3QnLCByZXF1ZXN0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IFV0aWxzIGZyb20gJy4vdXRpbHMnO1xuXG5kZWNsYXJlIGNvbnN0IHdpbmRvdzogYW55O1xuXG5leHBvcnQgY2xhc3MgU3RvcmFnZSB7XG4gIHByaXZhdGUgQVBQX1BSRUZJWDtcbiAgcHJpdmF0ZSBTVEFURVNfU1RPUkVfS0VZO1xuICBwcml2YXRlIFNDRU5BUklPU19TVE9SRV9LRVk7XG4gIHByaXZhdGUgU0FWRURfU1RBVEVTX0tFWTtcbiAgcHJpdmF0ZSBQT1NJVElPTl9LRVk7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5BUFBfUFJFRklYID0gTGVvbmFyZG8uQVBQX1BSRUZJWCB8fCAnJztcbiAgICB0aGlzLlNUQVRFU19TVE9SRV9LRVkgPSBgJHt0aGlzLkFQUF9QUkVGSVh9bGVvbmFyZG8tc3RhdGVzYDtcbiAgICB0aGlzLlNBVkVEX1NUQVRFU19LRVkgPSBgJHt0aGlzLkFQUF9QUkVGSVh9bGVvbmFyZG8tdW5yZWdpc3RlcmVkLXN0YXRlc2A7XG4gICAgdGhpcy5TQ0VOQVJJT1NfU1RPUkVfS0VZID0gYCR7dGhpcy5BUFBfUFJFRklYfWxlb25hcmRvLXNjZW5hcmlvc2A7XG4gICAgdGhpcy5QT1NJVElPTl9LRVkgPSBgJHt0aGlzLkFQUF9QUkVGSVh9bGVvbmFyZG8tcG9zaXRpb25gO1xuICB9XG4gIF9nZXRJdGVtIChrZXkpIHtcbiAgICB2YXIgaXRlbSA9IHdpbmRvdy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbShrZXkpO1xuICAgIGlmICghaXRlbSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBVdGlscy5mcm9tSnNvbihpdGVtKTtcbiAgfVxuXG4gIF9zZXRJdGVtKGtleSwgZGF0YSkge1xuICAgIHdpbmRvdy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbShrZXksIFV0aWxzLnRvSnNvbihkYXRhKSk7XG4gIH1cblxuICBnZXRTdGF0ZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2dldEl0ZW0odGhpcy5TVEFURVNfU1RPUkVfS0VZKSB8fCB7fTtcbiAgfVxuXG4gIGdldFNjZW5hcmlvcygpIHtcbiAgICByZXR1cm4gdGhpcy5fZ2V0SXRlbSh0aGlzLlNDRU5BUklPU19TVE9SRV9LRVkpIHx8IFtdO1xuICB9XG5cbiAgc2V0U3RhdGVzKHN0YXRlcykge1xuICAgIHRoaXMuX3NldEl0ZW0odGhpcy5TVEFURVNfU1RPUkVfS0VZLCBzdGF0ZXMpO1xuICAgIExlb25hcmRvLnN0YXRlc0NoYW5nZWQoKTtcbiAgfVxuXG4gIHNldFNjZW5hcmlvcyhzY2VuYXJpb3MpIHtcbiAgICB0aGlzLl9zZXRJdGVtKHRoaXMuU0NFTkFSSU9TX1NUT1JFX0tFWSwgc2NlbmFyaW9zKTtcbiAgfVxuXG4gIGdldFNhdmVkU3RhdGVzKCkge1xuICAgIHZhciBzdGF0ZXMgPSB0aGlzLl9nZXRJdGVtKHRoaXMuU0FWRURfU1RBVEVTX0tFWSkgfHwgW107XG4gICAgc3RhdGVzLmZvckVhY2goZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICBzdGF0ZS5vcHRpb25zLmZvckVhY2gob3B0aW9uID0+IHtcbiAgICAgICAgb3B0aW9uLmZyb21fbG9jYWwgPSB0cnVlO1xuICAgICAgfSlcbiAgICB9KTtcbiAgICByZXR1cm4gc3RhdGVzO1xuICB9XG5cbiAgc2V0U2F2ZWRTdGF0ZXMoc3RhdGVzKSB7XG4gICAgdGhpcy5fc2V0SXRlbSh0aGlzLlNBVkVEX1NUQVRFU19LRVksIHN0YXRlcyk7XG4gIH1cblxuICBzZXRTYXZlZFBvc2l0aW9uKHBvc2l0aW9uKSB7XG4gICAgaWYgKCFwb3NpdGlvbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLl9zZXRJdGVtKHRoaXMuUE9TSVRJT05fS0VZLCBwb3NpdGlvbik7XG4gIH1cblxuICBnZXRTYXZlZFBvc2l0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9nZXRJdGVtKHRoaXMuUE9TSVRJT05fS0VZKTtcbiAgfVxufVxuIiwiaW1wb3J0IFV0aWxzIGZyb20gJy4uL3VpLXV0aWxzJztcbmltcG9ydCBFdmVudHMgZnJvbSAnLi4vdWktZXZlbnRzJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRHJvcERvd24ge1xuXG4gIHZpZXdOb2RlOiBIVE1MRWxlbWVudDtcbiAgcmFuZG9tSUQ6IHN0cmluZztcbiAgb3B0aW9uc1N0YXRlOiBib29sZWFuID0gZmFsc2U7XG4gIHRvZ2dsZUJpbmRlZDogRXZlbnRMaXN0ZW5lciA9IHRoaXMudG9nZ2xlRHJvcERvd24uYmluZCh0aGlzKTtcbiAgY2xvc2VEcm9wRG93bkJpbmRlZDogRXZlbnRMaXN0ZW5lciA9IHRoaXMuY2xvc2VEcm9wRG93bi5iaW5kKHRoaXMpO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBpdGVtcyxcbiAgICAgIHByaXZhdGUgYWN0aXZlSXRlbSxcbiAgICAgIHByaXZhdGUgaXNEaXNhYmxlZDogYm9vbGVhbixcbiAgICAgIHByaXZhdGUgb25TZWxlY3RJdGVtOiBGdW5jdGlvbixcbiAgICAgIHByaXZhdGUgb25SZW1vdmVJdGVtOiBGdW5jdGlvbikge1xuICAgIHRoaXMucmFuZG9tSUQgPSBVdGlscy5ndWlkR2VuZXJhdG9yKCk7XG4gICAgdGhpcy52aWV3Tm9kZSA9IFV0aWxzLmdldEVsZW1lbnRGcm9tSHRtbChgPGRpdiBpZD1cImxlb25hcmRvLWRyb3Bkb3duLSR7dGhpcy5yYW5kb21JRH1cIiBjbGFzcz1cImxlb25hcmRvLWRyb3Bkb3duXCI+PC9kaXY+YCk7XG4gICAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuY2xvc2VEcm9wRG93bkJpbmRlZCwgZmFsc2UpO1xuICAgIEV2ZW50cy5vbihFdmVudHMuQ0xPU0VfRFJPUERPV05TLCB0aGlzLmNsb3NlRHJvcERvd25CaW5kZWQpO1xuICB9XG5cbiAgZ2V0KCkge1xuICAgIHJldHVybiB0aGlzLnZpZXdOb2RlO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIHRoaXMudmlld05vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLnRvZ2dsZUJpbmRlZCwgZmFsc2UpO1xuICAgIHRoaXMudmlld05vZGUuaW5uZXJIVE1MID0gYFxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJsZW9uYXJkby1kcm9wZG93bi1zZWxlY3RlZFwiICR7dGhpcy5pc0Rpc2FibGVkVG9rZW4oKX0+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cImxlb25hcmRvLWRyb3Bkb3duLXNlbGVjdGVkLXRleHRcIj4ke3RoaXMuYWN0aXZlSXRlbS5uYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwibGVvbmFyZG8tZHJvcGRvd24tc2VsZWN0ZWQtYXJyb3dcIj48L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImxlb25hcmRvLWRyb3Bkb3duLW9wdGlvbnNcIj5cbiAgICAgICAgICAgIDx1bCBjbGFzcz1cImxlb25hcmRvLWRyb3Bkb3duLWxpc3RcIj4ke3RoaXMuZ2V0SXRlbXMoKS5qb2luKCcnKX08L3VsPlxuICAgICAgICAgIDwvZGl2PmA7XG4gICAgdGhpcy52aWV3Tm9kZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMudG9nZ2xlQmluZGVkLCBmYWxzZSk7XG4gIH1cblxuICBkaXNhYmxlRHJvcERvd24oKSB7XG4gICAgdGhpcy5pc0Rpc2FibGVkID0gdHJ1ZTtcbiAgICB0aGlzLnZpZXdOb2RlLnF1ZXJ5U2VsZWN0b3IoYC5sZW9uYXJkby1kcm9wZG93bi1zZWxlY3RlZGApLnNldEF0dHJpYnV0ZSgnZGlzYWJsZWQnLCAnZGlzYWJsZWQnKTtcbiAgfVxuXG4gIGVuYWJsZURyb3BEb3duKCkge1xuICAgIHRoaXMuaXNEaXNhYmxlZCA9IGZhbHNlO1xuICAgIHRoaXMudmlld05vZGUucXVlcnlTZWxlY3RvcihgLmxlb25hcmRvLWRyb3Bkb3duLXNlbGVjdGVkYCkucmVtb3ZlQXR0cmlidXRlKCdkaXNhYmxlZCcpO1xuICB9XG5cbiAgdG9nZ2xlRHJvcERvd24oZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICBpZiAodGhpcy5pc0Rpc2FibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChldmVudCAmJiBldmVudC50YXJnZXQpIHtcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cbiAgICBpZihldmVudC50YXJnZXRbJ2NsYXNzTGlzdCddLmNvbnRhaW5zKCdsZW9uYXJkby1kcm9wZG93bi1pdGVtJykgKXtcbiAgICAgIHRoaXMuc2V0QWN0aXZlSXRlbShldmVudC50YXJnZXRbJ3F1ZXJ5U2VsZWN0b3InXSgnLmxlb25hcmRvLWRyb3Bkb3duLWl0ZW0tdGV4dCcpLmlubmVySFRNTCk7XG4gICAgfVxuICAgIGVsc2UgaWYoZXZlbnQudGFyZ2V0WydjbGFzc0xpc3QnXS5jb250YWlucygnbGVvbmFyZG8tZHJvcGRvd24taXRlbS10ZXh0Jykpe1xuICAgICAgdGhpcy5zZXRBY3RpdmVJdGVtKGV2ZW50LnRhcmdldFsnaW5uZXJIVE1MJ10pO1xuICAgIH1cbiAgICBlbHNlIGlmKGV2ZW50LnRhcmdldFsnY2xhc3NMaXN0J10uY29udGFpbnMoJ2xlb25hcmRvLWRyb3Bkb3duLWl0ZW0teCcpKXtcbiAgICAgIHRoaXMucmVtb3ZlSXRlbSg8SFRNTEVsZW1lbnQ+ZXZlbnQudGFyZ2V0WydwYXJlbnROb2RlJ10pO1xuICAgIH1cbiAgICBpZiAodGhpcy5vcHRpb25zU3RhdGUpIHtcbiAgICAgIHRoaXMuY2xvc2VEcm9wRG93bigpO1xuICAgICAgdGhpcy5vcHRpb25zU3RhdGUgPSBmYWxzZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLm9wZW5Ecm9wRG93bigpO1xuICAgICAgdGhpcy5vcHRpb25zU3RhdGUgPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIG9wZW5Ecm9wRG93bigpIHtcbiAgICBjb25zdCBlbGVtOiBIVE1MRWxlbWVudCA9IDxIVE1MRWxlbWVudD50aGlzLnZpZXdOb2RlLnF1ZXJ5U2VsZWN0b3IoYC5sZW9uYXJkby1kcm9wZG93bi1vcHRpb25zYCk7XG4gICAgZWxlbS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICBjb25zdCBlbGVtUmVjOiBDbGllbnRSZWN0ID0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBjb25zdCBpc092ZXJmbG93ZWQ6IGJvb2xlYW4gPSAgZWxlbVJlYy50b3AgKyBlbGVtUmVjLmhlaWdodCA+IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICBpZihpc092ZXJmbG93ZWQpe1xuICAgICAgZWxlbS5zdHlsZS50b3AgPSAtZWxlbVJlYy5oZWlnaHQgKyAncHgnO1xuICAgIH1cbiAgICBFdmVudHMuZGlzcGF0Y2goRXZlbnRzLkNMT1NFX0RST1BET1dOUywgdGhpcy52aWV3Tm9kZSk7XG4gIH1cblxuICBjbG9zZURyb3BEb3duKGV2ZW50PzogQ3VzdG9tRXZlbnQpIHtcbiAgICBjb25zdCBkcm9wRG93bjogSFRNTEVsZW1lbnQgPSA8SFRNTEVsZW1lbnQ+dGhpcy52aWV3Tm9kZS5xdWVyeVNlbGVjdG9yKGAubGVvbmFyZG8tZHJvcGRvd24tb3B0aW9uc2ApO1xuICAgIGlmICghZHJvcERvd24gfHwgKGV2ZW50ICYmIGV2ZW50LmRldGFpbCA9PT0gdGhpcy52aWV3Tm9kZSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJvcERvd24uc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgfVxuXG4gIHNldEFjdGl2ZUl0ZW0oaXRlbU5hbWU6IHN0cmluZyl7XG4gICAgaWYodGhpcy5hY3RpdmVJdGVtLm5hbWUgPT09IGl0ZW1OYW1lKXtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5hY3RpdmVJdGVtID0gdGhpcy5nZXRJdGVtQnlOYW1lKGl0ZW1OYW1lKTtcbiAgICB0aGlzLnZpZXdOb2RlLnF1ZXJ5U2VsZWN0b3IoYC5sZW9uYXJkby1kcm9wZG93bi1zZWxlY3RlZC10ZXh0YClbJ2lubmVySFRNTCddID0gdGhpcy5hY3RpdmVJdGVtLm5hbWU7XG4gICAgdGhpcy5vblNlbGVjdEl0ZW0odGhpcy5hY3RpdmVJdGVtKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0SXRlbUJ5TmFtZShpdGVtTmFtZTogc3RyaW5nKSB7XG4gICAgbGV0IHJldEl0ZW0gPSB0aGlzLmFjdGl2ZUl0ZW07XG4gICAgdGhpcy5pdGVtcy5zb21lKChjdXJJdGVtKSA9PiB7XG4gICAgICBpZihjdXJJdGVtLm5hbWUgPT09IGl0ZW1OYW1lKXtcbiAgICAgICAgcmV0SXRlbSA9IGN1ckl0ZW07XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXRJdGVtO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRJdGVtcygpIHtcbiAgICByZXR1cm4gdGhpcy5pdGVtcy5tYXAoKGl0ZW06IHtuYW1lOiBzdHJpbmd9KSA9PiB7XG4gICAgICByZXR1cm4gYDxsaSBjbGFzcz1cImxlb25hcmRvLWRyb3Bkb3duLWl0ZW1cIj48c3BhbiBjbGFzcz1cImxlb25hcmRvLWRyb3Bkb3duLWl0ZW0tdGV4dFwiPiR7aXRlbS5uYW1lfTwvc3Bhbj48c3BhbiBjbGFzcz1cImxlb25hcmRvLWRyb3Bkb3duLWl0ZW0teFwiPjwvc3Bhbj48L2xpPmBcbiAgICB9KVxuICB9XG5cbiAgcHJpdmF0ZSBpc0Rpc2FibGVkVG9rZW4oKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNEaXNhYmxlZCA/ICdkaXNhYmxlZCcgOiAnJztcbiAgfVxuICBcbiAgcHJpdmF0ZSByZW1vdmVJdGVtKGl0ZW06IEhUTUxFbGVtZW50KSB7XG4gICAgaWYodGhpcy5pdGVtcy5sZW5ndGggPD0gMSl7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCByZW1vdmVkSXRlbTtcbiAgICB0aGlzLml0ZW1zID0gdGhpcy5pdGVtcy5maWx0ZXIoKGN1ckl0ZW0pID0+IHtcbiAgICAgIGlmKGN1ckl0ZW0ubmFtZSA9PT0gaXRlbS5xdWVyeVNlbGVjdG9yKCcubGVvbmFyZG8tZHJvcGRvd24taXRlbS10ZXh0JylbJ2lubmVySFRNTCddKXtcbiAgICAgICAgcmVtb3ZlZEl0ZW0gPSBjdXJJdGVtO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMudmlld05vZGUucXVlcnlTZWxlY3RvcignLmxlb25hcmRvLWRyb3Bkb3duLWxpc3QnKS5yZW1vdmVDaGlsZChpdGVtKTtcbiAgICB0aGlzLm9uUmVtb3ZlSXRlbShyZW1vdmVkSXRlbSk7XG5cbiAgfVxuXG4gIHByaXZhdGUgb25EZXN0cm95KCl7XG4gICAgZG9jdW1lbnQuYm9keS5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuY2xvc2VEcm9wRG93bkJpbmRlZCwgZmFsc2UpO1xuICAgIHRoaXMudmlld05vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLnRvZ2dsZUJpbmRlZCwgZmFsc2UpO1xuICB9XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vbGVvbmFyZG8uZC50c1wiIC8+XG5pbXBvcnQgVXRpbHMgZnJvbSAnLi4vdWktdXRpbHMnO1xuaW1wb3J0IEV2ZW50cyBmcm9tICcuLi91aS1ldmVudHMnO1xuaW1wb3J0IHtIZWFkZXJUYWJJdGVtfSBmcm9tICcuL2hlYWRlci5tb2RlbCc7XG5pbXBvcnQgVUlTdGF0ZVZpZXdTZXJ2aWNlIGZyb20gJy4uL3VpLXN0YXRlL3VpLXN0YXRlLnNydic7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhlYWRlclZpZXcge1xuICBcbiAgc3RhdGljIFNFTEVDVEVEX0NMQVNTX05BTUU6IHN0cmluZyA9ICdsZW9uYXJkby1oZWFkZXItdGFiSXRlbS1zZWxlY3RlZCc7XG5cbiAgcHJpdmF0ZSBvbkNsaWNrQmluZGVkOiBFdmVudExpc3RlbmVyT2JqZWN0ID0gdGhpcy5vbkNsaWNrLmJpbmQodGhpcyk7XG5cbiAgXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgdGFiTGlzdDogQXJyYXk8SGVhZGVyVGFiSXRlbT4pIHtcbiAgfVxuXG4gIGdldCgpIHtcbiAgICBjb25zdCB0ZW1wbGF0ZSA9IGA8ZGl2IGNsYXNzPVwibGVvbmFyZG8taGVhZGVyLWNvbnRhaW5lclwiPlxuICAgICAgICA8c3BhbiBjbGFzcz1cImxlb25hcmRvLWhlYWRlci1sYWJlbCBcIj5MRU9OQVJETzwvc3Bhbj5cbiAgICAgICAgPHNwYW4gY2xhc3M9XCJsZW9uYXJkby1oZWFkZXItdGFic1wiPlxuICAgICAgICAgIDx1bD5cbiAgICAgICAgICAgICR7dGhpcy5nZXRUYWJzSHRtbCgwKX1cbiAgICAgICAgICA8L3VsPlxuICAgICAgPC9zcGFuPlxuICAgIDwvZGl2PmA7XG4gICAgY29uc3QgbGF1bmNoZXIgPSBVdGlscy5nZXRFbGVtZW50RnJvbUh0bWwodGVtcGxhdGUpO1xuICAgIGxhdW5jaGVyLnF1ZXJ5U2VsZWN0b3IoJ3VsJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm9uQ2xpY2tCaW5kZWQpO1xuICAgIHJldHVybiBsYXVuY2hlcjtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0VGFic0h0bWwoc2VsZWN0ZWRJbmRleDogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMudGFiTGlzdC5tYXAoKHRhYjogSGVhZGVyVGFiSXRlbSwgaW5kZXg6IG51bWJlcikgPT4ge1xuICAgICAgY29uc3Qgc2VsZWN0ZWQ6IHN0cmluZyA9IGluZGV4ID09PSBzZWxlY3RlZEluZGV4ID8gSGVhZGVyVmlldy5TRUxFQ1RFRF9DTEFTU19OQU1FIDogJyc7XG4gICAgICByZXR1cm4gYDxsaSBjbGFzcz1cImxlb25hcmRvLWhlYWRlci10YWJJdGVtICR7c2VsZWN0ZWR9XCIgZGF0YS1oZWFkZXJ0YWI9XCJsZW9uYXJkby1oZWFkZXItJHt0YWIubGFiZWx9XCIgPiR7dGFiLmxhYmVsfTwvbGk+YDtcbiAgICB9KS5qb2luKCcnKTtcbiAgfVxuXG4gIG9uQ2xpY2soZXZlbnQ6IE1vdXNlRXZlbnQpIHtcbiAgICB0aGlzLnNlbGVjdFRhYihldmVudC50YXJnZXRbJ2lubmVySFRNTCddKTtcbiAgfVxuXG4gIHNlbGVjdFRhYih0YWJMYWJlbDogc3RyaW5nKXtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAuJHtIZWFkZXJWaWV3LlNFTEVDVEVEX0NMQVNTX05BTUV9YCkuY2xhc3NMaXN0LnJlbW92ZShgbGVvbmFyZG8taGVhZGVyLXRhYkl0ZW0tc2VsZWN0ZWRgKTtcbiAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGBbZGF0YS1oZWFkZXJ0YWI9XCJsZW9uYXJkby1oZWFkZXItJHt0YWJMYWJlbH1cIl1gKS5jbGFzc0xpc3QuYWRkKEhlYWRlclZpZXcuU0VMRUNURURfQ0xBU1NfTkFNRSk7XG4gICAgVUlTdGF0ZVZpZXdTZXJ2aWNlLmdldEluc3RhbmNlKCkuc2V0Q3VyVmlld1N0YXRlKHRhYkxhYmVsKTtcbiAgfVxuXG4gIC8vJChkb2N1bWVudCkub24oJ2tleXByZXNzJywgKGUpID0+IHtcbiAgLy8gIGlmIChlLnNoaWZ0S2V5ICYmIGUuY3RybEtleSkge1xuICAvLyAgICBzd2l0Y2ggKGUua2V5Q29kZSkge1xuICAvLyAgICAgIGNhc2UgMTI6XG4gIC8vICAgICAgICAkKCcubGVvbmFyZG8tYWN0aXZhdG9yJykudG9nZ2xlKCk7XG4gIC8vICAgICAgICBicmVhaztcbiAgLy8gICAgICBjYXNlIDExOlxuICAvLyAgICAgICAgdG9nZ2xlV2luZG93KCk7XG4gIC8vICAgICAgICBicmVhaztcbiAgLy8gICAgICBkZWZhdWx0OlxuICAvLyAgICAgICAgYnJlYWs7XG4gIC8vICAgIH1cbiAgLy8gIH1cbiAgLy99KTtcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi9sZW9uYXJkby5kLnRzXCIgLz5cbmltcG9ydCBVdGlscyBmcm9tICcuLi91aS11dGlscyc7XG5pbXBvcnQgRXZlbnRzIGZyb20gJy4uL3VpLWV2ZW50cyc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIExhdW5jaGVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG5cbiAgfVxuXG4gIGdldCgpIHtcbiAgICBjb25zdCBsYXVuY2hlciA9IFV0aWxzLmdldEVsZW1lbnRGcm9tSHRtbChgPGRpdiBjbGFzcz1cImxlb25hcmRvLWxhdW5jaGVyXCI+PC9kaXY+YCk7XG4gICAgbGF1bmNoZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm9uQ2xpY2spO1xuICAgIHJldHVybiBsYXVuY2hlcjtcbiAgfVxuXG4gIG9uQ2xpY2soKSB7XG4gICAgRXZlbnRzLmRpc3BhdGNoKEV2ZW50cy5UT0dHTEVfTEFVTkNIRVIpO1xuICB9XG5cbiAgLy8kKGRvY3VtZW50KS5vbigna2V5cHJlc3MnLCAoZSkgPT4ge1xuICAvLyAgaWYgKGUuc2hpZnRLZXkgJiYgZS5jdHJsS2V5KSB7XG4gIC8vICAgIHN3aXRjaCAoZS5rZXlDb2RlKSB7XG4gIC8vICAgICAgY2FzZSAxMjpcbiAgLy8gICAgICAgICQoJy5sZW9uYXJkby1hY3RpdmF0b3InKS50b2dnbGUoKTtcbiAgLy8gICAgICAgIGJyZWFrO1xuICAvLyAgICAgIGNhc2UgMTE6XG4gIC8vICAgICAgICB0b2dnbGVXaW5kb3coKTtcbiAgLy8gICAgICAgIGJyZWFrO1xuICAvLyAgICAgIGRlZmF1bHQ6XG4gIC8vICAgICAgICBicmVhaztcbiAgLy8gICAgfVxuICAvLyAgfVxuICAvL30pO1xufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL2xlb25hcmRvLmQudHNcIiAvPlxuaW1wb3J0IFV0aWxzIGZyb20gJy4uL3VpLXV0aWxzJztcbmltcG9ydCBFdmVudHMgZnJvbSAnLi4vdWktZXZlbnRzJztcbmltcG9ydCBIZWFkZXJWaWV3IGZyb20gJy4uL2hlYWRlci9oZWFkZXInO1xuaW1wb3J0IHtIZWFkZXJUYWJJdGVtfSBmcm9tICcuLi9oZWFkZXIvaGVhZGVyLm1vZGVsJztcbmltcG9ydCB7VUlTdGF0ZUxpc3R9IGZyb20gJy4uL3VpLXN0YXRlL3VpLXN0YXRlLmRhdGEnO1xuaW1wb3J0IFVJU3RhdGVWaWV3U2VydmljZSBmcm9tICcuLi91aS1zdGF0ZS91aS1zdGF0ZS5zcnYnO1xuaW1wb3J0IHtVSVZpZXdTdGF0ZX0gZnJvbSAnLi4vdWktc3RhdGUvdWktc3RhdGUubW9kZWwnO1xuaW1wb3J0IFZpZXdzQ29udGFpbmVyIGZyb20gJy4uL3ZpZXdzLWNvbnRhaW5lci92aWV3cy1jb250YWluZXInO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNYWluVmlldyB7XG4gIGNsYXNzTmFtZSA9ICdsZW9uYXJkby1tYWluLXZpZXcnO1xuICBoaWRkZW5DbGFzc05hbWUgPSBgJHt0aGlzLmNsYXNzTmFtZX0taGlkZGVuYDtcbiAgaGVhZGVyVmlldzogSGVhZGVyVmlldztcbiAgdmlld3NDb250YWluZXI6IFZpZXdzQ29udGFpbmVyO1xuICB2aWV3Tm9kZTogTm9kZTtcbiAgYm9keVZpZXc6IE5vZGU7XG4gIG1lbnVWaWV3OiBIVE1MRWxlbWVudDtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBFdmVudHMub24oJ2tleWRvd24nLCB0aGlzLm9uS2V5UHJlc3MuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5ib2R5VmlldyA9IFV0aWxzLmdldEVsZW1lbnRGcm9tSHRtbChgPGRpdiBjbGFzcz1cImxlb25hcmRvLW1haW4tdmlldy1ib2R5XCI+PC9kaXY+YCk7XG4gICAgdGhpcy5tZW51VmlldyA9IFV0aWxzLmdldEVsZW1lbnRGcm9tSHRtbChgPGRpdiBjbGFzcz1cImxlb25hcmRvLW1haW4tdmlldy1tZW51XCI+PC9kaXY+YCk7XG5cbiAgICBFdmVudHMub24oRXZlbnRzLlRPR0dMRV9MQVVOQ0hFUiwgdGhpcy50b2dnbGVWaWV3LmJpbmQodGhpcykpO1xuICAgIFVJU3RhdGVWaWV3U2VydmljZS5nZXRJbnN0YW5jZSgpLmluaXQoVUlTdGF0ZUxpc3QodGhpcy5tZW51VmlldyksIFVJU3RhdGVMaXN0KHRoaXMubWVudVZpZXcpWzBdLm5hbWUpO1xuICAgIHRoaXMuaGVhZGVyVmlldyA9IG5ldyBIZWFkZXJWaWV3KHRoaXMuZ2V0VGFiTGlzdCgpKTtcbiAgICB0aGlzLnZpZXdzQ29udGFpbmVyID0gbmV3IFZpZXdzQ29udGFpbmVyKCk7XG5cbiAgfVxuXG4gIGdldCgpIHtcbiAgICB0aGlzLnZpZXdOb2RlID0gVXRpbHMuZ2V0RWxlbWVudEZyb21IdG1sKGA8ZGl2IGNsYXNzPVwiJHt0aGlzLmNsYXNzTmFtZX0gJHt0aGlzLmhpZGRlbkNsYXNzTmFtZX1cIj48L2Rpdj5gKTtcbiAgICByZXR1cm4gdGhpcy52aWV3Tm9kZTtcbiAgfVxuXG4gIHRvZ2dsZVZpZXcoKSB7XG4gICAgY29uc3QgZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAuJHt0aGlzLmNsYXNzTmFtZX1gKTtcbiAgICBpZiAoIWVsKSByZXR1cm47XG4gICAgaWYgKGVsLmNsYXNzTGlzdC5jb250YWlucyh0aGlzLmhpZGRlbkNsYXNzTmFtZSkpIHtcbiAgICAgIGVsLmNsYXNzTGlzdC5yZW1vdmUodGhpcy5oaWRkZW5DbGFzc05hbWUpO1xuICAgICAgaWYgKCFlbC5jaGlsZE5vZGVzLmxlbmd0aCkge1xuICAgICAgICB0aGlzLmtpY2tTdGFydCgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNsb3NlTGVvKCk7XG4gICAgfVxuICB9XG5cbiAga2lja1N0YXJ0KCkge1xuICAgIHRoaXMudmlld05vZGUuYXBwZW5kQ2hpbGQodGhpcy5ib2R5Vmlldyk7XG4gICAgdGhpcy52aWV3Tm9kZS5hcHBlbmRDaGlsZCh0aGlzLm1lbnVWaWV3KTtcblxuICAgIHRoaXMuYm9keVZpZXcuYXBwZW5kQ2hpbGQodGhpcy5oZWFkZXJWaWV3LmdldCgpKTtcbiAgICB0aGlzLmJvZHlWaWV3LmFwcGVuZENoaWxkKHRoaXMudmlld3NDb250YWluZXIuZ2V0KCkpO1xuICAgIHRoaXMudmlld3NDb250YWluZXIucmVuZGVyKFVJU3RhdGVWaWV3U2VydmljZS5nZXRJbnN0YW5jZSgpLmdldEN1clZpZXdTdGF0ZSgpKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0VGFiTGlzdCgpOiBBcnJheTxIZWFkZXJUYWJJdGVtPntcbiAgICByZXR1cm4gVUlTdGF0ZVZpZXdTZXJ2aWNlLmdldEluc3RhbmNlKCkuZ2V0Vmlld1N0YXRlcygpLm1hcCgodmlldzogVUlWaWV3U3RhdGUpID0+IHtyZXR1cm4ge2xhYmVsOiB2aWV3Lm5hbWV9fSk7XG4gIH1cblxuICBwcml2YXRlIGNsb3NlTGVvKCl7XG4gICAgY29uc3QgZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGAuJHt0aGlzLmNsYXNzTmFtZX1gKTtcbiAgICBlbC5jbGFzc0xpc3QuYWRkKHRoaXMuaGlkZGVuQ2xhc3NOYW1lKTtcbiAgfVxuXG4gIHByaXZhdGUgb25LZXlQcmVzcyhldmVudDogTW91c2VFdmVudCl7XG4gICAgaWYoZXZlbnQud2hpY2ggPT0gMjcpe1xuICAgICAgdGhpcy5jbG9zZUxlbygpO1xuICAgIH1cbiAgfVxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2xlb25hcmRvLmQudHNcIiAvPlxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIFRPR0dMRV9MQVVOQ0hFUjogJ2xlb25hcmRvOnRvZ2dsZTpsYXVuY2hlcicsXG4gIENIQU5HRV9WSUVXOiAnbGVvbmFyZG86Y2hhbmdlOnZpZXcnLFxuICBTQ0VOQVJJT19DTElDS0VEOiAnbGVvbmFyZG86c2NlbmFyaW86Y2xpY2tlZCcsXG4gIEZJTFRFUl9TVEFURVM6ICdsZW9uYXJkbzpmaWx0ZXI6c3RhdGVzJyxcbiAgQ0xPU0VfRFJPUERPV05TOiAnbGVvbmFyZG86Y2xvc2U6ZHJvcGRvd25zJyxcbiAgVE9HR0xFX1NUQVRFUzogJ2xlb25hcmRvOnRvZ2dsZTpzdGF0ZXMnLFxuICBUT0dHTEVfU0NFTkFSSU9TOiAnbGVvbmFyZG86dG9nZ2xlOnNjZW5hcmlvJyxcbiAgQUREX1NDRU5BUklPOiAnbGVvbmFyZG86YWRkOnNjZW5hcmlvJyxcbiAgVE9HR0xFX1NUQVRFOiAnbGVvbmFyZG86dG9nZ2xlOnN0YXRlcycsXG5cbiAgb246IChldmVudE5hbWU6IHN0cmluZywgZm46IEV2ZW50TGlzdGVuZXJPckV2ZW50TGlzdGVuZXJPYmplY3QpID0+IHtcbiAgICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBmbik7XG4gIH0sXG4gIGRpc3BhdGNoOiAoZXZlbnROYW1lOiBzdHJpbmcsIGRldGFpbHM/OiBhbnkpID0+IHtcbiAgICBjb25zdCBldmVudCA9IG5ldyBDdXN0b21FdmVudChldmVudE5hbWUsIHsgZGV0YWlsOiBkZXRhaWxzIH0pO1xuICAgIGRvY3VtZW50LmJvZHkuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gIH1cbn1cbiIsImltcG9ydCBMYXVuY2hlciBmcm9tICcuL2xhdW5jaGVyL2xhdW5jaGVyJztcbmltcG9ydCBNYWluVmlldyBmcm9tICcuL21haW4tdmlldy9tYWluLXZpZXcnO1xuaW1wb3J0IFV0aWxzIGZyb20gJy4vdWktdXRpbHMnO1xuaW1wb3J0IFVJU3RhdGVWZWl3U2VydmljZSBmcm9tICcuL3VpLXN0YXRlL3VpLXN0YXRlLnNydic7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFVJUm9vdCB7XG4gIGxlb25hcmRvQXBwOiBOb2RlO1xuICBsYXVuY2hlcjogTGF1bmNoZXI7XG4gIG1haW5WaWV3OiBNYWluVmlldztcbiAgaW5pdEJpbmRlZDogRXZlbnRMaXN0ZW5lciA9IHRoaXMuaW5pdC5iaW5kKHRoaXMpO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN3aXRjaCAoZG9jdW1lbnQucmVhZHlTdGF0ZSkge1xuICAgICAgZGVmYXVsdDpcbiAgICAgIGNhc2UgJ2xvYWRpbmcnOlxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgdGhpcy5pbml0QmluZGVkLCBmYWxzZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnaW50ZXJhY3RpdmUnOlxuICAgICAgY2FzZSAnY29tcGxldGUnOlxuICAgICAgICB0aGlzLmluaXQoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaW5pdCgpIHtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgdGhpcy5pbml0QmluZGVkLCBmYWxzZSk7XG4gICAgdGhpcy5sZW9uYXJkb0FwcCA9IFV0aWxzLmdldEVsZW1lbnRGcm9tSHRtbChgPGRpdiBsZW9uYXJkby1hcHA+PC9kaXY+YCk7XG4gICAgdGhpcy5sYXVuY2hlciA9IG5ldyBMYXVuY2hlcigpO1xuICAgIHRoaXMubWFpblZpZXcgPSBuZXcgTWFpblZpZXcoKTtcbiAgICB0aGlzLmxlb25hcmRvQXBwLmFwcGVuZENoaWxkKHRoaXMubGF1bmNoZXIuZ2V0KCkpO1xuICAgIHRoaXMubGVvbmFyZG9BcHAuYXBwZW5kQ2hpbGQodGhpcy5tYWluVmlldy5nZXQoKSk7XG4gICAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdsZW9uYXJkbzp0b2dnbGU6c3RhdGVzJywgdGhpcy50b2dnbGVBbGxTdGF0ZXMuYmluZCh0aGlzKSk7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmxlb25hcmRvQXBwKTtcbiAgfVxuXG4gIHByaXZhdGUgdG9nZ2xlQWxsU3RhdGVzKGV2ZW50OiBDdXN0b21FdmVudCl7XG4gICAgTGVvbmFyZG8udG9nZ2xlQWN0aXZhdGVBbGwoZXZlbnQuZGV0YWlsKTtcbiAgfVxufSIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi9sZW9uYXJkby5kLnRzXCIgLz5cblxuaW1wb3J0IHtVSVZpZXdTdGF0ZX0gZnJvbSAnLi91aS1zdGF0ZS5tb2RlbCc7XG5pbXBvcnQgU2NlbmFyaW9zIGZyb20gJy4uL3ZpZXdzL3NjZW5hcmlvcy9zY2VuYXJpb3MnO1xuaW1wb3J0IFJlY29yZGVyIGZyb20gJy4uL3ZpZXdzL3JlY29yZGVyL3JlY29yZGVyJztcbmltcG9ydCBFeHBvcnQgZnJvbSAnLi4vdmlld3MvZXhwb3J0L2V4cG9ydCc7XG5cbmxldCB1aUxpc3Q6IEFycmF5PFVJVmlld1N0YXRlPjtcblxuZXhwb3J0IGZ1bmN0aW9uIFVJU3RhdGVMaXN0KG1lbnVWaWV3OiBIVE1MRWxlbWVudCk6IEFycmF5PFVJVmlld1N0YXRlPiB7XG4gIGlmKHVpTGlzdCl7XG4gICAgcmV0dXJuIHVpTGlzdDtcbiAgfVxuICByZXR1cm4gdWlMaXN0ID0gW1xuICAgIHtcbiAgICAgIG5hbWU6ICdzY2VuYXJpb3MnLFxuICAgICAgY29tcG9uZW50OiBuZXcgU2NlbmFyaW9zKClcbiAgICB9LFxuICAgIHtcbiAgICAgIG5hbWU6ICdyZWNvcmRlcicsXG4gICAgICBjb21wb25lbnQ6IG5ldyBSZWNvcmRlcihtZW51VmlldylcblxuICAgIH0sXG4gICAge1xuICAgICAgbmFtZTogJ2V4cG9ydGVkIGNvZGUnLFxuICAgICAgY29tcG9uZW50OiBuZXcgRXhwb3J0KClcbiAgICB9XG4gIF07XG59XG5cblxuXG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vbGVvbmFyZG8uZC50c1wiIC8+XG5cbmltcG9ydCB7VUlWaWV3U3RhdGV9IGZyb20gJy4vdWktc3RhdGUubW9kZWwnO1xuaW1wb3J0IEV2ZW50cyBmcm9tICcuLi91aS1ldmVudHMnO1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVUlTdGF0ZVZpZXdTZXJ2aWNlIHtcblxuICBwcml2YXRlIHN0YXRpYyBfaW5zdGFuY2U6IFVJU3RhdGVWaWV3U2VydmljZSA9IG5ldyBVSVN0YXRlVmlld1NlcnZpY2UoKTtcbiAgcHJpdmF0ZSBjdXJWaWV3U3RhdGU6IFVJVmlld1N0YXRlO1xuICBwcml2YXRlIHZpZXdTdGF0ZUxpc3Q6IEFycmF5PFVJVmlld1N0YXRlPjtcblxuICBzdGF0aWMgZ2V0SW5zdGFuY2UoKTogVUlTdGF0ZVZpZXdTZXJ2aWNlIHtcbiAgICByZXR1cm4gVUlTdGF0ZVZpZXdTZXJ2aWNlLl9pbnN0YW5jZTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIGlmIChVSVN0YXRlVmlld1NlcnZpY2UuX2luc3RhbmNlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VJU3RhdGVWaWV3U2VydmljZSBzaG91bGQgYmUgc2luZ2xldG9uJyk7XG4gICAgfVxuICAgIFVJU3RhdGVWaWV3U2VydmljZS5faW5zdGFuY2UgPSB0aGlzO1xuICB9XG5cblxuXG4gIGluaXQodmlld1N0YXRlTGlzdDogQXJyYXk8VUlWaWV3U3RhdGU+LCBpbml0Vmlld05hbWU6IHN0cmluZykge1xuICAgIHRoaXMudmlld1N0YXRlTGlzdCA9IHZpZXdTdGF0ZUxpc3Q7XG4gICAgdGhpcy5jdXJWaWV3U3RhdGUgPSB0aGlzLmdldFZpZXdTdGF0ZUJ5TmFtZShpbml0Vmlld05hbWUpO1xuICB9XG5cbiAgZ2V0Q3VyVmlld1N0YXRlKCl7XG4gICAgcmV0dXJuIHRoaXMuY3VyVmlld1N0YXRlO1xuICB9XG5cbiAgc2V0Q3VyVmlld1N0YXRlKHN0YXRlTmFtZTogc3RyaW5nKXtcbiAgICB0aGlzLmN1clZpZXdTdGF0ZSA9IHRoaXMuZ2V0Vmlld1N0YXRlQnlOYW1lKHN0YXRlTmFtZSk7XG4gICAgRXZlbnRzLmRpc3BhdGNoKEV2ZW50cy5DSEFOR0VfVklFVywgdGhpcy5jdXJWaWV3U3RhdGUpO1xuICB9XG5cbiAgZ2V0Vmlld1N0YXRlcygpe1xuICAgIHJldHVybiB0aGlzLnZpZXdTdGF0ZUxpc3Q7XG4gIH1cblxuICBhZGRWaWV3U3RhdGUodmlld1N0YXRlOiBVSVZpZXdTdGF0ZSl7XG4gICAgdGhpcy52aWV3U3RhdGVMaXN0LnB1c2godmlld1N0YXRlKTtcbiAgfVxuXG4gIHJlbW92ZVZpZXdTdGF0ZSh2aWV3U3RhdGVOYW1lOiBzdHJpbmcpe1xuICAgIHRoaXMudmlld1N0YXRlTGlzdCA9IHRoaXMudmlld1N0YXRlTGlzdC5maWx0ZXIoKHZpZXc6IFVJVmlld1N0YXRlKSA9PiB7XG4gICAgICByZXR1cm4gdmlldy5uYW1lID09PSB2aWV3U3RhdGVOYW1lO1xuICAgIH0pXG4gIH1cblxuICBwcml2YXRlIGdldFZpZXdTdGF0ZUJ5TmFtZSh2aWV3U3RhdGVOYW1lOiBzdHJpbmcpOiBVSVZpZXdTdGF0ZXtcbiAgICBsZXQgcmV0VmlldzogVUlWaWV3U3RhdGU7XG4gICAgdGhpcy52aWV3U3RhdGVMaXN0LnNvbWUoKHZpZXc6IFVJVmlld1N0YXRlKSA9PiB7XG4gICAgICBpZih2aWV3U3RhdGVOYW1lID09PSB2aWV3Lm5hbWUpe1xuICAgICAgICByZXR1cm4gISEocmV0VmlldyA9IHZpZXcpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXRWaWV3IHx8IHRoaXMuY3VyVmlld1N0YXRlO1xuICB9XG5cbn0iLCJleHBvcnQgZGVmYXVsdCBjbGFzcyBVaVV0aWxzIHtcbiAgY29uc3RydWN0b3IoKSB7fVxuICBzdGF0aWMgZ2V0RWxlbWVudEZyb21IdG1sKGh0bWw6IHN0cmluZykgOiBIVE1MRWxlbWVudCB7XG4gICAgY29uc3QgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgZGl2LmlubmVySFRNTCA9IGh0bWw7XG4gICAgcmV0dXJuIDxIVE1MRWxlbWVudD5kaXYuZmlyc3RDaGlsZDtcbiAgfVxuXG4gIHN0YXRpYyBndWlkR2VuZXJhdG9yKCkge1xuICAgIHZhciBTNCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICgoKDErTWF0aC5yYW5kb20oKSkqMHgxMDAwMCl8MCkudG9TdHJpbmcoMTYpLnN1YnN0cmluZygxKTtcbiAgICB9O1xuICAgIHJldHVybiAoUzQoKStTNCgpK1wiLVwiK1M0KCkrXCItXCIrUzQoKStcIi1cIitTNCgpK1wiLVwiK1M0KCkrUzQoKStTNCgpKTtcbiAgfVxuXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vbGVvbmFyZG8uZC50c1wiIC8+XG5pbXBvcnQgVXRpbHMgZnJvbSAnLi4vdWktdXRpbHMnO1xuaW1wb3J0IEV2ZW50cyBmcm9tICcuLi91aS1ldmVudHMnO1xuaW1wb3J0IHtVSVZpZXdTdGF0ZX0gZnJvbSAnLi4vdWktc3RhdGUvdWktc3RhdGUubW9kZWwnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBWaWV3c0NvbnRhaW5lciB7XG5cbiAgY3VycmVudFZpZXdTdGF0ZTogVUlWaWV3U3RhdGU7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgRXZlbnRzLm9uKEV2ZW50cy5DSEFOR0VfVklFVywgdGhpcy5vblZpZXdDaGFuZ2VkLmJpbmQodGhpcykpO1xuICB9XG5cbiAgZ2V0KCkge1xuICAgIHJldHVybiBVdGlscy5nZXRFbGVtZW50RnJvbUh0bWwoYDxkaXYgaWQ9XCJsZW9uYXJkby12aWV3cy1jb250YWluZXJcIiBjbGFzcz1cImxlb25hcmRvLXZpZXdzLWNvbnRhaW5lclwiPnZpZXcgY29udGFpbmVyPC9kaXY+YCk7XG4gIH1cblxuICBnZXRWaWV3Tm9kZSgpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xlb25hcmRvLXZpZXdzLWNvbnRhaW5lcicpO1xuICB9XG5cbiAgcmVuZGVyKHZpZXdTdGF0ZTogVUlWaWV3U3RhdGUpIHtcbiAgICB0aGlzLmN1cnJlbnRWaWV3U3RhdGUgPSB2aWV3U3RhdGU7XG4gICAgdGhpcy5nZXRWaWV3Tm9kZSgpLmlubmVySFRNTCA9ICcnO1xuICAgIHRoaXMuZ2V0Vmlld05vZGUoKS5hcHBlbmRDaGlsZCh2aWV3U3RhdGUuY29tcG9uZW50LmdldCgpKTtcbiAgICB2aWV3U3RhdGUuY29tcG9uZW50LnJlbmRlcigpO1xuICB9XG5cbiAgb25WaWV3Q2hhbmdlZChldmVudDogQ3VzdG9tRXZlbnQpIHtcbiAgICB0aGlzLmN1cnJlbnRWaWV3U3RhdGUuY29tcG9uZW50LmRlc3Ryb3koKTtcbiAgICB0aGlzLnJlbmRlcihldmVudC5kZXRhaWwpO1xuICB9XG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi8uLi9sZW9uYXJkby5kLnRzXCIgLz5cbmltcG9ydCBVdGlscyBmcm9tICcuLi8uLi91aS11dGlscyc7XG5pbXBvcnQgRXZlbnRzIGZyb20gJy4uLy4uL3VpLWV2ZW50cyc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEV4cG9ydCB7XG5cbiAgdmlld05vZGU6IEhUTUxFbGVtZW50O1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICB9XG5cbiAgZ2V0KCkge1xuICAgIHJldHVybiB0aGlzLnZpZXdOb2RlID0gVXRpbHMuZ2V0RWxlbWVudEZyb21IdG1sKGA8ZGl2IGlkPVwibGVvbmFyZG8tZXhwb3J0XCIgY2xhc3M9XCJsZW9uYXJkby1leHBvcnRcIj5cbiAgICAgIDxidXR0b24gY2xhc3M9XCJsZW9uYXJkby1idXR0b24gZXhwb3J0QnV0dG9uc1wiIGRhdGEtY2xpcGJvYXJkLXRhcmdldD1cIiNleHBvcnRlZENvZGVcIj4gQ29weSBUbyBDbGlwYm9hcmQ8L2J1dHRvbj5cbiAgICAgIDxidXR0b24gY2xhc3M9XCJsZW9uYXJkby1idXR0b24gZXhwb3J0QnV0dG9uc1wiID4gRG93bmxvYWQgQ29kZTwvYnV0dG9uPlxuICAgICAgPGNvZGUgY29udGVudGVkaXRhYmxlPlxuICAgICAgICA8ZGl2IGlkPVwiZXhwb3J0ZWRDb2RlXCI+XG4gICAgICAgICAgXG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9jb2RlPlxuICAgIDwvZGl2PmApO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuXG4gIH1cblxuICBkZXN0cm95KCkge1xuXG4gIH1cblxufVxuIiwiaW1wb3J0IFV0aWxzIGZyb20gJy4uLy4uLy4uL3VpLXV0aWxzJztcbmltcG9ydCBFdmVudHMgZnJvbSAnLi4vLi4vLi4vdWktZXZlbnRzJztcbmltcG9ydCBSZWNvcmRlclN0YXRlRGV0YWlsIGZyb20gXCIuLi9zdGF0ZS1kZXRhaWwvc3RhdGVzLWRldGFpbFwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZWNvcmRlckxpc3Qge1xuXG4gIHZpZXdOb2RlOiBIVE1MRWxlbWVudDtcbiAgc3RhdGVEZXRhaWw6IFJlY29yZGVyU3RhdGVEZXRhaWwgPSBuZXcgUmVjb3JkZXJTdGF0ZURldGFpbCgpO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgbWVudVZpZXc6IE5vZGUpIHtcbiAgICBFdmVudHMub24oRXZlbnRzLlRPR0dMRV9MQVVOQ0hFUiwgdGhpcy5yZW5kZXIuYmluZCh0aGlzKSlcbiAgfVxuXG4gIGdldCgpIHtcbiAgICByZXR1cm4gdGhpcy52aWV3Tm9kZSA9IFV0aWxzLmdldEVsZW1lbnRGcm9tSHRtbChgPGRpdiBpZD1cImxlb25hcmRvLXJlY29yZGVyLWxpc3RcIiBjbGFzcz1cImxlb25hcmRvLXJlY29yZGVyLWxpc3RcIj48L2Rpdj5gKTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICBpZighdGhpcy52aWV3Tm9kZSl7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGxpc3QgPSBVdGlscy5nZXRFbGVtZW50RnJvbUh0bWwoYDx1bCBjbGFzcz1cImxlb25hcmRvLXJlY29yZGVyLWxpc3QtY29udGFpbmVyXCI+PC91bD5gKTtcbiAgICB0aGlzLmdldFN0YXRlSXRlbXMoKS5mb3JFYWNoKChpdGVtKSA9PiB7bGlzdC5hcHBlbmRDaGlsZChpdGVtKX0pO1xuICAgIHRoaXMudmlld05vZGUuYXBwZW5kQ2hpbGQobGlzdCk7XG4gICAgdGhpcy5tZW51Vmlldy5hcHBlbmRDaGlsZCh0aGlzLnN0YXRlRGV0YWlsLmdldCgpKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0U3RhdGVJdGVtcygpOiBBcnJheTxhbnk+IHtcbiAgICByZXR1cm4gTGVvbmFyZG8uZ2V0UmVjb3JkZWRTdGF0ZXMoKS5tYXAoKHN0YXRlKSA9PiB7XG4gICAgICBjb25zdCBpdGVtID0gVXRpbHMuZ2V0RWxlbWVudEZyb21IdG1sKGA8bGkgY2xhc3M9XCJsZW9uYXJkby1yZWNvcmRlci1saXN0LWl0ZW1cIj5gKTtcbiAgICAgIGl0ZW0uaW5uZXJIVE1MID1cbiAgICAgICAgICBgPHNwYW4gY2xhc3M9XCJsZW9uYXJkby1yZWNvcmRlci1saXN0LXZlcmIgbGVvbmFyZG8tcmVjb3JkZXItbGlzdC12ZXJiLSR7c3RhdGUudmVyYi50b0xvd2VyQ2FzZSgpfVwiPiR7c3RhdGUudmVyYn08L3NwYW4+XG4gICAgICAgICAgIDxzcGFuIGNsYXNzPVwibGVvbmFyZG8tcmVjb3JkZXItbGlzdC11cmxcIj4ke3N0YXRlLnVybH08L3NwYW4+YDtcbiAgICAgIGl0ZW0uaW5uZXJIVE1MICs9IHN0YXRlLnJlY29yZGVkID8gYDxzcGFuIGNsYXNzPVwibGVvbmFyZG8tcmVjb3JkZXItbGlzdC1uYW1lXCI+JHtzdGF0ZS5uYW1lfTwvc3Bhbj5gIDpcbiAgICAgICAgYDxzcGFuIGNsYXNzPVwibGVvbmFyZG8tcmVjb3JkZXItbGlzdC1uYW1lIGxlb25hcmRvLXJlY29yZGVyLWxpc3QtbmFtZS1uZXdcIj5OZXc8L3NwYW4+YFxuICAgICAgaXRlbS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMudG9nZ2xlRGV0YWlscy5iaW5kKHRoaXMsIHN0YXRlKSk7XG4gICAgICByZXR1cm4gaXRlbTtcbiAgICB9KVxuICB9XG5cbiAgdG9nZ2xlRGV0YWlscyhzdGF0ZSl7XG4gICAgc3RhdGUuYWN0aXZlT3B0aW9uID0gc3RhdGUub3B0aW9uc1swXTtcbiAgICB0aGlzLnN0YXRlRGV0YWlsLm9wZW4oc3RhdGUpO1xuICB9XG5cblxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uLy4uL2xlb25hcmRvLmQudHNcIiAvPlxuaW1wb3J0IFV0aWxzIGZyb20gJy4uLy4uL3VpLXV0aWxzJztcbmltcG9ydCBFdmVudHMgZnJvbSAnLi4vLi4vdWktZXZlbnRzJztcbmltcG9ydCBSZWNvcmRlckxpc3QgZnJvbSAnLi9yZWNvcmRlci1saXN0L3JlY29yZGVyLWxpc3QnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZWNvcmRlciB7XG5cbiAgdmlld05vZGU6IEhUTUxFbGVtZW50O1xuICByZWNvcmRlckxpc3Q6IFJlY29yZGVyTGlzdDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIG1lbnVWaWV3OiBIVE1MRWxlbWVudCkge1xuICAgIHRoaXMucmVjb3JkZXJMaXN0ID0gbmV3IFJlY29yZGVyTGlzdChtZW51Vmlldyk7XG4gIH1cblxuICBnZXQoKSB7XG4gICAgcmV0dXJuIHRoaXMudmlld05vZGUgPSBVdGlscy5nZXRFbGVtZW50RnJvbUh0bWwoYDxkaXYgaWQ9XCJsZW9uYXJkby1yZWNvcmRlclwiIGNsYXNzPVwibGVvbmFyZG8tcmVjb3JkZXJcIjwvZGl2PmApO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIHRoaXMudmlld05vZGUuYXBwZW5kQ2hpbGQodGhpcy5yZWNvcmRlckxpc3QuZ2V0KCkpO1xuICAgIHRoaXMucmVjb3JkZXJMaXN0LnJlbmRlcigpO1xuICB9XG5cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLm1lbnVWaWV3LmlubmVySFRNTCA9ICcnO1xuICB9XG59XG4iLCJpbXBvcnQgVXRpbHMgZnJvbSAnLi4vLi4vLi4vdWktdXRpbHMnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZWNvcmRlclN0YXRlRGV0YWlsIHtcbiAgdmlld05vZGU6IGFueTtcbiAgb3BlblN0YXRlOiBib29sZWFuID0gZmFsc2U7XG4gIGN1clN0YXRlO1xuICBvbkNhbmNlbEJpbmRlZDogRXZlbnRMaXN0ZW5lciA9IHRoaXMub25DYW5jZWwuYmluZCh0aGlzKTtcbiAgb25TYXZlQmluZGVkOiBFdmVudExpc3RlbmVyID0gdGhpcy5vblNhdmUuYmluZCh0aGlzKTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnZpZXdOb2RlID0gVXRpbHMuZ2V0RWxlbWVudEZyb21IdG1sKGA8ZGl2IGlkPVwibGVvbmFyZG8tc3RhdGUtZGV0YWlsXCIgY2xhc3M9XCJsZW9uYXJkby1zdGF0ZS1kZXRhaWwtcmVjb3JkZXJcIj48L2Rpdj5gKTtcbiAgfVxuXG4gIGdldCgpIHtcbiAgICByZXR1cm4gdGhpcy52aWV3Tm9kZTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICBpZiAodGhpcy52aWV3Tm9kZS5pbm5lckhUTUwpIHtcbiAgICAgIHRoaXMudmlld05vZGUucXVlcnlTZWxlY3RvcignLmxlb25hcmRvLXN0YXRlcy1kZXRhaWwtY2FuY2VsJykucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm9uQ2FuY2VsQmluZGVkLCBmYWxzZSk7XG4gICAgICB0aGlzLnZpZXdOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5sZW9uYXJkby1zdGF0ZXMtZGV0YWlsLXNhdmUnKS5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMub25TYXZlQmluZGVkLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgbGV0IGh0bWw7XG5cbiAgICAvL1RPRE8gY29uZ3JhdHVsYXRlIG91cnNlbHZlcyBvbiBiZWluZyBhd2Vzb21lISFcbiAgICBpZiAodGhpcy5jdXJTdGF0ZS5yZWNvcmRlZCkge1xuICAgICAgaHRtbCA9IGA8ZGl2IGNsYXNzPVwibGVvbmFyZG8tc3RhdGVzLWRldGFpbC1oZWFkZXJcIj5BZGQgbW9ja2VkIHJlc3BvbnNlIGZvciA8c3Ryb25nPiR7dGhpcy5jdXJTdGF0ZS5uYW1lfTwvc3Ryb25nPjwvZGl2PmA7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgaHRtbCA9IGA8aDEgY2xhc3M9XCJsZW9uYXJkby1zdGF0ZXMtZGV0YWlsLWhlYWRlclwiLz5BZGQgbmV3IHN0YXRlPC9oMT5cbiAgICAgICAgICAgICAgPGRpdj5TdGF0ZSBuYW1lOiA8aW5wdXQgY2xhc3M9XCJsZW9uYXJkby1zdGF0ZXMtZGV0YWlsLXN0YXRlLW5hbWVcIi8+PC9kaXY+YDtcbiAgICB9XG5cbiAgICBodG1sICs9IGA8ZGl2Pk9wdGlvbiBuYW1lOiA8aW5wdXQgY2xhc3M9XCJsZW9uYXJkby1zdGF0ZXMtZGV0YWlsLW9wdGlvbi1uYW1lXCIgdmFsdWU9XCIke3RoaXMuY3VyU3RhdGUub3B0aW9uc1swXS5uYW1lfVwiLz48L2Rpdj5cbiAgICAgICAgICAgICAgPGRpdj5TdGF0dXMgY29kZTogPGlucHV0IGNsYXNzPVwibGVvbmFyZG8tc3RhdGVzLWRldGFpbC1zdGF0dXNcIiB2YWx1ZT1cIiR7dGhpcy5jdXJTdGF0ZS5vcHRpb25zWzBdLnN0YXR1c31cIi8+PC9kaXY+XG4gICAgICAgICAgICAgIDxkaXY+RGVsYXk6IDxpbnB1dCBjbGFzcz1cImxlb25hcmRvLXN0YXRlcy1kZXRhaWwtZGVsYXlcIiB2YWx1ZT1cIjBcIi8+PC9kaXY+XG4gICAgICAgICAgICAgIDxkaXY+UmVzcG9uc2U6IDx0ZXh0YXJlYSBjbGFzcz1cImxlb25hcmRvLXN0YXRlcy1kZXRhaWwtanNvblwiPiR7dGhpcy5nZXRSZXNTdHJpbmcodGhpcy5jdXJTdGF0ZS5vcHRpb25zWzBdLmRhdGEpfTwvdGV4dGFyZWE+PC9kaXY+XG4gICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJsZW9uYXJkby1idXR0b24gbGVvbmFyZG8tc3RhdGVzLWRldGFpbC1zYXZlXCI+U2F2ZTwvYnV0dG9uPlxuICAgICAgICAgICAgICA8YnV0dG9uIGNsYXNzPVwibGVvbmFyZG8tYnV0dG9uIGxlb25hcmRvLXN0YXRlcy1kZXRhaWwtY2FuY2VsXCIgPkNhbmNlbDwvYnV0dG9uPmA7XG5cbiAgICB0aGlzLnZpZXdOb2RlLmlubmVySFRNTCA9IGh0bWw7XG4gICAgdGhpcy52aWV3Tm9kZS5xdWVyeVNlbGVjdG9yKCcubGVvbmFyZG8tc3RhdGVzLWRldGFpbC1jYW5jZWwnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMub25DYW5jZWxCaW5kZWQsIGZhbHNlKTtcbiAgICB0aGlzLnZpZXdOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5sZW9uYXJkby1zdGF0ZXMtZGV0YWlsLXNhdmUnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMub25TYXZlQmluZGVkLCBmYWxzZSk7XG4gIH1cblxuICBvcGVuKHN0YXRlKSB7XG4gICAgdGhpcy5jdXJTdGF0ZSA9IHN0YXRlO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gICAgdGhpcy5vcGVuU3RhdGUgPSB0cnVlO1xuICAgIHRoaXMudmlld05vZGUuc3R5bGUuZGlzcGxheSA9ICcnO1xuICB9XG5cbiAgY2xvc2Uoc3RhdGU/KSB7XG4gICAgaWYgKHN0YXRlICYmIHRoaXMuY3VyU3RhdGUgIT09IHN0YXRlKSB7XG4gICAgICB0aGlzLm9wZW4oc3RhdGUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLm9wZW5TdGF0ZSA9IGZhbHNlO1xuICAgIHRoaXMudmlld05vZGUuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgfVxuXG4gIHRvZ2dsZShzdGF0ZSkge1xuICAgIGlmICh0aGlzLm9wZW5TdGF0ZSkge1xuICAgICAgdGhpcy5jbG9zZShzdGF0ZSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMub3BlbihzdGF0ZSk7XG4gIH1cbiAgXG4gIHByaXZhdGUgZ2V0UmVzU3RyaW5nKHJlc29wbnNlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGxldCByZXNTdHI6IHN0cmluZztcbiAgICB0cnkge1xuICAgICAgcmVzU3RyID0gSlNPTi5zdHJpbmdpZnkocmVzb3Buc2UsIG51bGwsIDQpO1xuICAgIH1cbiAgICBjYXRjaChlKXtcbiAgICAgICByZXNTdHIgPSB0eXBlb2YgcmVzb3Buc2UgPT09ICdzdHJpbmcnID8gcmVzb3Buc2UgOiByZXNvcG5zZS50b1N0cmluZygpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzU3RyO1xuICB9XG5cbiAgcHJpdmF0ZSBvbkNhbmNlbCgpIHtcbiAgICB0aGlzLmNsb3NlKCk7XG4gIH1cblxuICBwcml2YXRlIG9uU2F2ZSgpIHtcbiAgICBjb25zdCBzdGF0dXNWYWw6IHN0cmluZyA9IHRoaXMudmlld05vZGUucXVlcnlTZWxlY3RvcihcIi5sZW9uYXJkby1zdGF0ZXMtZGV0YWlsLXN0YXR1c1wiKS52YWx1ZTtcbiAgICBjb25zdCBkZWxheVZhbDogc3RyaW5nID0gdGhpcy52aWV3Tm9kZS5xdWVyeVNlbGVjdG9yKFwiLmxlb25hcmRvLXN0YXRlcy1kZXRhaWwtZGVsYXlcIikudmFsdWU7XG4gICAgY29uc3QganNvblZhbDogc3RyaW5nID0gdGhpcy52aWV3Tm9kZS5xdWVyeVNlbGVjdG9yKFwiLmxlb25hcmRvLXN0YXRlcy1kZXRhaWwtanNvblwiKS52YWx1ZTtcbiAgICBjb25zdCBvcHRpb25OYW1lVmFsOiBzdHJpbmcgPSB0aGlzLnZpZXdOb2RlLnF1ZXJ5U2VsZWN0b3IoXCIubGVvbmFyZG8tc3RhdGVzLWRldGFpbC1vcHRpb24tbmFtZVwiKS52YWx1ZTtcbiAgICB0aGlzLmN1clN0YXRlLmFjdGl2ZU9wdGlvbi5zdGF0dXMgPSBzdGF0dXNWYWw7XG4gICAgdGhpcy5jdXJTdGF0ZS5hY3RpdmVPcHRpb24uZGVsYXkgPSBkZWxheVZhbDtcbiAgICB0aGlzLmN1clN0YXRlLmFjdGl2ZU9wdGlvbi5uYW1lID0gb3B0aW9uTmFtZVZhbDtcbiAgICBpZighdGhpcy5jdXJTdGF0ZS5yZWNvcmRlZCl7XG4gICAgICB0aGlzLmN1clN0YXRlLm5hbWUgPSB0aGlzLnZpZXdOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5sZW9uYXJkby1zdGF0ZXMtZGV0YWlsLXN0YXRlLW5hbWUnKS52YWx1ZSB8fCB0aGlzLmN1clN0YXRlLm5hbWU7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICB0aGlzLmN1clN0YXRlLmFjdGl2ZU9wdGlvbi5kYXRhID0gSlNPTi5wYXJzZShqc29uVmFsKTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgIHRoaXMuY3VyU3RhdGUuYWN0aXZlT3B0aW9uLmRhdGEgPSBqc29uVmFsO1xuICAgIH1cblxuICAgIExlb25hcmRvLmFkZE9yVXBkYXRlU2F2ZWRTdGF0ZSh0aGlzLmN1clN0YXRlKTtcbiAgICB0aGlzLmNsb3NlKCk7XG4gIH1cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi8uLi8uLi9sZW9uYXJkby5kLnRzXCIgLz5cbmltcG9ydCBVdGlscyBmcm9tICcuLi8uLi8uLi91aS11dGlscyc7XG5pbXBvcnQgRXZlbnRzIGZyb20gJy4uLy4uLy4uL3VpLWV2ZW50cyc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNjZW5hcmlvc0xpc3Qge1xuXG4gIHZpZXdOb2RlOiBhbnk7XG4gIHNldFNjZW5hcmlvQmluZGVkOiBFdmVudExpc3RlbmVyID0gdGhpcy5zZXRTY2VuYXJpby5iaW5kKHRoaXMpO1xuICBzdGF0aWMgU0VMRUNURURfQ0xBU1MgPSAnbGVvbmFyZG8tc2VsZWN0ZWQtc2NlbmFyaW8nO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMudmlld05vZGUgPSBVdGlscy5nZXRFbGVtZW50RnJvbUh0bWwoYDxkaXYgaWQ9XCJsZW9uYXJkby1zY2VuYXJpb3MtbGlzdFwiIGNsYXNzPVwibGVvbmFyZG8tc2NlbmFyaW9zLWxpc3RcIj48L2Rpdj5gKTtcbiAgICB0aGlzLnZpZXdOb2RlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5zZXRTY2VuYXJpb0JpbmRlZCwgZmFsc2UpO1xuICAgIEV2ZW50cy5vbihFdmVudHMuQUREX1NDRU5BUklPLCB0aGlzLmFkZFNjZW5hcmlvLmJpbmQodGhpcykpO1xuICB9XG5cbiAgZ2V0KCkge1xuICAgIHJldHVybiB0aGlzLnZpZXdOb2RlO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIHRoaXMudmlld05vZGUuaW5uZXJIVE1MID0gJyc7XG4gICAgdGhpcy52aWV3Tm9kZS5hcHBlbmRDaGlsZChVdGlscy5nZXRFbGVtZW50RnJvbUh0bWwoYDxkaXY+U2NlbmFyaW9zPC9kaXY+YCkpO1xuICAgIGNvbnN0IHVsID0gVXRpbHMuZ2V0RWxlbWVudEZyb21IdG1sKGA8dWw+PC91bD5gKTtcbiAgICBMZW9uYXJkby5nZXRTY2VuYXJpb3MoKVxuICAgICAgLm1hcCh0aGlzLmdldFNjZW5hcmlvRWxlbWVudC5iaW5kKHRoaXMpKVxuICAgICAgLmZvckVhY2goKHNjZW5hcmlvRWxtKSA9PiB7XG4gICAgICAgIHVsLmFwcGVuZENoaWxkKHNjZW5hcmlvRWxtKTtcbiAgICAgIH0pO1xuICAgIHRoaXMudmlld05vZGUuYXBwZW5kQ2hpbGQodWwpO1xuXG4gIH1cblxuICBnZXRTY2VuYXJpb0VsZW1lbnQoc2NlbmFyaW8pIHtcbiAgICBjb25zdCBlbCA9IFV0aWxzLmdldEVsZW1lbnRGcm9tSHRtbChgPGxpPiR7c2NlbmFyaW99PC9saT5gKTtcbiAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgIEV2ZW50cy5kaXNwYXRjaChFdmVudHMuU0NFTkFSSU9fQ0xJQ0tFRCwgeyBuYW1lOiBzY2VuYXJpbyB9KTtcbiAgICAgIHRoaXMudmlld05vZGUucXVlcnlTZWxlY3RvckFsbCgnbGknKS5mb3JFYWNoKGxpID0+IGxpLmNsYXNzTGlzdC5yZW1vdmUoU2NlbmFyaW9zTGlzdC5TRUxFQ1RFRF9DTEFTUykpO1xuICAgICAgZWwuY2xhc3NMaXN0LmFkZChTY2VuYXJpb3NMaXN0LlNFTEVDVEVEX0NMQVNTKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZWw7XG4gIH1cblxuICBwcml2YXRlIHNldFNjZW5hcmlvKGV2ZW50OiBNb3VzZUV2ZW50KSB7XG4gICAgY29uc3Qgc2NlbmFyaW9OYW1lOiBzdHJpbmcgPSBldmVudC50YXJnZXRbJ2lubmVySFRNTCddO1xuICAgIGNvbnN0IHN0YXRlczogQXJyYXk8YW55PiA9IExlb25hcmRvLmdldFNjZW5hcmlvKHNjZW5hcmlvTmFtZSk7XG4gICAgRXZlbnRzLmRpc3BhdGNoKEV2ZW50cy5UT0dHTEVfU1RBVEVTLCBmYWxzZSk7XG4gICAgc3RhdGVzLmZvckVhY2goKHN0YXRlKT0+e1xuICAgICAgRXZlbnRzLmRpc3BhdGNoKGAke0V2ZW50cy5UT0dHTEVfU1RBVEVTfToke3N0YXRlLm5hbWV9YCwgc3RhdGUub3B0aW9uKTtcbiAgICB9KTtcbiAgfVxuXG4gIG9uRGVzdHJveSgpe1xuICAgIHRoaXMudmlld05vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLnNldFNjZW5hcmlvQmluZGVkLCBmYWxzZSk7XG4gIH1cblxuICBwcml2YXRlIGFkZFNjZW5hcmlvKGV2ZW50OiBDdXN0b21FdmVudCkge1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi8uLi9sZW9uYXJkby5kLnRzXCIgLz5cbmltcG9ydCBVdGlscyBmcm9tICcuLi8uLi91aS11dGlscyc7XG5pbXBvcnQgRXZlbnRzIGZyb20gJy4uLy4uL3VpLWV2ZW50cyc7XG5pbXBvcnQgU3RhdGVzTGlzdCBmcm9tICcuL3N0YXRlcy1saXN0L3N0YXRlcy1saXN0JztcbmltcG9ydCBTY2VuYXJpb3NMaXN0IGZyb20gJy4vc2NlbmFyaW9zLWxpc3Qvc2NlbmFyaW9zLWxpc3QnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTY2VuYXJpb3Mge1xuXG4gIHN0YXRlTGlzdDogU3RhdGVzTGlzdDtcbiAgc2NlbmFyaW9zTGlzdDogU2NlbmFyaW9zTGlzdDtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5zdGF0ZUxpc3QgPSBuZXcgU3RhdGVzTGlzdCgpO1xuICAgIHRoaXMuc2NlbmFyaW9zTGlzdCA9IG5ldyBTY2VuYXJpb3NMaXN0KCk7XG4gIH1cblxuICBnZXQoKSB7XG4gICAgY29uc3QgZWwgPSBVdGlscy5nZXRFbGVtZW50RnJvbUh0bWwoYDxkaXYgaWQ9XCJsZW9uYXJkby1zY2VuYXJpb3NcIiBjbGFzcz1cImxlb25hcmRvLXNjZW5hcmlvc1wiPjwvZGl2PmApO1xuICAgIGVsLmFwcGVuZENoaWxkKHRoaXMuc2NlbmFyaW9zTGlzdC5nZXQoKSk7XG4gICAgZWwuYXBwZW5kQ2hpbGQodGhpcy5zdGF0ZUxpc3QuZ2V0KCkpO1xuICAgIHJldHVybiBlbDtcbiAgfVxuXG4gIGdldFZpZXdOb2RlKCkge1xuICAgIHJldHVybiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbGVvbmFyZG8tc2NlbmFyaW9zJyk7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgdGhpcy5zdGF0ZUxpc3QucmVuZGVyKCk7XG4gICAgdGhpcy5zY2VuYXJpb3NMaXN0LnJlbmRlcigpO1xuICB9XG5cbiAgZGVzdHJveSgpIHtcblxuICB9XG59XG4iLCJpbXBvcnQgVXRpbHMgZnJvbSAnLi4vLi4vLi4vLi4vdWktdXRpbHMnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTdGF0ZURldGFpbCB7XG4gIHZpZXdOb2RlOiBhbnk7XG4gIG9wZW5TdGF0ZTogYm9vbGVhbiA9IGZhbHNlO1xuICBjdXJTdGF0ZTtcbiAgb25DYW5jZWxCaW5kZWQ6IEV2ZW50TGlzdGVuZXIgPSB0aGlzLm9uQ2FuY2VsLmJpbmQodGhpcyk7XG4gIG9uU2F2ZUJpbmRlZDogRXZlbnRMaXN0ZW5lciA9IHRoaXMub25TYXZlLmJpbmQodGhpcyk7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgb25TYXZlQ0IsIHByaXZhdGUgb25DYW5jZWxDQikge1xuICAgIHRoaXMudmlld05vZGUgPSBVdGlscy5nZXRFbGVtZW50RnJvbUh0bWwoYDxkaXYgaWQ9XCJsZW9uYXJkby1zdGF0ZS1kZXRhaWxcIiBjbGFzcz1cImxlb25hcmRvLXN0YXRlLWRldGFpbFwiPjwvZGl2PmApO1xuICB9XG5cbiAgZ2V0KCkge1xuICAgIHJldHVybiB0aGlzLnZpZXdOb2RlO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIGlmKHRoaXMudmlld05vZGUuaW5uZXJIVE1MKXtcbiAgICAgIHRoaXMudmlld05vZGUucXVlcnlTZWxlY3RvcignLmxlb25hcmRvLXN0YXRlcy1kZXRhaWwtY2FuY2VsJykucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm9uQ2FuY2VsQmluZGVkLCBmYWxzZSk7XG4gICAgICB0aGlzLnZpZXdOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5sZW9uYXJkby1zdGF0ZXMtZGV0YWlsLXNhdmUnKS5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMub25TYXZlQmluZGVkLCBmYWxzZSk7XG4gICAgfVxuICAgIHRoaXMudmlld05vZGUuaW5uZXJIVE1MID0gYFxuICAgICAgPGRpdiBjbGFzcz1cImxlb25hcmRvLXN0YXRlcy1kZXRhaWwtaGVhZGVyXCI+IFxuICAgICAgICBFZGl0IG9wdGlvbiA8c3Ryb25nPiR7dGhpcy5jdXJTdGF0ZS5hY3RpdmVPcHRpb24ubmFtZX08L3N0cm9uZz5cbiAgICAgICAgZm9yIDxzdHJvbmc+JHt0aGlzLmN1clN0YXRlLm5hbWV9PC9zdHJvbmc+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2PlN0YXR1cyBjb2RlOiA8aW5wdXQgY2xhc3M9XCJsZW9uYXJkby1zdGF0ZXMtZGV0YWlsLXN0YXR1c1wiIHZhbHVlPVwiJHt0aGlzLmN1clN0YXRlLmFjdGl2ZU9wdGlvbi5zdGF0dXN9XCIvPjwvZGl2PlxuICAgICAgICA8ZGl2PkRlbGF5OiA8aW5wdXQgY2xhc3M9XCJsZW9uYXJkby1zdGF0ZXMtZGV0YWlsLWRlbGF5XCIgdmFsdWU9XCIke3RoaXMuY3VyU3RhdGUuYWN0aXZlT3B0aW9uLmRlbGF5fVwiLz48L2Rpdj5cbiAgICAgICAgPGRpdj5SZXNwb25zZSBKU09OOlxuICAgICAgICAgIDx0ZXh0YXJlYSBjbGFzcz1cImxlb25hcmRvLXN0YXRlcy1kZXRhaWwtanNvblwiPiR7dGhpcy5nZXRSZXNTdHJpbmcodGhpcy5jdXJTdGF0ZS5hY3RpdmVPcHRpb24uZGF0YSl9PC90ZXh0YXJlYT5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxidXR0b24gY2xhc3M9XCJsZW9uYXJkby1idXR0b24gbGVvbmFyZG8tc3RhdGVzLWRldGFpbC1zYXZlXCI+U2F2ZTwvYnV0dG9uPlxuICAgICAgICA8YnV0dG9uIGNsYXNzPVwibGVvbmFyZG8tYnV0dG9uIGxlb25hcmRvLXN0YXRlcy1kZXRhaWwtY2FuY2VsXCIgPkNhbmNlbDwvYnV0dG9uPmA7XG4gICAgICAgIHRoaXMudmlld05vZGUucXVlcnlTZWxlY3RvcignLmxlb25hcmRvLXN0YXRlcy1kZXRhaWwtY2FuY2VsJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm9uQ2FuY2VsQmluZGVkLCBmYWxzZSk7XG4gICAgICAgIHRoaXMudmlld05vZGUucXVlcnlTZWxlY3RvcignLmxlb25hcmRvLXN0YXRlcy1kZXRhaWwtc2F2ZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5vblNhdmVCaW5kZWQsIGZhbHNlKTtcbiAgfVxuXG4gIG9wZW4oc3RhdGUpIHtcbiAgICB0aGlzLmN1clN0YXRlID0gc3RhdGU7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgICB0aGlzLm9wZW5TdGF0ZSA9IHRydWU7XG4gICAgdGhpcy52aWV3Tm9kZS5zdHlsZS5yaWdodCA9ICcwcHgnO1xuICB9XG5cbiAgY2xvc2Uoc3RhdGU/KSB7XG4gICAgaWYoc3RhdGUgJiYgdGhpcy5jdXJTdGF0ZSAhPT0gc3RhdGUpe1xuICAgICAgdGhpcy5vcGVuKHN0YXRlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5vcGVuU3RhdGUgPSBmYWxzZTtcbiAgICB0aGlzLnZpZXdOb2RlLnN0eWxlLnJpZ2h0ID0gJy0zMDBweCc7XG4gIH1cblxuICB0b2dnbGUoc3RhdGUpIHtcbiAgICBpZih0aGlzLm9wZW5TdGF0ZSl7XG4gICAgICB0aGlzLmNsb3NlKHN0YXRlKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5vcGVuKHN0YXRlKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0UmVzU3RyaW5nKHJlc29wbnNlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGxldCByZXNTdHI6IHN0cmluZztcbiAgICB0cnkge1xuICAgICAgcmVzU3RyID0gSlNPTi5zdHJpbmdpZnkocmVzb3Buc2UsIG51bGwsIDQpO1xuICAgIH1cbiAgICBjYXRjaChlKXtcbiAgICAgIHJlc1N0ciA9IHR5cGVvZiByZXNvcG5zZSA9PT0gJ3N0cmluZycgPyByZXNvcG5zZSA6IHJlc29wbnNlLnRvU3RyaW5nKCk7XG4gICAgfVxuICAgIHJldHVybiByZXNTdHI7XG4gIH1cblxuICBwcml2YXRlIG9uQ2FuY2VsKCkge1xuICAgIHRoaXMuY2xvc2UoKTtcbiAgICB0aGlzLm9uQ2FuY2VsQ0IoKTtcbiAgfVxuXG4gIHByaXZhdGUgb25TYXZlKCkge1xuICAgIGNvbnN0IHN0YXR1c1ZhbDpzdHJpbmcgPSB0aGlzLnZpZXdOb2RlLnF1ZXJ5U2VsZWN0b3IoXCIubGVvbmFyZG8tc3RhdGVzLWRldGFpbC1zdGF0dXNcIikudmFsdWU7XG4gICAgY29uc3QgZGVsYXlWYWw6c3RyaW5nID0gdGhpcy52aWV3Tm9kZS5xdWVyeVNlbGVjdG9yKFwiLmxlb25hcmRvLXN0YXRlcy1kZXRhaWwtZGVsYXlcIikudmFsdWU7XG4gICAgY29uc3QganNvblZhbDpzdHJpbmcgPSB0aGlzLnZpZXdOb2RlLnF1ZXJ5U2VsZWN0b3IoXCIubGVvbmFyZG8tc3RhdGVzLWRldGFpbC1qc29uXCIpLnZhbHVlO1xuXG4gICAgdGhpcy5jdXJTdGF0ZS5hY3RpdmVPcHRpb24uc3RhdHVzID0gc3RhdHVzVmFsO1xuICAgIHRoaXMuY3VyU3RhdGUuYWN0aXZlT3B0aW9uLmRlbGF5ID0gZGVsYXlWYWw7XG4gICAgdHJ5e1xuICAgICAgdGhpcy5jdXJTdGF0ZS5hY3RpdmVPcHRpb24uZGF0YSA9IEpTT04ucGFyc2UoanNvblZhbCk7XG4gICAgfVxuICAgIGNhdGNoKGUpIHtcbiAgICAgIHRoaXMuY3VyU3RhdGUuYWN0aXZlT3B0aW9uLmRhdGEgPSBqc29uVmFsO1xuICAgIH1cblxuICAgIExlb25hcmRvLmFkZE9yVXBkYXRlU2F2ZWRTdGF0ZSh0aGlzLmN1clN0YXRlKTtcbiAgICB0aGlzLmNsb3NlKCk7XG4gICAgdGhpcy5vblNhdmVDQigpO1xuICB9XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vLi4vLi4vLi4vbGVvbmFyZG8uZC50c1wiIC8+XG5pbXBvcnQgVXRpbHMgZnJvbSAnLi4vLi4vLi4vLi4vdWktdXRpbHMnO1xuaW1wb3J0IEV2ZW50cyBmcm9tICcuLi8uLi8uLi8uLi91aS1ldmVudHMnO1xuaW1wb3J0IERyb3BEb3duIGZyb20gJy4uLy4uLy4uLy4uL2Ryb3AtZG93bi9kcm9wLWRvd24nO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTdGF0ZUl0ZW0ge1xuXG4gIHZpZXdOb2RlOiBIVE1MRWxlbWVudDtcbiAgcmFuZG9tSUQ6IHN0cmluZztcbiAgZHJvcERvd246IERyb3BEb3duO1xuICB0b2dnbGVCaW5kZWQ6IEV2ZW50TGlzdGVuZXIgPSB0aGlzLnRvZ2dsZVN0YXRlLmJpbmQodGhpcyk7XG4gIHJlbW92ZUJpbmRlZDogRXZlbnRMaXN0ZW5lciA9IHRoaXMucmVtb3ZlU3RhdGUuYmluZCh0aGlzKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHN0YXRlLCBwcml2YXRlIG9uUmVtb3ZlOiBGdW5jdGlvbikge1xuICAgIHRoaXMudmlld05vZGUgPSBVdGlscy5nZXRFbGVtZW50RnJvbUh0bWwoYDxkaXYgY2xhc3M9XCJsZW9uYXJkby1zdGF0ZS1pdGVtXCI+PC9kaXY+YCk7XG4gICAgdGhpcy5yYW5kb21JRCA9IFV0aWxzLmd1aWRHZW5lcmF0b3IoKTtcbiAgICB0aGlzLmRyb3BEb3duID0gbmV3IERyb3BEb3duKHRoaXMuc3RhdGUub3B0aW9ucywgdGhpcy5zdGF0ZS5hY3RpdmVPcHRpb24gfHwgdGhpcy5zdGF0ZS5vcHRpb25zWzBdLCAhdGhpcy5zdGF0ZS5hY3RpdmUsIHRoaXMuY2hhbmdlQWN0aXZlT3B0aW9uLmJpbmQodGhpcyksIHRoaXMucmVtb3ZlT3B0aW9uLmJpbmQodGhpcykpO1xuICAgIEV2ZW50cy5vbihFdmVudHMuVE9HR0xFX1NUQVRFUywgdGhpcy50b2dnbGVBbGxzdGF0ZS5iaW5kKHRoaXMpKTtcbiAgICBFdmVudHMub24oYCR7RXZlbnRzLlRPR0dMRV9TVEFURVN9OiR7dGhpcy5zdGF0ZS5uYW1lfWAsIHRoaXMuc2V0U3RhdGVTdGF0ZS5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIGdldCgpIHtcbiAgICByZXR1cm4gdGhpcy52aWV3Tm9kZTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICBpZiAodGhpcy52aWV3Tm9kZS5pbm5lckhUTUwpIHtcbiAgICAgIHRoaXMudmlld05vZGUucXVlcnlTZWxlY3RvcihgLmxlb25hcmRvLXRvZ2dsZS1idG5gKS5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMudG9nZ2xlQmluZGVkLCBmYWxzZSk7XG4gICAgICB0aGlzLnZpZXdOb2RlLnF1ZXJ5U2VsZWN0b3IoYC5sZW9uYXJkby1zdGF0ZS1yZW1vdmVgKS5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMucmVtb3ZlQmluZGVkLCBmYWxzZSk7XG4gICAgfVxuICAgIHRoaXMudmlld05vZGUuaW5uZXJIVE1MID0gYFxuICAgICAgICA8aW5wdXQgJHt0aGlzLmlzQ2hlY2tlZCgpfSBpZD1cImxlb25hcmRvLXN0YXRlLXRvZ2dsZS0ke3RoaXMucmFuZG9tSUR9XCIgY2xhc3M9XCJsZW9uYXJkby10b2dnbGUgbGVvbmFyZG8tdG9nZ2xlLWlvc1wiIHR5cGU9XCJjaGVja2JveFwiLz5cbiAgICAgICAgPGxhYmVsIGNsYXNzPVwibGVvbmFyZG8tdG9nZ2xlLWJ0blwiIGZvcj1cImxlb25hcmRvLXN0YXRlLXRvZ2dsZS0ke3RoaXMucmFuZG9tSUQgfVwiPjwvbGFiZWw+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwibGVvbmFyZG8tc3RhdGUtdmVyYiBsZW9uYXJkby1zdGF0ZS12ZXJiLSR7dGhpcy5zdGF0ZS52ZXJiLnRvTG93ZXJDYXNlKCl9XCI+JHt0aGlzLnN0YXRlLnZlcmJ9PC9zcGFuPlxuICAgICAgICA8c3BhbiBjbGFzcz1cImxlb25hcmRvLXN0YXRlLW5hbWVcIj4ke3RoaXMuc3RhdGUubmFtZX08L3NwYW4+XG4gICAgICAgIDxzcGFuIGNsYXNzPVwibGVvbmFyZG8tc3RhdGUtdXJsXCI+JHt0aGlzLnN0YXRlLnVybCB8fCAnJ308L3NwYW4+YDtcbiAgICB0aGlzLnZpZXdOb2RlLmFwcGVuZENoaWxkKHRoaXMuZHJvcERvd24uZ2V0KCkpO1xuICAgIHRoaXMuZHJvcERvd24ucmVuZGVyKCk7XG4gICAgdGhpcy52aWV3Tm9kZS5hcHBlbmRDaGlsZChVdGlscy5nZXRFbGVtZW50RnJvbUh0bWwoYDxidXR0b24gdGl0bGU9XCJSZW1vdmUgU3RhdGVcIiBjbGFzcz1cImxlb25hcmRvLXN0YXRlLXJlbW92ZVwiPlJlbW92ZTwvYnV0dG9uPmApKTtcbiAgICB0aGlzLnZpZXdOb2RlLnF1ZXJ5U2VsZWN0b3IoYC5sZW9uYXJkby10b2dnbGUtYnRuYCkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLnRvZ2dsZUJpbmRlZCwgZmFsc2UpO1xuICAgIHRoaXMudmlld05vZGUucXVlcnlTZWxlY3RvcihgLmxlb25hcmRvLXN0YXRlLXJlbW92ZWApLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5yZW1vdmVCaW5kZWQsIGZhbHNlKTtcbiAgfVxuXG4gIGdldE5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdGUubmFtZTtcbiAgfVxuXG4gIGdldFN0YXRlKCkge1xuICAgIHJldHVybiB0aGlzLnN0YXRlO1xuICB9XG5cbiAgdG9nZ2xlVmlzaWJsZShzaG93OiBib29sZWFuKSB7XG4gICAgaWYgKHNob3cpIHtcbiAgICAgIHRoaXMudmlld05vZGUuY2xhc3NMaXN0LnJlbW92ZSgnbGVvbmFyZG8tc3RhdGUtaXRlbS1oaWRkZW4nKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy52aWV3Tm9kZS5jbGFzc0xpc3QuYWRkKCdsZW9uYXJkby1zdGF0ZS1pdGVtLWhpZGRlbicpO1xuICAgIH1cbiAgfVxuXG4gIHNldFN0YXRlKHN0YXRlOiBCb29sZWFuLCBzZXRWaWV3OiBib29sZWFuID0gdHJ1ZSkge1xuICAgIHRoaXMuc3RhdGUuYWN0aXZlID0gc3RhdGU7XG4gICAgaWYgKHN0YXRlKSB7XG4gICAgICBMZW9uYXJkby5hY3RpdmF0ZVN0YXRlT3B0aW9uKHRoaXMuc3RhdGUubmFtZSwgdGhpcy5zdGF0ZS5hY3RpdmVPcHRpb24ubmFtZSk7XG4gICAgICB0aGlzLmRyb3BEb3duLmVuYWJsZURyb3BEb3duKCk7XG4gICAgICBpZiAoc2V0Vmlldykge1xuICAgICAgICB0aGlzLnZpZXdOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5sZW9uYXJkby10b2dnbGUnKVsnY2hlY2tlZCddID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBMZW9uYXJkby5kZWFjdGl2YXRlU3RhdGUodGhpcy5zdGF0ZS5uYW1lKTtcbiAgICAgIHRoaXMuZHJvcERvd24uZGlzYWJsZURyb3BEb3duKCk7XG4gICAgICBpZiAoc2V0Vmlldykge1xuICAgICAgICB0aGlzLnZpZXdOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5sZW9uYXJkby10b2dnbGUnKVsnY2hlY2tlZCddID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBpc0NoZWNrZWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5zdGF0ZS5hY3RpdmUgPyAnY2hlY2tlZCcgOiAnJztcbiAgfVxuXG4gIHByaXZhdGUgdG9nZ2xlU3RhdGUoZXZlbnQ6IEV2ZW50KSB7XG4gICAgdGhpcy5zZXRTdGF0ZSghdGhpcy5zdGF0ZS5hY3RpdmUsIGZhbHNlKTtcbiAgfVxuXG4gIHByaXZhdGUgdG9nZ2xlQWxsc3RhdGUoZXZlbnQ6IEN1c3RvbUV2ZW50KSB7XG4gICAgdGhpcy5zZXRTdGF0ZShldmVudC5kZXRhaWwpO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXRTdGF0ZVN0YXRlKGV2ZW50OiBDdXN0b21FdmVudCkge1xuICAgIHRoaXMuc2V0U3RhdGUodHJ1ZSk7XG4gICAgdGhpcy5zdGF0ZS5vcHRpb25zLnNvbWUoKG9wdGlvbikgPT4ge1xuICAgICAgaWYgKG9wdGlvbi5uYW1lID09PSBldmVudC5kZXRhaWwpIHtcbiAgICAgICAgdGhpcy5kcm9wRG93bi5zZXRBY3RpdmVJdGVtKGV2ZW50LmRldGFpbCk7XG4gICAgICAgIHRoaXMuY2hhbmdlQWN0aXZlT3B0aW9uKG9wdGlvbik7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICBwcml2YXRlIGNoYW5nZUFjdGl2ZU9wdGlvbihvcHRpb24pIHtcbiAgICB0aGlzLnN0YXRlLmFjdGl2ZU9wdGlvbiA9IG9wdGlvbjtcbiAgICBMZW9uYXJkby5hY3RpdmF0ZVN0YXRlT3B0aW9uKHRoaXMuc3RhdGUubmFtZSwgdGhpcy5zdGF0ZS5hY3RpdmVPcHRpb24ubmFtZSlcbiAgfVxuXG4gIHByaXZhdGUgcmVtb3ZlU3RhdGUoZXZlbnQ6IEV2ZW50KSB7XG4gICAgaWYgKGV2ZW50KSB7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9XG4gICAgdGhpcy5vbkRlc3Ryb3koKTtcbiAgICB0aGlzLm9uUmVtb3ZlKHRoaXMuc3RhdGUubmFtZSwgdGhpcy52aWV3Tm9kZSk7XG4gICAgTGVvbmFyZG8ucmVtb3ZlU3RhdGUodGhpcy5zdGF0ZSk7XG4gIH1cblxuICBwcml2YXRlIHJlbW92ZU9wdGlvbihpdGVtKSB7XG4gICAgTGVvbmFyZG8ucmVtb3ZlT3B0aW9uKHRoaXMuc3RhdGUsIGl0ZW0pO1xuICB9XG5cbiAgb25EZXN0cm95KCkge1xuICAgIHRoaXMudmlld05vZGUucXVlcnlTZWxlY3RvcihgLmxlb25hcmRvLXRvZ2dsZS1idG5gKS5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMudG9nZ2xlQmluZGVkLCBmYWxzZSk7XG4gICAgdGhpcy52aWV3Tm9kZS5xdWVyeVNlbGVjdG9yKGAubGVvbmFyZG8tc3RhdGUtcmVtb3ZlYCkucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLnJlbW92ZUJpbmRlZCwgZmFsc2UpO1xuICB9XG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi8uLi8uLi8uLi8uLi9sZW9uYXJkby5kLnRzXCIgLz5cbmltcG9ydCBVdGlscyBmcm9tICcuLi8uLi8uLi8uLi8uLi91aS11dGlscyc7XG5pbXBvcnQgRXZlbnRzIGZyb20gJy4uLy4uLy4uLy4uLy4uL3VpLWV2ZW50cyc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzICB7XG4gIHZpZXdOb2RlOiBhbnk7XG4gIG9wZW5TdGF0ZTogYm9vbGVhbiA9IGZhbHNlO1xuICBvbkNhbmNlbEJpbmRlZDogRXZlbnRMaXN0ZW5lciA9IHRoaXMub25DYW5jZWwuYmluZCh0aGlzKTtcbiAgb25TYXZlQmluZGVkOiBFdmVudExpc3RlbmVyID0gdGhpcy5vblNhdmUuYmluZCh0aGlzKTtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnZpZXdOb2RlID0gVXRpbHMuZ2V0RWxlbWVudEZyb21IdG1sKGA8ZGl2IGlkPVwibGVvbmFyZG8tYWRkLXNjZW5hcmlvXCIgY2xhc3M9XCJsZW9uYXJkby1hZGQtc2NlbmFyaW9cIj48L2Rpdj5gKTtcbiAgfVxuXG4gIGdldCgpIHtcbiAgICByZXR1cm4gdGhpcy52aWV3Tm9kZTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICBpZih0aGlzLnZpZXdOb2RlLmlubmVySFRNTCl7XG4gICAgICB0aGlzLnZpZXdOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5sZW9uYXJkby1hZGQtc2NlbmFyaW8tY2FuY2VsJykucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm9uQ2FuY2VsQmluZGVkLCBmYWxzZSk7XG4gICAgICB0aGlzLnZpZXdOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5sZW9uYXJkby1hZGQtc2NlbmFyaW8tc2F2ZScpLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5vblNhdmVCaW5kZWQsIGZhbHNlKTtcbiAgICB9XG4gICAgdGhpcy52aWV3Tm9kZS5pbm5lckhUTUwgPSBgXG4gICAgICAgIDxkaXYgY2xhc3M9XCJsZW9uYXJkby1hZGQtc2NlbmFyaW8tYm94XCI+XG4gICAgICAgICAgPHNwYW4+U2NlbmFyaW8gTmFtZTogPC9zcGFuPlxuICAgICAgICAgIDxpbnB1dCBjbGFzcz1cImxlb25hcmRvLWFkZC1zY2VuYXJpby1uYW1lXCIvPlxuICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJsZW9uYXJkby1idXR0b24gbGVvbmFyZG8tYWRkLXNjZW5hcmlvLXNhdmVcIj5TYXZlPC9idXR0b24+XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzcz1cImxlb25hcmRvLWJ1dHRvbiBsZW9uYXJkby1hZGQtc2NlbmFyaW8tY2FuY2VsXCI+Q2FuY2VsPC9idXR0b24+XG4gICAgICAgIDwvZGl2PmA7XG4gICAgdGhpcy52aWV3Tm9kZS5xdWVyeVNlbGVjdG9yKCcubGVvbmFyZG8tYWRkLXNjZW5hcmlvLWNhbmNlbCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5vbkNhbmNlbEJpbmRlZCwgZmFsc2UpO1xuICAgIHRoaXMudmlld05vZGUucXVlcnlTZWxlY3RvcignLmxlb25hcmRvLWFkZC1zY2VuYXJpby1zYXZlJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm9uU2F2ZUJpbmRlZCwgZmFsc2UpO1xuICB9XG5cbiAgb3BlbigpIHtcbiAgICB0aGlzLnJlbmRlcigpO1xuICAgIHRoaXMub3BlblN0YXRlID0gdHJ1ZTtcbiAgICB0aGlzLnZpZXdOb2RlLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICB9XG5cbiAgY2xvc2UoKSB7XG4gICAgdGhpcy5vcGVuU3RhdGUgPSBmYWxzZTtcbiAgICB0aGlzLnZpZXdOb2RlLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gIH1cblxuICB0b2dnbGUoKSB7XG4gICAgaWYodGhpcy5vcGVuU3RhdGUpe1xuICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLm9wZW4oKTtcbiAgfVxuXG4gIHByaXZhdGUgb25DYW5jZWwoKSB7XG4gICAgdGhpcy5jbG9zZSgpO1xuXG4gIH1cblxuICBwcml2YXRlIG9uU2F2ZSgpIHtcbiAgICB0aGlzLmNsb3NlKCk7XG4gICAgRXZlbnRzLmRpc3BhdGNoKEV2ZW50cy5BRERfU0NFTkFSSU8sIHRoaXMudmlld05vZGUucXVlcnlTZWxlY3RvcignLmxlb25hcmRvLWFkZC1zY2VuYXJpby1uYW1lJykudmFsdWUpO1xuICB9XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vLi4vLi4vLi4vbGVvbmFyZG8uZC50c1wiIC8+XG5pbXBvcnQgVXRpbHMgZnJvbSAnLi4vLi4vLi4vLi4vdWktdXRpbHMnO1xuaW1wb3J0IEV2ZW50cyBmcm9tICcuLi8uLi8uLi8uLi91aS1ldmVudHMnO1xuaW1wb3J0IEFkZFNjZW5hcmlvIGZyb20gJy4vc3RhdGUtYWRkLXNjZW5hcmlvL3N0YXRlLWFkZC1zY2VuYXJpbyc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFN0YXRlc0JhciB7XG4gIHZpZXdOb2RlOiBhbnk7XG4gIHNlYXJjaEJpbmRlZDogRXZlbnRMaXN0ZW5lciA9IHRoaXMuc2VhcmNoU3RhdGVzLmJpbmQodGhpcyk7XG4gIGFjdGl2YXRlQWxsQmluZGVkOiBFdmVudExpc3RlbmVyID0gdGhpcy50b2dnbGVBY3RpdmF0ZUFsbC5iaW5kKHRoaXMpO1xuICBhZGRTY2VuYXJpb0JpbmRlZDogRXZlbnRMaXN0ZW5lciA9IHRoaXMub25BZGRTY2VuYXJpby5iaW5kKHRoaXMpO1xuICBhY3RpdmVBbGxTdGF0ZTogYm9vbGVhbiA9IGZhbHNlO1xuICBhZGRTY2VuYXJpbzogQWRkU2NlbmFyaW8gPSBuZXcgQWRkU2NlbmFyaW8oKTtcbiAgY3VyU2VhcmNoRGF0YTogc3RyaW5nID0gJyc7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMudmlld05vZGUgPSBVdGlscy5nZXRFbGVtZW50RnJvbUh0bWwoYDxkaXYgY2xhc3M9XCJsZW9uYXJkby1zdGF0ZXMtYmFyXCI+PC9kaXY+YCk7XG4gIH1cblxuICBnZXQoKSB7XG4gICAgcmV0dXJuIHRoaXMudmlld05vZGU7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgaWYodGhpcy52aWV3Tm9kZS5pbm5lckhUTUwpe1xuICAgICAgdGhpcy52aWV3Tm9kZS5xdWVyeVNlbGVjdG9yKCcubGVvbmFyZG8tc2VhcmNoLXN0YXRlJykucmVtb3ZlRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLnNlYXJjaEJpbmRlZCwgZmFsc2UpO1xuICAgICAgdGhpcy52aWV3Tm9kZS5xdWVyeVNlbGVjdG9yKCcubGVvbmFyZG8tYWN0aXZhdGUtYWxsJykucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmFjdGl2YXRlQWxsQmluZGVkLCBmYWxzZSk7XG4gICAgICB0aGlzLnZpZXdOb2RlLnF1ZXJ5U2VsZWN0b3IoJy5sZW9uYXJkby1hZGQtc2NlbmFyaW8tYnRuJykucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLmFkZFNjZW5hcmlvQmluZGVkLCBmYWxzZSk7XG4gICAgfVxuICAgIHRoaXMudmlld05vZGUuaW5uZXJIVE1MID0gYFxuICAgICAgICA8aW5wdXQgdmFsdWU9XCIke3RoaXMuY3VyU2VhcmNoRGF0YX1cIiBjbGFzcz1cImxlb25hcmRvLXNlYXJjaC1zdGF0ZVwiIG5hbWU9XCJsZW9uYXJkby1zZWFyY2gtc3RhdGVcIiB0eXBlPVwidGV4dFwiIHBsYWNlaG9sZGVyPVwiU2VhcmNoLi4uXCIgLz5cbiAgICAgICAgPGRpdj5cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cImxlb25hcmRvLWJ1dHRvbiBsZW9uYXJkby1hY3RpdmF0ZS1hbGxcIj5BY3RpdmF0ZSBBbGw8L3NwYW4+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJsZW9uYXJkby1idXR0b24gbGVvbmFyZG8tYWRkLXNjZW5hcmlvLWJ0blwiPkFkZCBTY2VuYXJpbzwvc3Bhbj5cbiAgICAgICAgPC9kaXY+YDtcbiAgICB0aGlzLnZpZXdOb2RlLmFwcGVuZENoaWxkKHRoaXMuYWRkU2NlbmFyaW8uZ2V0KCkpO1xuICAgIHRoaXMuYWRkU2NlbmFyaW8ucmVuZGVyKCk7XG4gICAgdGhpcy52aWV3Tm9kZS5xdWVyeVNlbGVjdG9yKCcubGVvbmFyZG8tc2VhcmNoLXN0YXRlJykuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCB0aGlzLnNlYXJjaEJpbmRlZCwgZmFsc2UpO1xuICAgIHRoaXMudmlld05vZGUucXVlcnlTZWxlY3RvcignLmxlb25hcmRvLWFjdGl2YXRlLWFsbCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5hY3RpdmF0ZUFsbEJpbmRlZCwgZmFsc2UpO1xuICAgIHRoaXMudmlld05vZGUucXVlcnlTZWxlY3RvcignLmxlb25hcmRvLWFkZC1zY2VuYXJpby1idG4nKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuYWRkU2NlbmFyaW9CaW5kZWQsIGZhbHNlKTtcbiAgICB0aGlzLnNlYXJjaFN0YXRlcyh7dGFyZ2V0OiB7dmFsdWU6IHRoaXMuY3VyU2VhcmNoRGF0YX19KTtcbiAgfVxuXG4gIHNlYXJjaFN0YXRlcyhldnQpIHtcbiAgICB0aGlzLmN1clNlYXJjaERhdGEgPSBldnQudGFyZ2V0LnZhbHVlO1xuICAgIEV2ZW50cy5kaXNwYXRjaChFdmVudHMuRklMVEVSX1NUQVRFUywgeyB2YWw6IHRoaXMuY3VyU2VhcmNoRGF0YX0pO1xuICB9XG5cbiAgdG9nZ2xlQWN0aXZhdGVBbGwoKSB7XG4gICAgdGhpcy5hY3RpdmVBbGxTdGF0ZSA9ICF0aGlzLmFjdGl2ZUFsbFN0YXRlO1xuICAgIExlb25hcmRvLnRvZ2dsZUFjdGl2YXRlQWxsKHRoaXMuYWN0aXZlQWxsU3RhdGUpO1xuICAgIEV2ZW50cy5kaXNwYXRjaChFdmVudHMuVE9HR0xFX1NUQVRFUywgdGhpcy5hY3RpdmVBbGxTdGF0ZSk7XG4gICAgdGhpcy52aWV3Tm9kZS5xdWVyeVNlbGVjdG9yKCcubGVvbmFyZG8tYWN0aXZhdGUtYWxsJykuaW5uZXJIVE1MID0gdGhpcy5hY3RpdmVBbGxTdGF0ZSA/ICdEZWFjdGl2YXRlIGFsbCcgOiAnQWN0aXZhdGUgYWxsJztcbiAgfVxuXG4gIG9uQWRkU2NlbmFyaW8oKXtcbiAgICB0aGlzLmFkZFNjZW5hcmlvLm9wZW4oKTtcbiAgfVxuXG4gIG9uRGVzdHJveSgpe1xuICAgIHRoaXMudmlld05vZGUucXVlcnlTZWxlY3RvcignLmxlb25hcmRvLXNlYXJjaC1zdGF0ZScpLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2tleXVwJywgdGhpcy5zZWFyY2hCaW5kZWQsIGZhbHNlKTtcbiAgfVxuXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vLi4vLi4vbGVvbmFyZG8uZC50c1wiIC8+XG5pbXBvcnQgVXRpbHMgZnJvbSAnLi4vLi4vLi4vdWktdXRpbHMnO1xuaW1wb3J0IEV2ZW50cyBmcm9tICcuLi8uLi8uLi91aS1ldmVudHMnO1xuaW1wb3J0IFN0YXRlSXRlbSBmcm9tICcuL3N0YXRlLWl0ZW0vc3RhdGUtaXRlbSc7XG5pbXBvcnQgU3RhdGVzQmFyIGZyb20gJy4vc3RhdGVzLWJhci9zdGF0ZXMtYmFyJztcbmltcG9ydCBTdGF0ZURldGFpbCBmcm9tICcuL3N0YXRlLWRldGFpbC9zdGF0ZXMtZGV0YWlsJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU3RhdGVzTGlzdCB7XG4gIHZpZXdOb2RlOiBhbnk7XG4gIHN0YXRlc0JhciA9IG5ldyBTdGF0ZXNCYXIoKTtcbiAgc3RhdGVEZXRhaWwgPSBuZXcgU3RhdGVEZXRhaWwodGhpcy5vblN0YXRlRGV0YWlsU2F2ZS5iaW5kKHRoaXMpLCB0aGlzLmNsZWFyU2VsZWN0ZWQuYmluZCh0aGlzKSk7XG4gIHN0YXRlc0VsZW1lbnRzOiBTdGF0ZUl0ZW1bXSA9IFtdO1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMudmlld05vZGUgPSBVdGlscy5nZXRFbGVtZW50RnJvbUh0bWwoYDxkaXYgaWQ9XCJsZW9uYXJkby1zdGF0ZXMtbGlzdFwiIGNsYXNzPVwibGVvbmFyZG8tc3RhdGVzLWxpc3RcIj48L2Rpdj5gKTtcbiAgICBFdmVudHMub24oRXZlbnRzLkZJTFRFUl9TVEFURVMsIHRoaXMub25GaWx0ZXJTdGF0ZXMuYmluZCh0aGlzKSk7XG4gICAgRXZlbnRzLm9uKEV2ZW50cy5BRERfU0NFTkFSSU8sIHRoaXMuYWRkU2NlbmFyaW8uYmluZCh0aGlzKSk7ICAgIFxuICB9XG5cbiAgZ2V0KCkge1xuICAgIHJldHVybiB0aGlzLnZpZXdOb2RlO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIHRoaXMudmlld05vZGUuaW5uZXJIVE1MID0gJyc7XG4gICAgdGhpcy52aWV3Tm9kZS5hcHBlbmRDaGlsZCh0aGlzLnN0YXRlc0Jhci5nZXQoKSk7XG4gICAgdGhpcy52aWV3Tm9kZS5hcHBlbmRDaGlsZCh0aGlzLnN0YXRlRGV0YWlsLmdldCgpKTtcbiAgICB0aGlzLnN0YXRlc0VsZW1lbnRzLmxlbmd0aCA9IDA7XG4gICAgTGVvbmFyZG8uZ2V0U3RhdGVzKClcbiAgICAgIC5tYXAoKHN0YXRlKSA9PiBuZXcgU3RhdGVJdGVtKHN0YXRlLCB0aGlzLnJlbW92ZVN0YXRlQnlOYW1lLmJpbmQodGhpcykpKVxuICAgICAgLmZvckVhY2goKHN0YXRlRWxtKSA9PiB7XG4gICAgICAgIHRoaXMuc3RhdGVzRWxlbWVudHMucHVzaChzdGF0ZUVsbSk7XG4gICAgICAgIHRoaXMudmlld05vZGUuYXBwZW5kQ2hpbGQoc3RhdGVFbG0uZ2V0KCkpO1xuICAgICAgICBzdGF0ZUVsbS52aWV3Tm9kZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMudG9nZ2xlRGV0YWlsLmJpbmQodGhpcywgc3RhdGVFbG0pKTtcbiAgICAgICAgc3RhdGVFbG0ucmVuZGVyKCk7XG4gICAgICB9KTtcbiAgICB0aGlzLnN0YXRlc0Jhci5yZW5kZXIoKTtcbiAgfVxuXG4gIG9uRmlsdGVyU3RhdGVzKGRhdGE6IEN1c3RvbUV2ZW50KSB7XG4gICAgdGhpcy5zdGF0ZXNFbGVtZW50cy5mb3JFYWNoKChzdGF0ZUVsbTogU3RhdGVJdGVtKSA9PiB7XG4gICAgICBpZiAoc3RhdGVFbG0uZ2V0TmFtZSgpLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihkYXRhLmRldGFpbC52YWwudG9Mb3dlckNhc2UoKSkgPj0gMCkge1xuICAgICAgICBzdGF0ZUVsbS50b2dnbGVWaXNpYmxlKHRydWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdGVFbG0udG9nZ2xlVmlzaWJsZShmYWxzZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICByZW1vdmVTdGF0ZUJ5TmFtZShzdGF0ZU5hbWU6IHN0cmluZywgc3RhdGVWaWV3OiBIVE1MRWxlbWVudCkge1xuICAgIHRoaXMuc3RhdGVzRWxlbWVudHMgPSB0aGlzLnN0YXRlc0VsZW1lbnRzLmZpbHRlcigoc3RhdGUpID0+IHtcbiAgICAgIHJldHVybiBzdGF0ZS5nZXROYW1lKCkgPT09IHN0YXRlTmFtZTtcbiAgICB9KTtcbiAgICB0aGlzLnZpZXdOb2RlLnJlbW92ZUNoaWxkKHN0YXRlVmlldyk7XG4gIH1cblxuICBwcml2YXRlIHRvZ2dsZURldGFpbChzdGF0ZUVsbTogU3RhdGVJdGVtLCBldmVudDogRXZlbnQpIHtcbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBjb25zdCBvcGVuOiBib29sZWFuID0gc3RhdGVFbG0udmlld05vZGUuY2xhc3NMaXN0LmNvbnRhaW5zKCdsZW9uYXJkby1zdGF0ZS1pdGVtLWRldGFpbGVkJyk7XG4gICAgdGhpcy5jbGVhclNlbGVjdGVkKCk7XG4gICAgaWYoIW9wZW4pe1xuICAgICAgc3RhdGVFbG0udmlld05vZGUuY2xhc3NMaXN0LmFkZCgnbGVvbmFyZG8tc3RhdGUtaXRlbS1kZXRhaWxlZCcpO1xuICAgIH1cblxuICAgIHRoaXMuc3RhdGVEZXRhaWwudG9nZ2xlKHN0YXRlRWxtLmdldFN0YXRlKCkpO1xuICB9XG5cbiAgcHJpdmF0ZSBjbGVhclNlbGVjdGVkKCl7XG4gICAgdGhpcy5zdGF0ZXNFbGVtZW50cy5mb3JFYWNoKChjdXJTdGF0ZSkgPT4ge1xuICAgICAgY3VyU3RhdGUudmlld05vZGUuY2xhc3NMaXN0LnJlbW92ZSgnbGVvbmFyZG8tc3RhdGUtaXRlbS1kZXRhaWxlZCcpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBvblN0YXRlRGV0YWlsU2F2ZSgpe1xuICAgIHRoaXMuY2xlYXJTZWxlY3RlZCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBhZGRTY2VuYXJpbyhldmVudDogQ3VzdG9tRXZlbnQpIHtcbiAgICBjb25zdCBzdGF0ZXM6IEFycmF5PGFueT4gPSB0aGlzLnN0YXRlc0VsZW1lbnRzLm1hcCgoc3RhdGVFbGVtOiBTdGF0ZUl0ZW0pID0+IHtcbiAgICAgIHJldHVybiBzdGF0ZUVsZW0uZ2V0U3RhdGUoKTtcbiAgICB9KS5maWx0ZXIoKHN0YXRlKSA9PiBzdGF0ZS5hY3RpdmUpXG4gICAgICAubWFwKChzdGF0ZTogYW55KSA9PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbmFtZTogc3RhdGUubmFtZSxcbiAgICAgICAgICBvcHRpb246IHN0YXRlLmFjdGl2ZU9wdGlvbi5uYW1lXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIExlb25hcmRvLmFkZFNjZW5hcmlvKHtcbiAgICAgIG5hbWU6IGV2ZW50LmRldGFpbCxcbiAgICAgIHN0YXRlczogc3RhdGVzLFxuICAgICAgZnJvbV9sb2NhbDogdHJ1ZVxuICAgIH0sIHRydWUpO1xuICB9XG5cbn1cbiIsImV4cG9ydCBkZWZhdWx0IGNsYXNzIFV0aWxzIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gIH1cblxuICBzdGF0aWMgaXNVbmRlZmluZWQodmFsdWUpIHtyZXR1cm4gdHlwZW9mIHZhbHVlID09PSAndW5kZWZpbmVkJzt9XG5cbiAgc3RhdGljIGlzTnVtYmVyKHZhbHVlKSB7cmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcic7fVxuXG4gIHN0YXRpYyBpc0Z1bmN0aW9uKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJztcbiAgfVxuXG4gIHN0YXRpYyBpc1N0cmluZyh2YWx1ZSkge3JldHVybiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnO31cblxuICBzdGF0aWMgZnJvbUpzb24oanNvbikge1xuICAgIHJldHVybiB0aGlzLmlzU3RyaW5nKGpzb24pXG4gICAgICA/IEpTT04ucGFyc2UoanNvbilcbiAgICAgIDoganNvbjtcbiAgfVxuXG4gIHN0YXRpYyB0b0pzb24ob2JqLCBwcmV0dHk/KSB7XG4gICAgaWYgKHRoaXMuaXNVbmRlZmluZWQob2JqKSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBpZiAoIXRoaXMuaXNOdW1iZXIocHJldHR5KSkge1xuICAgICAgcHJldHR5ID0gcHJldHR5ID8gMiA6IG51bGw7XG4gICAgfVxuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShvYmosIG51bGwsIHByZXR0eSk7XG4gIH1cbn1cbiJdfQ==

;

(function (doc, cssText) {
    var styleEl = doc.createElement("style");
    doc.getElementsByTagName("head")[0].appendChild(styleEl);
    if (styleEl.styleSheet) {
        if (!styleEl.styleSheet.disabled) {
            styleEl.styleSheet.cssText = cssText;
        }
    } else {
        try {
            styleEl.innerHTML = cssText;
        } catch (ignore) {
            styleEl.innerText = cssText;
        }
    }
}(document, ".leonardo-launcher {\n" +
"  position: fixed;\n" +
"  right: 40px;\n" +
"  bottom: 40px;\n" +
"  width: 70px;\n" +
"  cursor: pointer;\n" +
"  height: 70px;\n" +
"  z-index: 9999999;\n" +
"  background-size: contain;\n" +
"  background-repeat: no-repeat;\n" +
"  background-image: url('data:image/png;base64,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');\n" +
"}\n" +
".leonardo-main-view {\n" +
"  position: fixed;\n" +
"  display: flex;\n" +
"  top: 0;\n" +
"  right: 0;\n" +
"  left: 0;\n" +
"  height: 100%;\n" +
"  overflow: hidden;\n" +
"  background-color: white;\n" +
"  z-index: 999999;\n" +
"}\n" +
".leonardo-main-view-hidden {\n" +
"  display: none;\n" +
"}\n" +
".leonardo-main-view-body {\n" +
"  flex: 1;\n" +
"}\n" +
".leonardo-header-container {\n" +
"  width: 100%;\n" +
"  z-index: 1;\n" +
"  border-bottom: 1px solid #ccc;\n" +
"  display: inline-block;\n" +
"  min-height: 44px;\n" +
"}\n" +
".leonardo-header-container .leonardo-header-label {\n" +
"  display: inline-block;\n" +
"  font-size: 20px;\n" +
"  text-align: left;\n" +
"  padding: 3px 25px 0 15px;\n" +
"  line-height: 44px;\n" +
"  float: left;\n" +
"  text-transform: uppercase;\n" +
"  width: 170px;\n" +
"  font-weight: bold;\n" +
"  cursor: pointer;\n" +
"  color: #666666;\n" +
"}\n" +
".leonardo-header-container .leonardo-header-tabs {\n" +
"  display: inline-block;\n" +
"  font-size: 1.5em;\n" +
"  color: #666666;\n" +
"  text-align: left;\n" +
"  font-weight: bold;\n" +
"  height: 26px;\n" +
"}\n" +
".leonardo-header-container .leonardo-header-tabs > ul {\n" +
"  margin: 0 20px;\n" +
"  padding: 0;\n" +
"}\n" +
".leonardo-header-container .leonardo-header-tabs > ul .leonardo-header-tabItem {\n" +
"  display: inline-block;\n" +
"  line-height: 44px;\n" +
"  margin-right: 20px;\n" +
"  float: left;\n" +
"  text-align: center;\n" +
"  text-transform: uppercase;\n" +
"  font-size: 12px;\n" +
"  width: 170px;\n" +
"  cursor: pointer;\n" +
"}\n" +
".leonardo-header-container .leonardo-header-tabs > ul .leonardo-header-tabItem-selected {\n" +
"  border-top: 3px solid #f08222;\n" +
"}\n" +
".leonardo-dropdown {\n" +
"  position: relative;\n" +
"  font-size: 13px;\n" +
"}\n" +
".leonardo-dropdown .leonardo-dropdown-selected {\n" +
"  padding: 0 10px;\n" +
"  height: 26px;\n" +
"  line-height: 26px;\n" +
"  white-space: nowrap;\n" +
"  overflow: hidden;\n" +
"  text-overflow: ellipsis;\n" +
"  background: #219161;\n" +
"  color: #fff;\n" +
"  border: 0;\n" +
"  margin-left: 0;\n" +
"  position: relative;\n" +
"  width: 200px;\n" +
"  cursor: pointer;\n" +
"}\n" +
".leonardo-dropdown .leonardo-dropdown-selected[disabled] {\n" +
"  background: rgba(33, 145, 97, 0.5);\n" +
"  cursor: default;\n" +
"}\n" +
".leonardo-dropdown .leonardo-dropdown-selected:hover {\n" +
"  color: lightblue;\n" +
"}\n" +
".leonardo-dropdown .leonardo-dropdown-selected:hover .leonardo-dropdown-selected-arrow {\n" +
"  border-top: 7px solid lightblue;\n" +
"}\n" +
".leonardo-dropdown .leonardo-dropdown-selected .leonardo-dropdown-selected-arrow {\n" +
"  position: absolute;\n" +
"  right: 5px;\n" +
"  top: 50%;\n" +
"  transform: translateY(-50%);\n" +
"  border-left: 7px solid transparent;\n" +
"  border-right: 7px solid transparent;\n" +
"  border-top: 7px solid aliceblue;\n" +
"}\n" +
".leonardo-dropdown .leonardo-dropdown-options {\n" +
"  position: absolute;\n" +
"  display: none;\n" +
"  z-index: 10;\n" +
"  margin-left: 0;\n" +
"  left: 0;\n" +
"  border: 1px solid black;\n" +
"  width: 200px;\n" +
"  max-height: 300px;\n" +
"  overflow-y: auto;\n" +
"  padding: 0;\n" +
"  background: white;\n" +
"}\n" +
".leonardo-dropdown .leonardo-dropdown-options .leonardo-dropdown-list {\n" +
"  list-style: none;\n" +
"  margin: 0;\n" +
"  padding: 0;\n" +
"}\n" +
".leonardo-dropdown .leonardo-dropdown-options .leonardo-dropdown-list .leonardo-dropdown-item {\n" +
"  padding: 10px 5px;\n" +
"}\n" +
".leonardo-dropdown .leonardo-dropdown-options .leonardo-dropdown-list .leonardo-dropdown-item:hover {\n" +
"  background: lightblue;\n" +
"  cursor: pointer;\n" +
"}\n" +
".leonardo-dropdown .leonardo-dropdown-options .leonardo-dropdown-list .leonardo-dropdown-item .leonardo-dropdown-item-text {\n" +
"  display: inline-block;\n" +
"  width: 100%;\n" +
"  height: 100%;\n" +
"}\n" +
".leonardo-dropdown .leonardo-dropdown-options .leonardo-dropdown-list .leonardo-dropdown-item .leonardo-dropdown-item-x {\n" +
"  position: absolute;\n" +
"  right: 5px;\n" +
"  display: inline-block;\n" +
"  width: 12px;\n" +
"  height: 12px;\n" +
"  overflow: hidden;\n" +
"}\n" +
".leonardo-dropdown .leonardo-dropdown-options .leonardo-dropdown-list .leonardo-dropdown-item .leonardo-dropdown-item-x:hover::before,\n" +
".leonardo-dropdown .leonardo-dropdown-options .leonardo-dropdown-list .leonardo-dropdown-item .leonardo-dropdown-item-x:hover::after {\n" +
"  background: darkgray;\n" +
"}\n" +
".leonardo-dropdown .leonardo-dropdown-options .leonardo-dropdown-list .leonardo-dropdown-item .leonardo-dropdown-item-x::before,\n" +
".leonardo-dropdown .leonardo-dropdown-options .leonardo-dropdown-list .leonardo-dropdown-item .leonardo-dropdown-item-x::after {\n" +
"  content: '';\n" +
"  position: absolute;\n" +
"  height: 1px;\n" +
"  width: 100%;\n" +
"  top: 50%;\n" +
"  left: 0;\n" +
"  background: #000;\n" +
"  border-radius: 5px;\n" +
"}\n" +
".leonardo-dropdown .leonardo-dropdown-options .leonardo-dropdown-list .leonardo-dropdown-item .leonardo-dropdown-item-x::before {\n" +
"  transform: rotate(45deg);\n" +
"}\n" +
".leonardo-dropdown .leonardo-dropdown-options .leonardo-dropdown-list .leonardo-dropdown-item .leonardo-dropdown-item-x::after {\n" +
"  transform: rotate(-45deg);\n" +
"}\n" +
".leonardo-views-container {\n" +
"  width: 100%;\n" +
"  height: 100%;\n" +
"}\n" +
".leonardo-scenarios {\n" +
"  display: flex;\n" +
"  overflow: scroll;\n" +
"  height: 100%;\n" +
"}\n" +
".leonardo-states-list {\n" +
"  flex-grow: 1;\n" +
"  padding-left: 10px;\n" +
"  padding-top: 10px;\n" +
"  overflow: auto;\n" +
"}\n" +
".leonardo-states-list .leonardo-state-item:nth-child(2n+3) {\n" +
"  background: #eee;\n" +
"}\n" +
".leonardo-states-list .leonardo-state-item:hover {\n" +
"  cursor: pointer;\n" +
"  background: rgba(47, 204, 255, 0.32);\n" +
"}\n" +
".leonardo-states-list .leonardo-state-item-detailed {\n" +
"  background: #999966!important;\n" +
"}\n" +
".leonardo-states-list .leonardo-state-item-detailed:hover {\n" +
"  background: #ccccb3!important;\n" +
"}\n" +
".leonardo-states-bar {\n" +
"  display: flex;\n" +
"  justify-content: space-between;\n" +
"  margin-bottom: 10px;\n" +
"  padding-right: 1px;\n" +
"}\n" +
".leonardo-states-bar .leonardo-search-state {\n" +
"  border: 1px solid #ccc;\n" +
"  border-width: 0 0 1px 0;\n" +
"  width: 200px;\n" +
"  outline: none;\n" +
"  font-size: 15px;\n" +
"}\n" +
"::-webkit-input-placeholder {\n" +
"  color: #ccc !important;\n" +
"}\n" +
".leonardo-add-scenario {\n" +
"  display: none;\n" +
"  position: absolute;\n" +
"  right: 0;\n" +
"  top: 0;\n" +
"}\n" +
".leonardo-add-scenario .leonardo-add-scenario-box {\n" +
"  position: absolute;\n" +
"  display: flex;\n" +
"  height: 50px;\n" +
"  width: 425px;\n" +
"  right: 25px;\n" +
"  bottom: -90px;\n" +
"  border: 1px solid black;\n" +
"  background: white;\n" +
"  box-shadow: 4px 3px 5px 0 rgba(0, 0, 0, 0.75);\n" +
"  z-index: 1;\n" +
"  justify-content: space-between;\n" +
"  align-items: center;\n" +
"  padding: 5px;\n" +
"}\n" +
".leonardo-add-scenario .leonardo-add-scenario-box > input {\n" +
"  flex: 1;\n" +
"  height: 25px;\n" +
"  margin-left: 5px;\n" +
"}\n" +
".leonardo-add-scenario .leonardo-add-scenario-box > button {\n" +
"  margin-left: 5px;\n" +
"}\n" +
".leonardo-scenarios-list {\n" +
"  width: 200px;\n" +
"  padding-left: 15px;\n" +
"  padding-top: 10px;\n" +
"  border-right: 1px solid #ccc;\n" +
"  overflow: auto;\n" +
"}\n" +
".leonardo-scenarios-list > div {\n" +
"  font-weight: 500;\n" +
"}\n" +
".leonardo-scenarios-list ul {\n" +
"  margin: 0;\n" +
"  padding-top: 5px;\n" +
"  padding-left: 5px;\n" +
"  font-size: 0.9rem;\n" +
"}\n" +
".leonardo-scenarios-list ul li {\n" +
"  list-style: none;\n" +
"  cursor: pointer;\n" +
"  max-width: calc(100% - 10px);\n" +
"  overflow: hidden;\n" +
"  text-overflow: ellipsis;\n" +
"  white-space: nowrap;\n" +
"  margin-bottom: 2px;\n" +
"}\n" +
".leonardo-scenarios-list ul li:hover {\n" +
"  text-decoration: underline;\n" +
"}\n" +
".leonardo-state-item {\n" +
"  display: flex;\n" +
"  margin-bottom: 3px;\n" +
"}\n" +
".leonardo-state-item .leonardo-state-verb {\n" +
"  margin-right: 10px;\n" +
"  background: #000;\n" +
"  color: #fff;\n" +
"  text-align: center;\n" +
"  width: 60px;\n" +
"  height: 25px;\n" +
"  line-height: 25px;\n" +
"  font-size: 12px;\n" +
"}\n" +
".leonardo-state-item .leonardo-toggle-btn {\n" +
"  margin-right: 15px;\n" +
"  align-self: center;\n" +
"}\n" +
".leonardo-state-item .leonardo-state-verb-get {\n" +
"  background: green;\n" +
"}\n" +
".leonardo-state-item .leonardo-state-verb-custom {\n" +
"  background: black;\n" +
"}\n" +
".leonardo-state-item .leonardo-state-verb-post {\n" +
"  background: orange;\n" +
"}\n" +
".leonardo-state-item .leonardo-state-verb-put {\n" +
"  background: blue;\n" +
"}\n" +
".leonardo-state-item .leonardo-state-verb-delete {\n" +
"  background: brown;\n" +
"}\n" +
".leonardo-state-item .leonardo-state-name {\n" +
"  font-size: 0.9rem;\n" +
"  align-self: center;\n" +
"}\n" +
".leonardo-state-item .leonardo-state-url {\n" +
"  flex: 1;\n" +
"  font-size: 0.7rem;\n" +
"  align-self: center;\n" +
"  margin-left: 10px;\n" +
"  color: grey;\n" +
"}\n" +
".leonardo-state-item .leonardo-state-remove {\n" +
"  background: #219161;\n" +
"  color: white;\n" +
"  border: 0;\n" +
"  font-size: 13px;\n" +
"  cursor: pointer;\n" +
"  padding: 5px;\n" +
"  border-radius: 2px;\n" +
"  margin-left: 5px;\n" +
"}\n" +
".leonardo-state-item.leonardo-state-item-hidden {\n" +
"  display: none;\n" +
"}\n" +
".leonardo-state-detail {\n" +
"  position: fixed;\n" +
"  transition: right 200ms ease-out;\n" +
"  top: 0;\n" +
"  bottom: 0;\n" +
"  right: -300px;\n" +
"  width: 300px;\n" +
"  border: 1px solid #ccc;\n" +
"  border-top: none;\n" +
"  background: white;\n" +
"  z-index: 100;\n" +
"  font-size: 13px;\n" +
"  padding: 5px;\n" +
"}\n" +
".leonardo-state-detail div {\n" +
"  margin-top: 10px;\n" +
"}\n" +
".leonardo-state-detail textarea {\n" +
"  display: block;\n" +
"  width: 100%;\n" +
"  height: 200px;\n" +
"}\n" +
".leonardo-state-detail button {\n" +
"  margin-top: 10px;\n" +
"}\n" +
".leonardo-state-detail-recorder {\n" +
"  border: 1px solid #ccc;\n" +
"  border-top: none;\n" +
"  background: white;\n" +
"  z-index: 100;\n" +
"  height: 100%;\n" +
"  font-size: 13px;\n" +
"  padding: 5px;\n" +
"}\n" +
".leonardo-state-detail-recorder div {\n" +
"  margin-top: 10px;\n" +
"}\n" +
".leonardo-state-detail-recorder textarea {\n" +
"  display: block;\n" +
"  width: 100%;\n" +
"  height: 200px;\n" +
"}\n" +
".leonardo-state-detail-recorder button {\n" +
"  margin-top: 10px;\n" +
"}\n" +
".leonardo-recorder {\n" +
"  height: 100%;\n" +
"}\n" +
".leonardo-recorder-list {\n" +
"  height: 100%;\n" +
"  overflow: auto;\n" +
"}\n" +
".leonardo-recorder-list .leonardo-recorder-list-container {\n" +
"  text-decoration: none;\n" +
"  padding: 0;\n" +
"  margin: 0;\n" +
"  overflow: auto;\n" +
"}\n" +
".leonardo-recorder-list .leonardo-recorder-list-container .leonardo-recorder-list-item {\n" +
"  display: flex;\n" +
"  border-bottom: 1px solid #ccc;\n" +
"  text-decoration: none;\n" +
"  color: #555;\n" +
"  padding: 5px;\n" +
"  font-size: 13px;\n" +
"  cursor: pointer;\n" +
"}\n" +
".leonardo-recorder-list .leonardo-recorder-list-container .leonardo-recorder-list-item:hover {\n" +
"  background: #ddd !important;\n" +
"}\n" +
".leonardo-recorder-list .leonardo-recorder-list-container .leonardo-recorder-list-item .leonardo-recorder-list-url {\n" +
"  flex-grow: 1;\n" +
"  white-space: nowrap;\n" +
"  overflow: hidden;\n" +
"  text-overflow: ellipsis;\n" +
"  padding-right: 5px;\n" +
"  line-height: 25px;\n" +
"  font-size: 13px;\n" +
"  color: #555;\n" +
"}\n" +
".leonardo-recorder-list .leonardo-recorder-list-container .leonardo-recorder-list-item .leonardo-recorder-list-name {\n" +
"  background: #f08222;\n" +
"  display: inline-block;\n" +
"  padding: 5px 10px;\n" +
"  float: right;\n" +
"  font-size: 12px;\n" +
"  margin: 0 2px;\n" +
"  color: white;\n" +
"  justify-content: flex-end;\n" +
"  white-space: nowrap;\n" +
"}\n" +
".leonardo-recorder-list .leonardo-recorder-list-container .leonardo-recorder-list-item .leonardo-recorder-list-name-new {\n" +
"  background: blue;\n" +
"}\n" +
".leonardo-recorder-list .leonardo-recorder-list-container .leonardo-recorder-list-item .leonardo-recorder-list-verb {\n" +
"  margin-right: 10px;\n" +
"  background: #000;\n" +
"  color: #fff;\n" +
"  text-align: center;\n" +
"  width: 60px;\n" +
"  height: 25px;\n" +
"  line-height: 25px;\n" +
"  font-size: 12px;\n" +
"}\n" +
".leonardo-recorder-list .leonardo-recorder-list-container .leonardo-recorder-list-item .leonardo-recorder-list-verb-get {\n" +
"  background: green;\n" +
"}\n" +
".leonardo-recorder-list .leonardo-recorder-list-container .leonardo-recorder-list-item .leonardo-recorder-list-verb-custom {\n" +
"  background: black;\n" +
"}\n" +
".leonardo-recorder-list .leonardo-recorder-list-container .leonardo-recorder-list-item .leonardo-recorder-list-verb-post {\n" +
"  background: orange;\n" +
"}\n" +
".leonardo-recorder-list .leonardo-recorder-list-container .leonardo-recorder-list-item .leonardo-recorder-list-verb-put {\n" +
"  background: blue;\n" +
"}\n" +
".leonardo-recorder-list .leonardo-recorder-list-container .leonardo-recorder-list-item .leonardo-recorder-list-verb-delete {\n" +
"  background: brown;\n" +
"}\n" +
".leonardo-recorder-list .leonardo-recorder-list-container .leonardo-recorder-list-item:nth-child(even) {\n" +
"  background: #F2F2F2;\n" +
"}\n" +
".leonardo-export {\n" +
"  overflow: auto;\n" +
"}\n" +
".leonardo-export .exportButtons {\n" +
"  float: right;\n" +
"  margin-right: 30px;\n" +
"  margin-top: 30px;\n" +
"  border: 2px solid;\n" +
"  border-radius: 6px;\n" +
"  width: 180px;\n" +
"  height: 42px;\n" +
"  font-size: 110%;\n" +
"}\n" +
".leonardo-toggle {\n" +
"  display: none;\n" +
"}\n" +
".leonardo-toggle,\n" +
".leonardo-toggle:after,\n" +
".leonardo-toggle:before,\n" +
".leonardo-toggle *,\n" +
".leonardo-toggle *:after,\n" +
".leonardo-toggle *:before,\n" +
".leonardo-toggle + .leonardo-toggle-btn {\n" +
"  box-sizing: border-box;\n" +
"}\n" +
".leonardo-toggle::selection,\n" +
".leonardo-toggle:after::selection,\n" +
".leonardo-toggle:before::selection,\n" +
".leonardo-toggle *::selection,\n" +
".leonardo-toggle *:after::selection,\n" +
".leonardo-toggle *:before::selection,\n" +
".leonardo-toggle + .leonardo-toggle-btn::selection {\n" +
"  background: none;\n" +
"}\n" +
".leonardo-toggle + .leonardo-toggle-btn {\n" +
"  outline: 0;\n" +
"  display: block;\n" +
"  width: 3em;\n" +
"  height: 1.5em;\n" +
"  position: relative;\n" +
"  cursor: pointer;\n" +
"  user-select: none;\n" +
"}\n" +
".leonardo-toggle + .leonardo-toggle-btn:after,\n" +
".leonardo-toggle + .leonardo-toggle-btn:before {\n" +
"  position: relative;\n" +
"  display: block;\n" +
"  content: \"\";\n" +
"  width: 50%;\n" +
"  height: 100%;\n" +
"}\n" +
".leonardo-toggle + .leonardo-toggle-btn:after {\n" +
"  left: 0;\n" +
"}\n" +
".leonardo-toggle + .leonardo-toggle-btn:before {\n" +
"  display: none;\n" +
"}\n" +
".leonardo-toggle:checked + .leonardo-toggle-btn:after {\n" +
"  left: 50%;\n" +
"}\n" +
".leonardo-toggle-ios + .leonardo-toggle-btn {\n" +
"  background: #fbfbfb;\n" +
"  border-radius: 2em;\n" +
"  padding: 2px;\n" +
"  transition: all .4s ease;\n" +
"  border: 1px solid #e8eae9;\n" +
"}\n" +
".leonardo-toggle-ios + .leonardo-toggle-btn:after {\n" +
"  border-radius: 2em;\n" +
"  background: #fbfbfb;\n" +
"  transition: left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), padding 0.3s ease, margin 0.3s ease;\n" +
"  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1), 0 4px 0 rgba(0, 0, 0, 0.08);\n" +
"}\n" +
".leonardo-toggle-ios + .leonardo-toggle-btn:hover:after {\n" +
"  will-change: padding;\n" +
"}\n" +
".leonardo-toggle-ios + .leonardo-toggle-btn:active {\n" +
"  box-shadow: inset 0 0 0 2em #e8eae9;\n" +
"}\n" +
".leonardo-toggle-ios + .leonardo-toggle-btn:active:after {\n" +
"  padding-right: .8em;\n" +
"}\n" +
".leonardo-toggle-ios:checked + .leonardo-toggle-btn {\n" +
"  background: #86d993;\n" +
"}\n" +
".leonardo-toggle-ios:checked + .leonardo-toggle-btn:active {\n" +
"  box-shadow: none;\n" +
"}\n" +
".leonardo-toggle-ios:checked + .leonardo-toggle-btn:active:after {\n" +
"  margin-left: -0.8em;\n" +
"}\n" +
".leonardo-button {\n" +
"  background: #219161;\n" +
"  color: white;\n" +
"  border: 0;\n" +
"  font-size: 13px;\n" +
"  cursor: pointer;\n" +
"  padding: 5px 10px;\n" +
"  border-radius: 2px;\n" +
"}"));
