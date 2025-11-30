import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../services/mockDb';
import { QueryResult, TableInfo, User, PAGE_SIZE } from '../types';
import { validateWhereClause } from '../utils';
import { 
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, 
    Filter, RefreshCw, Save, Download, Upload, AlertTriangle, FileUp 
} from 'lucide-react';

interface DataBrowserProps {
    schemaName: string;
    tableName: string;
    user: User;
}

export const DataBrowser: React.FC<DataBrowserProps> = ({ schemaName, tableName, user }) => {
    const [data, setData] = useState<QueryResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState('');
    const [appliedFilter, setAppliedFilter] = useState('');
    const [page, setPage] = useState(1);
    const [showFilter, setShowFilter] = useState(false);
    const [importMode, setImportMode] = useState(false);
    const [tableInfo, setTableInfo] = useState<TableInfo | null>(null);
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    const hasWriteAccess = db.hasWritePermission(user, schemaName);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            const info = await db.getTableInfo(schemaName, tableName);
            setTableInfo(info);
            const result = await db.getData(schemaName, tableName, page, appliedFilter);
            setData(result);
        } catch (e: any) {
            setError(e.message || "Error loading data");
        } finally {
            setLoading(false);
        }
    }, [schemaName, tableName, page, appliedFilter]);

    useEffect(() => {
        setPage(1);
        setFilter('');
        setAppliedFilter('');
    }, [schemaName, tableName]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleApplyFilter = () => {
        const validation = validateWhereClause(filter);
        if (!validation.isValid) {
            setError(validation.error!);
            return;
        }
        setAppliedFilter(filter);
        setPage(1);
        setError(null);
    };

    const handleClearFilter = () => {
        setFilter('');
        setAppliedFilter('');
        setPage(1);
        setError(null);
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Mock import logic
        setLoading(true);
        setTimeout(async () => {
            // In a real app, parse CSV here using a library like papaparse
            // For demo, we just simulate a success message
            try {
                 setMessage({ type: 'success', text: `Successfully imported data from ${file.name}. (Mock)` });
                 setImportMode(false);
                 loadData();
            } catch (err) {
                 setMessage({ type: 'error', text: "Failed to import CSV." });
            }
            setLoading(false);
        }, 1500);
    };

    const handleDownload = () => {
        if (!data?.data) return;
        const csvContent = "data:text/csv;charset=utf-8," 
            + Object.keys(data.data[0]).join(",") + "\n"
            + data.data.map(row => Object.values(row).join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${tableName}_export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header / Stats */}
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">{schemaName}.{tableName}</h2>
                    <p className="text-xs text-slate-500">
                        {tableInfo?.row_count} rows • {tableInfo?.column_count} columns
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowFilter(!showFilter)} className={`p-2 rounded hover:bg-slate-100 ${showFilter ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`} title="Filter">
                        <Filter className="w-5 h-5" />
                    </button>
                    <button onClick={loadData} className="p-2 rounded hover:bg-slate-100 text-slate-600" title="Reload">
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-center gap-2 text-sm border border-red-200">
                    <AlertTriangle className="w-4 h-4" /> {error}
                </div>
            )}
            {message && (
                <div className={`p-3 rounded-md flex items-center gap-2 text-sm border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {message.type === 'success' ? <Save className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {message.text}
                </div>
            )}

            {/* Filter Panel */}
            {showFilter && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 animate-in slide-in-from-top-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">WHERE clause (mock supported: string search)</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. status = 'active'"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                        <button onClick={handleApplyFilter} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">Apply</button>
                        <button onClick={handleClearFilter} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded text-sm hover:bg-slate-50">Clear</button>
                    </div>
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                            <tr>
                                {data?.data[0] && Object.keys(data.data[0]).map((col) => (
                                    <th key={col} className="px-6 py-3 font-medium whitespace-nowrap">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data?.data.map((row, idx) => (
                                <tr key={idx} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                                    {Object.values(row).map((val: any, cellIdx) => (
                                        <td key={cellIdx} className="px-6 py-3 whitespace-nowrap text-slate-700">
                                            {String(val)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            {data?.data.length === 0 && (
                                <tr>
                                    <td colSpan={100} className="px-6 py-12 text-center text-slate-400">
                                        No data found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {data && data.total_rows > 0 && (
                    <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
                        <span className="text-xs text-slate-500">
                            Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, data.total_rows)} of {data.total_rows} entries
                        </span>
                        <div className="flex gap-1">
                            <button disabled={page === 1} onClick={() => setPage(1)} className="p-1 rounded hover:bg-white disabled:opacity-30"><ChevronsLeft className="w-5 h-5 text-slate-600" /></button>
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1 rounded hover:bg-white disabled:opacity-30"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
                            <span className="px-3 py-1 text-xs font-medium text-slate-700 bg-white rounded border border-slate-200">{page} / {data.total_pages}</span>
                            <button disabled={page >= data.total_pages} onClick={() => setPage(p => p + 1)} className="p-1 rounded hover:bg-white disabled:opacity-30"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
                            <button disabled={page >= data.total_pages} onClick={() => setPage(data.total_pages)} className="p-1 rounded hover:bg-white disabled:opacity-30"><ChevronsRight className="w-5 h-5 text-slate-600" /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* Actions / Export / Import */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Export Section */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                     <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export
                     </h3>
                     <button onClick={handleDownload} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors">
                        Download CSV
                     </button>
                </div>

                {/* Import Section (Write access only) */}
                {hasWriteAccess && (
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
                            <Upload className="w-4 h-4" /> Import CSV
                        </h3>
                        {!importMode ? (
                            <button onClick={() => setImportMode(true)} className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors">
                                Replace Table Data
                            </button>
                        ) : (
                            <div className="space-y-2 animate-in fade-in">
                                <div className="p-3 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-200">
                                    Warning: This will replace all data in the table.
                                </div>
                                <label className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer">
                                    <input type="file" accept=".csv" onChange={handleImport} className="block w-full text-slate-500" />
                                </label>
                                <button onClick={() => setImportMode(false)} className="text-xs text-slate-500 hover:underline w-full text-center">Cancel</button>
                            </div>
                        )}
                    </div>
                )}
                
                {!hasWriteAccess && (
                    <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-500">
                        Read-only access
                    </div>
                )}
            </div>
        </div>
    );
};