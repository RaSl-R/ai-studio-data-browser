import React, { useState } from 'react';
import Auth from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { User } from './types';
import { db } from './services/db';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
  };

  const handleLogout = () => {
    db.logout();
    setUser(null);
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
};

export default App;
