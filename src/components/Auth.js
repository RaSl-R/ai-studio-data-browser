"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auth = void 0;
var react_1 = require("react");
var mockDb_1 = require("../services/mockDb");
var utils_1 = require("../utils");
var lucide_react_1 = require("lucide-react");
var Auth = function (_a) {
    var onLogin = _a.onLogin;
    var _b = (0, react_1.useState)('login'), view = _b[0], setView = _b[1];
    return (<div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-slate-800 p-6 text-center">
                    <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                        <div className="bg-blue-500 p-1.5 rounded-lg">
                            <lucide_react_1.Lock className="w-5 h-5 text-white"/>
                        </div>
                        Data Browser
                    </h1>
                    <p className="text-slate-400 text-sm mt-2">Secure Database Access</p>
                </div>

                <div className="p-8">
                    {view === 'login' && <LoginForm onLogin={onLogin} onViewChange={setView}/>}
                    {view === 'register' && <RegisterForm onViewChange={setView}/>}
                    {view === 'reset' && <ResetForm onViewChange={setView}/>}
                </div>
            </div>
        </div>);
};
exports.Auth = Auth;
var LoginForm = function (_a) {
    var onLogin = _a.onLogin, onViewChange = _a.onViewChange;
    var _b = (0, react_1.useState)(''), email = _b[0], setEmail = _b[1];
    var _c = (0, react_1.useState)(''), password = _c[0], setPassword = _c[1];
    var _d = (0, react_1.useState)(''), error = _d[0], setError = _d[1];
    var _e = (0, react_1.useState)(false), loading = _e[0], setLoading = _e[1];
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    setError('');
                    setLoading(true);
                    return [4 /*yield*/, mockDb_1.db.login(email, password)];
                case 1:
                    user = _a.sent();
                    if (user) {
                        onLogin(user);
                    }
                    else {
                        setError("Invalid credentials. Try 'admin@example.com' / 'password'");
                    }
                    setLoading(false);
                    return [2 /*return*/];
            }
        });
    }); };
    return (<form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign In</h2>
            
            {error && (<div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
                    <lucide_react_1.AlertCircle className="w-4 h-4"/>
                    {error}
                </div>)}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                    <lucide_react_1.Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"/>
                    <input type="email" className="pl-10 w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="you@example.com" value={email} onChange={function (e) { return setEmail(e.target.value); }} required/>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                    <lucide_react_1.KeyRound className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"/>
                    <input type="password" className="pl-10 w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="••••••••" value={password} onChange={function (e) { return setPassword(e.target.value); }} required/>
                </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-70">
                {loading ? "Signing in..." : "Sign In"}
            </button>

            <div className="mt-4 flex items-center justify-between text-sm">
                <button type="button" onClick={function () { return onViewChange('reset'); }} className="text-blue-600 hover:text-blue-800">
                    Forgot password?
                </button>
                <button type="button" onClick={function () { return onViewChange('register'); }} className="text-blue-600 hover:text-blue-800">
                    Create account
                </button>
            </div>
        </form>);
};
var RegisterForm = function (_a) {
    var onViewChange = _a.onViewChange;
    var _b = (0, react_1.useState)(''), email = _b[0], setEmail = _b[1];
    var _c = (0, react_1.useState)(''), password = _c[0], setPassword = _c[1];
    var _d = (0, react_1.useState)(''), confirm = _d[0], setConfirm = _d[1];
    var _e = (0, react_1.useState)(3), groupId = _e[0], setGroupId = _e[1]; // Default to viewer
    var _f = (0, react_1.useState)([]), groups = _f[0], setGroups = _f[1];
    var _g = (0, react_1.useState)(''), error = _g[0], setError = _g[1];
    var _h = (0, react_1.useState)(false), success = _h[0], setSuccess = _h[1];
    (0, react_1.useEffect)(function () {
        mockDb_1.db.getGroups().then(setGroups);
    }, []);
    var strength = (0, utils_1.getPasswordStrength)(password);
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var emailValidation, pwdValidation, registered;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    setError('');
                    emailValidation = (0, utils_1.validateEmail)(email);
                    if (!emailValidation.isValid)
                        return [2 /*return*/, setError(emailValidation.error)];
                    pwdValidation = (0, utils_1.validatePassword)(password);
                    if (!pwdValidation.isValid)
                        return [2 /*return*/, setError(pwdValidation.error)];
                    if (password !== confirm)
                        return [2 /*return*/, setError("Passwords do not match.")];
                    return [4 /*yield*/, mockDb_1.db.register(email, groupId)];
                case 1:
                    registered = _a.sent();
                    if (registered) {
                        setSuccess(true);
                        setTimeout(function () { return onViewChange('login'); }, 2000);
                    }
                    else {
                        setError("Email already registered.");
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    if (success) {
        return (<div className="text-center py-8 space-y-4">
                <div className="bg-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                    <lucide_react_1.CheckCircle2 className="w-8 h-8 text-green-600"/>
                </div>
                <h3 className="text-lg font-bold text-gray-800">Registration Successful!</h3>
                <p className="text-gray-600">Redirecting to login...</p>
            </div>);
    }
    return (<form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Create Account</h2>
            
            {error && (<div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
                    <lucide_react_1.AlertCircle className="w-4 h-4"/>
                    {error}
                </div>)}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500" value={email} onChange={function (e) { return setEmail(e.target.value); }} required/>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500" value={password} onChange={function (e) { return setPassword(e.target.value); }} required/>
                {password && (<div className="mt-1 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div className={"h-full ".concat(strength.color)} style={{ width: "".concat((strength.score + 1) * 20, "%") }}></div>
                        </div>
                        <span className="text-xs text-gray-500">{strength.label}</span>
                    </div>)}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input type="password" className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500" value={confirm} onChange={function (e) { return setConfirm(e.target.value); }} required/>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requested Group</label>
                <select value={groupId} onChange={function (e) { return setGroupId(Number(e.target.value)); }} className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {groups.map(function (g) { return (<option key={g.id} value={g.id}>{g.name}</option>); })}
                </select>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium">
                Register
            </button>

            <button type="button" onClick={function () { return onViewChange('login'); }} className="w-full text-sm text-gray-600 hover:text-gray-900 mt-2">
                Back to Login
            </button>
        </form>);
};
var ResetForm = function (_a) {
    var onViewChange = _a.onViewChange;
    var _b = (0, react_1.useState)(false), sent = _b[0], setSent = _b[1];
    var handleReset = function (e) {
        e.preventDefault();
        setSent(true);
    };
    if (sent) {
        return (<div className="text-center space-y-4">
                <div className="bg-blue-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                    <lucide_react_1.Mail className="w-8 h-8 text-blue-600"/>
                </div>
                <h3 className="text-lg font-bold text-gray-800">Check your email</h3>
                <p className="text-gray-600 text-sm">We've sent password reset instructions to your email address.</p>
                <button onClick={function () { return onViewChange('login'); }} className="text-blue-600 text-sm font-medium hover:underline">Back to Login</button>
            </div>);
    }
    return (<form onSubmit={handleReset} className="space-y-4">
             <h2 className="text-xl font-semibold text-gray-800 mb-6">Reset Password</h2>
             <p className="text-sm text-gray-600 mb-4">Enter your email address and we'll send you a link to reset your password.</p>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium">
                Send Reset Link
            </button>
            <button type="button" onClick={function () { return onViewChange('login'); }} className="w-full text-sm text-gray-600 hover:text-gray-900 mt-2">
                Cancel
            </button>
        </form>);
};
