import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, userApi } from '../api/authApi';
import { setUnauthorizedHandler, tokenStorage } from '../api/client';
import { AuthContext } from './useAuth';

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  // true until we know whether a saved token is still valid, so protected pages don't flash the login page
  const [initializing, setInitializing] = useState(() => Boolean(tokenStorage.get()));

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  // Restore the session on page reload by asking the backend who the saved token belongs to
  useEffect(() => {
    if (!tokenStorage.get()) return;
    userApi.getMe()
      .then(setUser)
      .catch(() => logout())
      .finally(() => setInitializing(false));
  }, [logout]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      navigate('/login', { replace: true, state: { notice: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.' } });
    });
    return () => setUnauthorizedHandler(null);
  }, [logout, navigate]);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password });
    tokenStorage.set(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const value = useMemo(
    () => ({ user, setUser, isAuthenticated: Boolean(user), initializing, login, logout }),
    [user, initializing, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

