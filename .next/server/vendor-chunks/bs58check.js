"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/bs58check";
exports.ids = ["vendor-chunks/bs58check"];
exports.modules = {

/***/ "(ssr)/./node_modules/bs58check/base.js":
/*!****************************************!*\
  !*** ./node_modules/bs58check/base.js ***!
  \****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\n\nvar base58 = __webpack_require__(/*! bs58 */ \"(ssr)/./node_modules/bs58/index.js\")\nvar Buffer = (__webpack_require__(/*! safe-buffer */ \"(ssr)/./node_modules/safe-buffer/index.js\").Buffer)\n\nmodule.exports = function (checksumFn) {\n  // Encode a buffer as a base58-check encoded string\n  function encode (payload) {\n    var checksum = checksumFn(payload)\n\n    return base58.encode(Buffer.concat([\n      payload,\n      checksum\n    ], payload.length + 4))\n  }\n\n  function decodeRaw (buffer) {\n    var payload = buffer.slice(0, -4)\n    var checksum = buffer.slice(-4)\n    var newChecksum = checksumFn(payload)\n\n    if (checksum[0] ^ newChecksum[0] |\n        checksum[1] ^ newChecksum[1] |\n        checksum[2] ^ newChecksum[2] |\n        checksum[3] ^ newChecksum[3]) return\n\n    return payload\n  }\n\n  // Decode a base58-check encoded string to a buffer, no result if checksum is wrong\n  function decodeUnsafe (string) {\n    var buffer = base58.decodeUnsafe(string)\n    if (!buffer) return\n\n    return decodeRaw(buffer)\n  }\n\n  function decode (string) {\n    var buffer = base58.decode(string)\n    var payload = decodeRaw(buffer, checksumFn)\n    if (!payload) throw new Error('Invalid checksum')\n    return payload\n  }\n\n  return {\n    encode: encode,\n    decode: decode,\n    decodeUnsafe: decodeUnsafe\n  }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvYnM1OGNoZWNrL2Jhc2UuanMiLCJtYXBwaW5ncyI6IkFBQVk7O0FBRVosYUFBYSxtQkFBTyxDQUFDLGdEQUFNO0FBQzNCLGFBQWEsNEZBQTZCOztBQUUxQztBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vbWljcm9sZW5kZXIvLi9ub2RlX21vZHVsZXMvYnM1OGNoZWNrL2Jhc2UuanM/M2Q0YyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxudmFyIGJhc2U1OCA9IHJlcXVpcmUoJ2JzNTgnKVxudmFyIEJ1ZmZlciA9IHJlcXVpcmUoJ3NhZmUtYnVmZmVyJykuQnVmZmVyXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNoZWNrc3VtRm4pIHtcbiAgLy8gRW5jb2RlIGEgYnVmZmVyIGFzIGEgYmFzZTU4LWNoZWNrIGVuY29kZWQgc3RyaW5nXG4gIGZ1bmN0aW9uIGVuY29kZSAocGF5bG9hZCkge1xuICAgIHZhciBjaGVja3N1bSA9IGNoZWNrc3VtRm4ocGF5bG9hZClcblxuICAgIHJldHVybiBiYXNlNTguZW5jb2RlKEJ1ZmZlci5jb25jYXQoW1xuICAgICAgcGF5bG9hZCxcbiAgICAgIGNoZWNrc3VtXG4gICAgXSwgcGF5bG9hZC5sZW5ndGggKyA0KSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlY29kZVJhdyAoYnVmZmVyKSB7XG4gICAgdmFyIHBheWxvYWQgPSBidWZmZXIuc2xpY2UoMCwgLTQpXG4gICAgdmFyIGNoZWNrc3VtID0gYnVmZmVyLnNsaWNlKC00KVxuICAgIHZhciBuZXdDaGVja3N1bSA9IGNoZWNrc3VtRm4ocGF5bG9hZClcblxuICAgIGlmIChjaGVja3N1bVswXSBeIG5ld0NoZWNrc3VtWzBdIHxcbiAgICAgICAgY2hlY2tzdW1bMV0gXiBuZXdDaGVja3N1bVsxXSB8XG4gICAgICAgIGNoZWNrc3VtWzJdIF4gbmV3Q2hlY2tzdW1bMl0gfFxuICAgICAgICBjaGVja3N1bVszXSBeIG5ld0NoZWNrc3VtWzNdKSByZXR1cm5cblxuICAgIHJldHVybiBwYXlsb2FkXG4gIH1cblxuICAvLyBEZWNvZGUgYSBiYXNlNTgtY2hlY2sgZW5jb2RlZCBzdHJpbmcgdG8gYSBidWZmZXIsIG5vIHJlc3VsdCBpZiBjaGVja3N1bSBpcyB3cm9uZ1xuICBmdW5jdGlvbiBkZWNvZGVVbnNhZmUgKHN0cmluZykge1xuICAgIHZhciBidWZmZXIgPSBiYXNlNTguZGVjb2RlVW5zYWZlKHN0cmluZylcbiAgICBpZiAoIWJ1ZmZlcikgcmV0dXJuXG5cbiAgICByZXR1cm4gZGVjb2RlUmF3KGJ1ZmZlcilcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlY29kZSAoc3RyaW5nKSB7XG4gICAgdmFyIGJ1ZmZlciA9IGJhc2U1OC5kZWNvZGUoc3RyaW5nKVxuICAgIHZhciBwYXlsb2FkID0gZGVjb2RlUmF3KGJ1ZmZlciwgY2hlY2tzdW1GbilcbiAgICBpZiAoIXBheWxvYWQpIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjaGVja3N1bScpXG4gICAgcmV0dXJuIHBheWxvYWRcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZW5jb2RlOiBlbmNvZGUsXG4gICAgZGVjb2RlOiBkZWNvZGUsXG4gICAgZGVjb2RlVW5zYWZlOiBkZWNvZGVVbnNhZmVcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/bs58check/base.js\n");

