import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const loginDemo = () => {
    localStorage.setItem('isDemo', 'true');
    const demoUser = {
      id: 'demo-user-id',
      name: 'Guest Explorer',
      email: 'guest@demo.com',
      role: 'admin',
    };
    localStorage.setItem('token', 'mock-demo-token');
    localStorage.setItem('user', JSON.stringify(demoUser));
    setUser(demoUser);
    return demoUser;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isDemo');
    setUser(null);
  };

  const can = (action) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'staff') return ['view', 'add', 'distribute'].includes(action);
    if (user.role === 'mess') return ['view', 'add'].includes(action);
    if (user.role === 'viewer') return action === 'view';
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, login, loginDemo, logout, can, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
