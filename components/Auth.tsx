import React, { useState, useEffect } from 'react';
import { db } from '../services/mockDb';
import { User, Group } from '../types';
import { validateEmail, validatePassword, getPasswordStrength } from '../utils';
import { Lock, Mail, UserPlus, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthProps {
    onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const [view, setView] = useState<'login' | 'register' | 'reset'>('login');
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-slate-800 p-6 text-center">
                    <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                        <div className="bg-blue-500 p-1.5 rounded-lg">
                            <Lock className="w-5 h-5 text-white" />
                        </div>
                        Data Browser
                    </h1>
                    <p className="text-slate-400 text-sm mt-2">Secure Database Access</p>
                </div>

                <div className="p-8">
                    {view === 'login' && <LoginForm onLogin={onLogin} onViewChange={setView} />}
                    {view === 'register' && <RegisterForm onViewChange={setView} />}
                    {view === 'reset' && <ResetForm onViewChange={setView} />}
                </div>
            </div>
        </div>
    );
};

const LoginForm: React.FC<{ onLogin: (u: User) => void, onViewChange: (v: any) => void }> = ({ onLogin, onViewChange }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        const user = await db.login(email, password);
        if (user) {
            onLogin(user);
        } else {
            setError("Invalid credentials. Try 'admin@example.com' / 'password'");
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign In</h2>
            
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input 
                        type="email" 
                        className="pl-10 w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                    <input 
                        type="password" 
                        className="pl-10 w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-70"
            >
                {loading ? "Signing in..." : "Sign In"}
            </button>

            <div className="mt-4 flex items-center justify-between text-sm">
                <button type="button" onClick={() => onViewChange('reset')} className="text-blue-600 hover:text-blue-800">
                    Forgot password?
                </button>
                <button type="button" onClick={() => onViewChange('register')} className="text-blue-600 hover:text-blue-800">
                    Create account
                </button>
            </div>
        </form>
    );
};

const RegisterForm: React.FC<{ onViewChange: (v: any) => void }> = ({ onViewChange }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [groupId, setGroupId] = useState<number>(3); // Default to viewer
    const [groups, setGroups] = useState<Group[]>([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        db.getGroups().then(setGroups);
    }, []);

    const strength = getPasswordStrength(password);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) return setError(emailValidation.error!);

        const pwdValidation = validatePassword(password);
        if (!pwdValidation.isValid) return setError(pwdValidation.error!);

        if (password !== confirm) return setError("Passwords do not match.");

        const registered = await db.register(email, groupId);
        if (registered) {
            setSuccess(true);
            setTimeout(() => onViewChange('login'), 2000);
        } else {
            setError("Email already registered.");
        }
    };

    if (success) {
        return (
            <div className="text-center py-8 space-y-4">
                <div className="bg-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Registration Successful!</h3>
                <p className="text-gray-600">Redirecting to login...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Create Account</h2>
            
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                    type="email" 
                    className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                    type="password" 
                    className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                {password && (
                    <div className="mt-1 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full ${strength.color}`} style={{ width: `${(strength.score + 1) * 20}%` }}></div>
                        </div>
                        <span className="text-xs text-gray-500">{strength.label}</span>
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input 
                    type="password" 
                    className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requested Group</label>
                <select 
                    value={groupId}
                    onChange={(e) => setGroupId(Number(e.target.value))}
                    className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                </select>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium">
                Register
            </button>

            <button type="button" onClick={() => onViewChange('login')} className="w-full text-sm text-gray-600 hover:text-gray-900 mt-2">
                Back to Login
            </button>
        </form>
    );
};

const ResetForm: React.FC<{ onViewChange: (v: any) => void }> = ({ onViewChange }) => {
    const [sent, setSent] = useState(false);
    
    const handleReset = (e: React.FormEvent) => {
        e.preventDefault();
        setSent(true);
    };

    if (sent) {
        return (
            <div className="text-center space-y-4">
                <div className="bg-blue-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                    <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">Check your email</h3>
                <p className="text-gray-600 text-sm">We've sent password reset instructions to your email address.</p>
                <button onClick={() => onViewChange('login')} className="text-blue-600 text-sm font-medium hover:underline">Back to Login</button>
            </div>
        );
    }

    return (
        <form onSubmit={handleReset} className="space-y-4">
             <h2 className="text-xl font-semibold text-gray-800 mb-6">Reset Password</h2>
             <p className="text-sm text-gray-600 mb-4">Enter your email address and we'll send you a link to reset your password.</p>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium">
                Send Reset Link
            </button>
            <button type="button" onClick={() => onViewChange('login')} className="w-full text-sm text-gray-600 hover:text-gray-900 mt-2">
                Cancel
            </button>
        </form>
    );
};