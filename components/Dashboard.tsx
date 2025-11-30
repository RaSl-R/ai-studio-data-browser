import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { db } from '../services/mockDb';
import { DataBrowser } from './DataBrowser';
import { Database, Table, User as UserIcon, LogOut, ChevronRight, Menu } from 'lucide-react';

interface DashboardProps {
    user: User;
    onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
    const [schemas, setSchemas] = useState<string[]>([]);
    const [selectedSchema, setSelectedSchema] = useState<string>('');
    const [tables, setTables] = useState<string[]>([]);
    const [selectedTable, setSelectedTable] = useState<string>('');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        db.getAccessibleSchemas(user).then(s => {
            setSchemas(s);
            if (s.length > 0) setSelectedSchema(s[0]);
        });
    }, [user]);

    useEffect(() => {
        if (selectedSchema) {
            db.getTables(selectedSchema).then(t => {
                setTables(t);
                setSelectedTable(t.length > 0 ? t[0] : '');
            });
        }
    }, [selectedSchema]);

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Sidebar Toggle for Mobile */}
            <div className="lg:hidden fixed top-0 left-0 p-4 z-50">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 bg-white rounded shadow text-slate-600">
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Sidebar */}
            <aside 
                className={`
                    fixed lg:static inset-y-0 left-0 w-64 bg-slate-900 text-slate-100 transform transition-transform duration-300 z-40 flex flex-col
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Database className="w-6 h-6 text-blue-400" />
                        Data Browser
                    </h1>
                    <div className="mt-4 flex items-center gap-3 bg-slate-800 p-3 rounded-lg">
                        <div className="bg-slate-700 p-2 rounded-full">
                            <UserIcon className="w-4 h-4 text-slate-300" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{user.email}</p>
                            <p className="text-xs text-slate-400">{user.group_name}</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Schema Selector */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                            Schema
                        </label>
                        <select 
                            value={selectedSchema}
                            onChange={(e) => setSelectedSchema(e.target.value)}
                            className="w-full bg-slate-800 border-none text-slate-200 text-sm rounded focus:ring-1 focus:ring-blue-500 p-2.5"
                        >
                            {schemas.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* Table List */}
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">
                            Tables
                        </label>
                        <div className="space-y-1">
                            {tables.length === 0 && <p className="text-sm text-slate-600 italic px-2">No tables found</p>}
                            {tables.map(table => (
                                <button
                                    key={table}
                                    onClick={() => setSelectedTable(table)}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between group transition-colors ${
                                        selectedTable === table 
                                            ? 'bg-blue-600 text-white shadow-md' 
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Table className="w-4 h-4 opacity-70" />
                                        {table}
                                    </div>
                                    {selectedTable === table && <ChevronRight className="w-3 h-3" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button 
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-400 bg-slate-800 hover:bg-red-900/20 rounded-md transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto h-full w-full">
                <div className="p-6 lg:p-10 max-w-7xl mx-auto pb-20">
                    {selectedSchema && selectedTable ? (
                        <DataBrowser 
                            schemaName={selectedSchema} 
                            tableName={selectedTable} 
                            user={user} 
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                            <Database className="w-16 h-16 mb-4 opacity-20" />
                            <h2 className="text-xl font-medium text-slate-500">Select a schema and table to view data</h2>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};