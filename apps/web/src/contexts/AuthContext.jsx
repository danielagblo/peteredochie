import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { api, authStore } from '@/lib/api';
import { accountTypeOf } from '@/lib/accounts';
import { claimGuestOrders } from '@/lib/commerce';

const AuthContext = createContext(null);

const EPHEMERAL_KEY = 'pel_auth_ephemeral';
const TAB_KEY = 'pel_auth_tab';

const claimOrdersQuietly = async () => {
    try {
        await claimGuestOrders();
    } catch (_) {
        /* best-effort — dashboard still works for owned orders */
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(authStore.record);
    const [employeeRole, setEmployeeRole] = useState(null);

    useEffect(() => {
        try {
            if (window.localStorage.getItem(EPHEMERAL_KEY) === '1' && window.sessionStorage.getItem(TAB_KEY) !== '1') {
                window.localStorage.removeItem(EPHEMERAL_KEY);
                authStore.clear();
            }
        } catch (_) {
            /* storage unavailable */
        }
    }, []);

    useEffect(() => authStore.onChange((_token, record) => setUser(record)), []);

    // Load the signed-in user's staff role (if any) from employee_roles.
    useEffect(() => {
        const id = authStore.record?.id;
        if (!id) {
            setEmployeeRole(null);
            return;
        }
        api.get(`/employee-roles?userId=${encodeURIComponent(id)}`)
            .then((r) => setEmployeeRole(r?.items?.[0]?.role || null))
            .catch(() => setEmployeeRole(null));
        claimOrdersQuietly();
    }, [user]);

    const login = useCallback(async (email, password, remember = true) => {
        const data = await api.post('/auth/login', { email, password });
        authStore.set(data.token, data.user);
        try {
            if (remember) {
                window.localStorage.removeItem(EPHEMERAL_KEY);
            } else {
                window.localStorage.setItem(EPHEMERAL_KEY, '1');
                window.sessionStorage.setItem(TAB_KEY, '1');
            }
        } catch (_) {
            /* storage unavailable */
        }
        await claimOrdersQuietly();
        return { record: data.user, token: data.token };
    }, []);

    const signup = useCallback(
        async (email, password, extraFields = {}) => {
            await api.post('/auth/register', { email, password, ...extraFields });
            const result = await login(email, password, true);
            return result;
        },
        [login],
    );

    const refresh = useCallback(async () => {
        if (!authStore.isValid) return null;
        try {
            return await api.get('/auth/me');
        } catch (_) {
            return null;
        }
    }, []);

    const value = useMemo(
        () => ({
            user,
            isAuthed: authStore.isValid,
            accountType: accountTypeOf(user),
            isVerified: !!user?.verified,
            employeeRole,
            isStaff: !!employeeRole || accountTypeOf(user) === 'admin',
            login,
            signup,
            refresh,
            requestVerification: () => api.post('/auth/request-verification'),
            resetPassword: (email) => api.post('/auth/request-password-reset', { email }),
            logout: () => {
                try {
                    window.localStorage.removeItem(EPHEMERAL_KEY);
                } catch (_) {
                    /* storage unavailable */
                }
                authStore.clear();
            },
        }),
        [user, employeeRole, login, signup, refresh],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
