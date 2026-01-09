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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
var types_1 = require("../types");
// Mock Data
var MOCK_GROUPS = [
    { id: 1, name: "Admins", description: "Full access" },
    { id: 2, name: "Analysts", description: "Read-only access to business data" },
    { id: 3, name: "Viewers", description: "Limited read access" },
];
var MOCK_USERS = [
    { id: 1, email: "admin@example.com", is_active: true, group_id: 1, group_name: "Admins" },
    { id: 2, email: "analyst@example.com", is_active: true, group_id: 2, group_name: "Analysts" },
    { id: 3, email: "user@example.com", is_active: true, group_id: 3, group_name: "Viewers" },
];
var MOCK_PERMISSIONS = [
    { group_id: 1, schema_name: "public", permission: types_1.PermissionLevel.WRITE },
    { group_id: 1, schema_name: "sales", permission: types_1.PermissionLevel.WRITE },
    { group_id: 1, schema_name: "hr", permission: types_1.PermissionLevel.WRITE },
    { group_id: 2, schema_name: "public", permission: types_1.PermissionLevel.READ },
    { group_id: 2, schema_name: "sales", permission: types_1.PermissionLevel.READ },
    { group_id: 3, schema_name: "public", permission: types_1.PermissionLevel.READ },
];
// Mock Database Content
var TABLES_DATA = {
    "public.users_audit": Array.from({ length: 120 }).map(function (_, i) { return ({
        id: i + 1,
        action: i % 2 === 0 ? "LOGIN" : "LOGOUT",
        user_email: "user".concat(i % 10, "@example.com"),
        timestamp: new Date(Date.now() - i * 3600000).toISOString(),
        ip_address: "192.168.1.".concat(i % 255)
    }); }),
    "sales.orders": Array.from({ length: 85 }).map(function (_, i) { return ({
        order_id: 1000 + i,
        customer: "Customer ".concat(i),
        amount: (Math.random() * 1000).toFixed(2),
        status: i % 5 === 0 ? "CANCELLED" : "COMPLETED",
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
    }); }),
    "hr.employees": [
        { id: 1, name: "John Doe", role: "Manager", salary: 80000 },
        { id: 2, name: "Jane Smith", role: "Developer", salary: 75000 },
        { id: 3, name: "Bob Johnson", role: "Designer", salary: 70000 },
    ]
};
var MockDB = /** @class */ (function () {
    function MockDB() {
        this.latency = 300; // Simulate network delay
    }
    MockDB.prototype.delay = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve) { return setTimeout(resolve, _this.latency); })];
            });
        });
    };
    MockDB.prototype.login = function (email, password) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.delay()];
                    case 1:
                        _a.sent();
                        user = MOCK_USERS.find(function (u) { return u.email === email; });
                        if (user && password === "password") { // Hardcoded password for demo
                            return [2 /*return*/, user];
                        }
                        return [2 /*return*/, null];
                }
            });
        });
    };
    MockDB.prototype.register = function (email, groupId) {
        return __awaiter(this, void 0, void 0, function () {
            var group;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.delay()];
                    case 1:
                        _a.sent();
                        if (MOCK_USERS.find(function (u) { return u.email === email; }))
                            return [2 /*return*/, false];
                        group = MOCK_GROUPS.find(function (g) { return g.id === groupId; });
                        MOCK_USERS.push({
                            id: MOCK_USERS.length + 1,
                            email: email,
                            is_active: true,
                            group_id: groupId,
                            group_name: group === null || group === void 0 ? void 0 : group.name
                        });
                        return [2 /*return*/, true];
                }
            });
        });
    };
    MockDB.prototype.getGroups = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.delay()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, MOCK_GROUPS];
                }
            });
        });
    };
    MockDB.prototype.getAccessibleSchemas = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            var perms, schemas;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.delay()];
                    case 1:
                        _a.sent();
                        if (!user.group_id)
                            return [2 /*return*/, []];
                        perms = MOCK_PERMISSIONS.filter(function (p) { return p.group_id === user.group_id; });
                        schemas = Array.from(new Set(perms.map(function (p) { return p.schema_name; })));
                        return [2 /*return*/, schemas.sort()];
                }
            });
        });
    };
    MockDB.prototype.getTables = function (schemaName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.delay()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, Object.keys(TABLES_DATA)
                                .filter(function (key) { return key.startsWith("".concat(schemaName, ".")); })
                                .map(function (key) { return key.split('.')[1]; })];
                }
            });
        });
    };
    MockDB.prototype.getTableInfo = function (schemaName, tableName) {
        return __awaiter(this, void 0, void 0, function () {
            var fullKey, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.delay()];
                    case 1:
                        _a.sent();
                        fullKey = "".concat(schemaName, ".").concat(tableName);
                        data = TABLES_DATA[fullKey] || [];
                        return [2 /*return*/, {
                                schema_name: schemaName,
                                table_name: tableName,
                                full_name: fullKey,
                                row_count: data.length,
                                column_count: data.length > 0 ? Object.keys(data[0]).length : 0
                            }];
                }
            });
        });
    };
    MockDB.prototype.getData = function (schemaName, tableName, page, whereClause) {
        return __awaiter(this, void 0, void 0, function () {
            var fullKey, data, lowerClause_1, total_rows, total_pages, start, end, slicedData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.delay()];
                    case 1:
                        _a.sent();
                        fullKey = "".concat(schemaName, ".").concat(tableName);
                        data = __spreadArray([], (TABLES_DATA[fullKey] || []), true);
                        // Basic Filter Simulation
                        if (whereClause) {
                            try {
                                lowerClause_1 = whereClause.toLowerCase();
                                data = data.filter(function (row) {
                                    return Object.values(row).some(function (val) {
                                        return String(val).toLowerCase().includes(lowerClause_1);
                                    });
                                });
                            }
                            catch (e) {
                                console.error("Filter error", e);
                            }
                        }
                        total_rows = data.length;
                        total_pages = Math.ceil(total_rows / types_1.PAGE_SIZE);
                        start = (page - 1) * types_1.PAGE_SIZE;
                        end = start + types_1.PAGE_SIZE;
                        slicedData = data.slice(start, end);
                        return [2 /*return*/, {
                                data: slicedData,
                                row_count: slicedData.length,
                                total_rows: total_rows,
                                page: page,
                                page_size: types_1.PAGE_SIZE,
                                total_pages: total_pages
                            }];
                }
            });
        });
    };
    MockDB.prototype.updateData = function (schemaName, tableName, newData) {
        return __awaiter(this, void 0, void 0, function () {
            var fullKey;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.delay()];
                    case 1:
                        _a.sent();
                        fullKey = "".concat(schemaName, ".").concat(tableName);
                        // Simple replace for demo
                        TABLES_DATA[fullKey] = newData;
                        return [2 /*return*/, true];
                }
            });
        });
    };
    MockDB.prototype.hasWritePermission = function (user, schemaName) {
        if (!user.group_id)
            return false;
        var perm = MOCK_PERMISSIONS.find(function (p) {
            return p.group_id === user.group_id &&
                p.schema_name === schemaName;
        });
        return (perm === null || perm === void 0 ? void 0 : perm.permission) === types_1.PermissionLevel.WRITE || (perm === null || perm === void 0 ? void 0 : perm.permission) === types_1.PermissionLevel.ADMIN;
    };
    return MockDB;
}());
exports.db = new MockDB();
