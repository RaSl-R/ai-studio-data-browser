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
exports.DataBrowser = void 0;
var react_1 = require("react");
var mockDb_1 = require("../services/mockDb");
var types_1 = require("../types");
var utils_1 = require("../utils");
var lucide_react_1 = require("lucide-react");
var DataBrowser = function (_a) {
    var schemaName = _a.schemaName, tableName = _a.tableName, user = _a.user;
    var _b = (0, react_1.useState)(null), data = _b[0], setData = _b[1];
    var _c = (0, react_1.useState)(false), loading = _c[0], setLoading = _c[1];
    var _d = (0, react_1.useState)(null), error = _d[0], setError = _d[1];
    var _e = (0, react_1.useState)(''), filter = _e[0], setFilter = _e[1];
    var _f = (0, react_1.useState)(''), appliedFilter = _f[0], setAppliedFilter = _f[1];
    var _g = (0, react_1.useState)(1), page = _g[0], setPage = _g[1];
    var _h = (0, react_1.useState)(false), showFilter = _h[0], setShowFilter = _h[1];
    var _j = (0, react_1.useState)(false), importMode = _j[0], setImportMode = _j[1];
    var _k = (0, react_1.useState)(null), tableInfo = _k[0], setTableInfo = _k[1];
    var _l = (0, react_1.useState)(null), message = _l[0], setMessage = _l[1];
    var hasWriteAccess = mockDb_1.db.hasWritePermission(user, schemaName);
    var loadData = (0, react_1.useCallback)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var info, result, e_1, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    setMessage(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, mockDb_1.db.getTableInfo(schemaName, tableName)];
                case 2:
                    info = _a.sent();
                    setTableInfo(info);
                    return [4 /*yield*/, mockDb_1.db.getData(schemaName, tableName, page, appliedFilter)];
                case 3:
                    result = _a.sent();
                    setData(result);
                    return [3 /*break*/, 6];
                case 4:
                    e_1 = _a.sent();
                    errorMessage = e_1 instanceof Error ? e_1.message : "Error loading data";
                    setError(errorMessage);
                    return [3 /*break*/, 6];
                case 5:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); }, [schemaName, tableName, page, appliedFilter]);
    (0, react_1.useEffect)(function () {
        setPage(1);
        setFilter('');
        setAppliedFilter('');
    }, [schemaName, tableName]);
    (0, react_1.useEffect)(function () {
        loadData();
    }, [loadData]);
    var handleApplyFilter = function () {
        var validation = (0, utils_1.validateWhereClause)(filter);
        if (!validation.isValid) {
            setError(validation.error);
            return;
        }
        setAppliedFilter(filter);
        setPage(1);
        setError(null);
    };
    var handleClearFilter = function () {
        setFilter('');
        setAppliedFilter('');
        setPage(1);
        setError(null);
    };
    var handleImport = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var file;
        var _a;
        return __generator(this, function (_b) {
            file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
            if (!file)
                return [2 /*return*/];
            setLoading(true);
            setTimeout(function () { return __awaiter(void 0, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        setMessage({ type: 'success', text: "Successfully imported data from ".concat(file.name, ". (Mock)") });
                        setImportMode(false);
                        loadData();
                    }
                    catch (_b) {
                        setMessage({ type: 'error', text: "Failed to import CSV." });
                    }
                    setLoading(false);
                    return [2 /*return*/];
                });
            }); }, 1500);
            return [2 /*return*/];
        });
    }); };
    var handleDownload = function () {
        if (!(data === null || data === void 0 ? void 0 : data.data) || data.data.length === 0)
            return;
        var csvContent = "data:text/csv;charset=utf-8,"
            + Object.keys(data.data[0]).join(",") + "\n"
            + data.data.map(function (row) {
                return Object.values(row).join(",");
            }).join("\n");
        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "".concat(tableName, "_export.csv"));
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    if (loading && !data) {
        return (<div className="flex items-center justify-center h-64 text-slate-500">
        <lucide_react_1.RefreshCw className="w-8 h-8 animate-spin"/>
      </div>);
    }
    return (<div className="space-y-4">
      {/* Header / Stats */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{schemaName}.{tableName}</h2>
          <p className="text-xs text-slate-500">
            {tableInfo === null || tableInfo === void 0 ? void 0 : tableInfo.row_count} rows • {tableInfo === null || tableInfo === void 0 ? void 0 : tableInfo.column_count} columns
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={function () { return setShowFilter(!showFilter); }} className={"p-2 rounded hover:bg-slate-100 ".concat(showFilter ? 'bg-blue-50 text-blue-600' : 'text-slate-600')} title="Filter">
            <lucide_react_1.Filter className="w-5 h-5"/>
          </button>
          <button onClick={loadData} className="p-2 rounded hover:bg-slate-100 text-slate-600" title="Reload">
            <lucide_react_1.RefreshCw className={"w-5 h-5 ".concat(loading ? 'animate-spin' : '')}/>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (<div className="bg-red-50 text-red-700 p-3 rounded-md flex items-center gap-2 text-sm border border-red-200">
          <lucide_react_1.AlertTriangle className="w-4 h-4"/> {error}
        </div>)}
      {message && (<div className={"p-3 rounded-md flex items-center gap-2 text-sm border ".concat(message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200')}>
          {message.type === 'success' ? <lucide_react_1.Save className="w-4 h-4"/> : <lucide_react_1.AlertTriangle className="w-4 h-4"/>}
          {message.text}
        </div>)}

      {/* Filter Panel */}
      {showFilter && (<div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            WHERE clause (mock supported: string search)
          </label>
          <div className="flex gap-2">
            <input type="text" className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. status = 'active'" value={filter} onChange={function (e) { return setFilter(e.target.value); }}/>
            <button onClick={handleApplyFilter} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
              Apply
            </button>
            <button onClick={handleClearFilter} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded text-sm hover:bg-slate-50">
              Clear
            </button>
          </div>
        </div>)}

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                {(data === null || data === void 0 ? void 0 : data.data[0]) && Object.keys(data.data[0]).map(function (col) { return (<th key={col} className="px-6 py-3 font-medium whitespace-nowrap">{col}</th>); })}
              </tr>
            </thead>
            <tbody>
              {data === null || data === void 0 ? void 0 : data.data.map(function (row, idx) { return (<tr key={idx} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                  {Object.values(row).map(function (val, cellIdx) { return (<td key={cellIdx} className="px-6 py-3 whitespace-nowrap text-slate-700">
                      {String(val)}
                    </td>); })}
                </tr>); })}
              {(data === null || data === void 0 ? void 0 : data.data.length) === 0 && (<tr>
                  <td colSpan={100} className="px-6 py-12 text-center text-slate-400">
                    No data found
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total_rows > 0 && (<div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
            <span className="text-xs text-slate-500">
              Showing {((page - 1) * types_1.PAGE_SIZE) + 1} to {Math.min(page * types_1.PAGE_SIZE, data.total_rows)} of {data.total_rows} entries
            </span>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={function () { return setPage(1); }} className="p-1 rounded hover:bg-white disabled:opacity-30">
                <lucide_react_1.ChevronsLeft className="w-5 h-5 text-slate-600"/>
              </button>
              <button disabled={page === 1} onClick={function () { return setPage(function (p) { return p - 1; }); }} className="p-1 rounded hover:bg-white disabled:opacity-30">
                <lucide_react_1.ChevronLeft className="w-5 h-5 text-slate-600"/>
              </button>
              <span className="px-3 py-1 text-xs font-medium text-slate-700 bg-white rounded border border-slate-200">
                {page} / {data.total_pages}
              </span>
              <button disabled={page >= data.total_pages} onClick={function () { return setPage(function (p) { return p + 1; }); }} className="p-1 rounded hover:bg-white disabled:opacity-30">
                <lucide_react_1.ChevronRight className="w-5 h-5 text-slate-600"/>
              </button>
              <button disabled={page >= data.total_pages} onClick={function () { return setPage(data.total_pages); }} className="p-1 rounded hover:bg-white disabled:opacity-30">
                <lucide_react_1.ChevronsRight className="w-5 h-5 text-slate-600"/>
              </button>
            </div>
          </div>)}
      </div>

      {/* Actions / Export / Import */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export Section */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <lucide_react_1.Download className="w-4 h-4"/> Export
          </h3>
          <button onClick={handleDownload} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors">
            Download CSV
          </button>
        </div>

        {/* Import Section (Write access only) */}
        {hasWriteAccess && (<div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <lucide_react_1.Upload className="w-4 h-4"/> Import CSV
            </h3>
            {!importMode ? (<button onClick={function () { return setImportMode(true); }} className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors">
                Replace Table Data
              </button>) : (<div className="space-y-2">
                <div className="p-3 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-200">
                  Warning: This will replace all data in the table.
                </div>
                <label className="block w-full text-sm text-slate-500 cursor-pointer">
                  <input type="file" accept=".csv" onChange={handleImport} className="block w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                </label>
                <button onClick={function () { return setImportMode(false); }} className="text-xs text-slate-500 hover:underline w-full text-center">
                  Cancel
                </button>
              </div>)}
          </div>)}
        {!hasWriteAccess && (<div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-500">
            Read-only access
          </div>)}
      </div>
    </div>);
};
exports.DataBrowser = DataBrowser;
