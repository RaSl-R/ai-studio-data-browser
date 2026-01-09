"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var Auth_1 = require("./components/Auth");
var Dashboard_1 = require("./components/Dashboard");
var App = function () {
    var _a = (0, react_1.useState)(null), user = _a[0], setUser = _a[1];
    var handleLogin = function (newUser) {
        setUser(newUser);
    };
    var handleLogout = function () {
        setUser(null);
    };
    if (!user) {
        return <Auth_1.Auth onLogin={handleLogin}/>;
    }
    return <Dashboard_1.Dashboard user={user} onLogout={handleLogout}/>;
};
exports.default = App;
