import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { User } from './types';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate checking local storage for session
        const stored = localStorage.getItem('db_user');
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch (e) {
                localStorage.removeItem('db_user');
            }
        }
        setLoading(false);
    }, []);

    const handleLogin = (newUser: User) => {
        setUser(newUser);
        localStorage.setItem('db_user', JSON.stringify(newUser));
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('db_user');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-slate-300 rounded-full"></div>
                    <div className="h-4 bg-slate-300 rounded w-24"></div>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Auth onLogin={handleLogin} />;
    }

    return <Dashboard user={user} onLogout={handleLogout} />;
};

export default App;