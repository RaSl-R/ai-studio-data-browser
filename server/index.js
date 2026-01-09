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
var express_1 = require("express");
var cors_1 = require("cors");
var pg_1 = require("pg");
var app = (0, express_1.default)();
var PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// PostgreSQL Connection Pool
var pool = new pg_1.Pool({
    user: process.env.DB_USER || "neondb_owner",
    password: process.env.DB_PASSWORD || "npg_bqIR6D2UkALc",
    host: process.env.DB_HOST || "ep-icy-moon-a2bfjmyb-pooler.eu-central-1.aws.neon.tech",
    database: process.env.DB_NAME || "neondb",
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    }
});
// Test connection
pool.query('SELECT NOW()', function (err, res) {
    if (err) {
        console.error('Database connection error:', err);
    }
    else {
        console.log('Database connected successfully');
    }
});
// API Routes
// Get all schemas (mock - return only public for now)
app.get('/api/schemas', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var result, schemas, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, pool.query("\n      SELECT schema_name \n      FROM information_schema.schemata \n      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')\n      ORDER BY schema_name\n    ")];
            case 1:
                result = _a.sent();
                schemas = result.rows.map(function (row) { return row.schema_name; });
                res.json({ schemas: schemas });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error('Error fetching schemas:', error_1);
                res.status(500).json({ error: 'Failed to fetch schemas' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get tables for a schema
app.get('/api/schemas/:schemaName/tables', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var schemaName, result, tables, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                schemaName = req.params.schemaName;
                return [4 /*yield*/, pool.query("\n      SELECT table_name\n      FROM information_schema.tables\n      WHERE table_schema = $1\n      ORDER BY table_name\n    ", [schemaName])];
            case 1:
                result = _a.sent();
                tables = result.rows.map(function (row) { return row.table_name; });
                res.json({ tables: tables });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error('Error fetching tables:', error_2);
                res.status(500).json({ error: 'Failed to fetch tables' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get table info
app.get('/api/schemas/:schemaName/tables/:tableName/info', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, schemaName, tableName, countResult, columnsResult, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.params, schemaName = _a.schemaName, tableName = _a.tableName;
                return [4 /*yield*/, pool.query("SELECT COUNT(*) as count FROM \"".concat(schemaName, "\".\"").concat(tableName, "\""))];
            case 1:
                countResult = _b.sent();
                return [4 /*yield*/, pool.query("\n      SELECT COUNT(*) as count\n      FROM information_schema.columns\n      WHERE table_schema = $1 AND table_name = $2\n    ", [schemaName, tableName])];
            case 2:
                columnsResult = _b.sent();
                res.json({
                    schema_name: schemaName,
                    table_name: tableName,
                    full_name: "".concat(schemaName, ".").concat(tableName),
                    row_count: parseInt(countResult.rows[0].count),
                    column_count: parseInt(columnsResult.rows[0].count)
                });
                return [3 /*break*/, 4];
            case 3:
                error_3 = _b.sent();
                console.error('Error fetching table info:', error_3);
                res.status(500).json({ error: 'Failed to fetch table info' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Get table data with pagination and filtering
app.post('/api/schemas/:schemaName/tables/:tableName/data', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, schemaName, tableName, _b, _c, page, _d, pageSize, _e, whereClause, offset, baseQuery, forbidden, upperWhere_1, countQuery, countResult, totalRows, dataQuery, dataResult, totalPages, error_4;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                _f.trys.push([0, 3, , 4]);
                _a = req.params, schemaName = _a.schemaName, tableName = _a.tableName;
                _b = req.body, _c = _b.page, page = _c === void 0 ? 1 : _c, _d = _b.pageSize, pageSize = _d === void 0 ? 50 : _d, _e = _b.whereClause, whereClause = _e === void 0 ? '' : _e;
                offset = (page - 1) * pageSize;
                baseQuery = "SELECT * FROM \"".concat(schemaName, "\".\"").concat(tableName, "\"");
                // Add WHERE clause if provided (BASIC validation - improve in production!)
                if (whereClause && whereClause.trim()) {
                    forbidden = ['DELETE', 'UPDATE', 'INSERT', 'DROP', 'ALTER', 'EXEC', 'CREATE'];
                    upperWhere_1 = whereClause.toUpperCase();
                    if (forbidden.some(function (keyword) { return upperWhere_1.includes(keyword); })) {
                        return [2 /*return*/, res.status(400).json({ error: 'Forbidden SQL keyword detected' })];
                    }
                    if (whereClause.includes('--') || whereClause.includes('/*')) {
                        return [2 /*return*/, res.status(400).json({ error: 'SQL comment patterns not allowed' })];
                    }
                    baseQuery += " WHERE ".concat(whereClause);
                }
                countQuery = "SELECT COUNT(*) as total FROM (".concat(baseQuery, ") as subquery");
                return [4 /*yield*/, pool.query(countQuery)];
            case 1:
                countResult = _f.sent();
                totalRows = parseInt(countResult.rows[0].total);
                dataQuery = "".concat(baseQuery, " ORDER BY 1 LIMIT $1 OFFSET $2");
                return [4 /*yield*/, pool.query(dataQuery, [pageSize, offset])];
            case 2:
                dataResult = _f.sent();
                totalPages = Math.ceil(totalRows / pageSize);
                res.json({
                    data: dataResult.rows,
                    row_count: dataResult.rows.length,
                    total_rows: totalRows,
                    page: page,
                    page_size: pageSize,
                    total_pages: totalPages
                });
                return [3 /*break*/, 4];
            case 3:
                error_4 = _f.sent();
                console.error('Error fetching data:', error_4);
                res.status(500).json({ error: error_4.message || 'Failed to fetch data' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// Health check
app.get('/health', function (req, res) {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.listen(PORT, function () {
    console.log("API server running on http://localhost:".concat(PORT));
});
