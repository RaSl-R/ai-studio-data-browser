"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAGE_SIZE = exports.PermissionLevel = void 0;
var PermissionLevel;
(function (PermissionLevel) {
    PermissionLevel["READ"] = "read";
    PermissionLevel["WRITE"] = "write";
    PermissionLevel["ADMIN"] = "admin";
})(PermissionLevel || (exports.PermissionLevel = PermissionLevel = {}));
exports.PAGE_SIZE = 50;
