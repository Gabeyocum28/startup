import React from 'react';
import { api } from './api';

// Holds the logged-in user (or null) and exposes refresh/logout. `loading` is
// true until the first /api/user check completes.
const AuthContext = React.createContext({ user: null, loading: true, refresh: async () => {}, logout: async () => {} });

export function AuthProvider({ children }) {
    const [user, setUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    const refresh = React.useCallback(async () => {
        try {
            setUser(await api('/api/user'));
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = React.useCallback(async () => {
        try { await api('/api/auth/logout', { method: 'DELETE' }); } catch { /* offline */ }
        setUser(null);
    }, []);

    React.useEffect(() => { refresh(); }, [refresh]);

    const value = React.useMemo(() => ({ user, loading, refresh, logout, setUser }), [user, loading, refresh, logout]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return React.useContext(AuthContext);
}