/***/ }),

/***/ "(ssr)/./node_modules/bs58check/index.js":
/*!*****************************************!*\
  !*** ./node_modules/bs58check/index.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("\n\nvar createHash = __webpack_require__(/*! create-hash */ \"(ssr)/./node_modules/create-hash/index.js\")\nvar bs58checkBase = __webpack_require__(/*! ./base */ \"(ssr)/./node_modules/bs58check/base.js\")\n\n// SHA256(SHA256(buffer))\nfunction sha256x2 (buffer) {\n  var tmp = createHash('sha256').update(buffer).digest()\n  return createHash('sha256').update(tmp).digest()\n}\n\nmodule.exports = bs58checkBase(sha256x2)\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvYnM1OGNoZWNrL2luZGV4LmpzIiwibWFwcGluZ3MiOiJBQUFZOztBQUVaLGlCQUFpQixtQkFBTyxDQUFDLDhEQUFhO0FBQ3RDLG9CQUFvQixtQkFBTyxDQUFDLHNEQUFROztBQUVwQztBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vbWljcm9sZW5kZXIvLi9ub2RlX21vZHVsZXMvYnM1OGNoZWNrL2luZGV4LmpzP2ZmZjAiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbnZhciBjcmVhdGVIYXNoID0gcmVxdWlyZSgnY3JlYXRlLWhhc2gnKVxudmFyIGJzNThjaGVja0Jhc2UgPSByZXF1aXJlKCcuL2Jhc2UnKVxuXG4vLyBTSEEyNTYoU0hBMjU2KGJ1ZmZlcikpXG5mdW5jdGlvbiBzaGEyNTZ4MiAoYnVmZmVyKSB7XG4gIHZhciB0bXAgPSBjcmVhdGVIYXNoKCdzaGEyNTYnKS51cGRhdGUoYnVmZmVyKS5kaWdlc3QoKVxuICByZXR1cm4gY3JlYXRlSGFzaCgnc2hhMjU2JykudXBkYXRlKHRtcCkuZGlnZXN0KClcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiczU4Y2hlY2tCYXNlKHNoYTI1NngyKVxuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/bs58check/index.js\n");

/***/ })

};
;