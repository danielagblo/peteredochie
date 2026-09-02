import React, {
    createContext,
    useContext,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { api, authStore } from '@/lib/api';

const AdminAuthContext = createContext(null);

const INACTIVITY_MS = 30 * 60 * 1000;
const ADMIN_EPHEMERAL_KEY = 'pel_admin_ephemeral';

export const isAdminRecord = (record) => {
    if (!record) return false;
    if (record.staff_status === 'inactive') return false;
    return record.account_type === 'admin' || !!record.staff_role;
};

export const AdminAuthProvider = ({ children }) => {
    const [adminUser, setAdminUser] = useState(() =>
        isAdminRecord(authStore.record) ? authStore.record : null,
    );
    const [mustChangePassword, setMustChangePassword] = useState(
        () => !!(isAdminRecord(authStore.record) && authStore.record.must_change_password),
    );

    useEffect(
        () =>
            authStore.onChange((_token, record) => {
                if (isAdminRecord(record)) {
                    setAdminUser(record);
                    setMustChangePassword(!!record.must_change_password);
                } else {
                    setAdminUser(null);
                    setMustChangePassword(false);
                }
            }),
        [],
    );

    // Auto-logout after 30 minutes of inactivity.
    useEffect(() => {
        if (!adminUser) return undefined;
        let timer;
        const reset = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                authStore.clear();
                setAdminUser(null);
            }, INACTIVITY_MS);
        };
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        events.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
        reset();
        return () => {
            clearTimeout(timer);
            events.forEach((ev) => window.removeEventListener(ev, reset));
        };
    }, [adminUser]);

    const adminLogin = useCallback(async (email, password, remember = true) => {
        const data = await api.post('/auth/login', { email, password });
        if (!isAdminRecord(data.user)) {
            throw new Error('NOT_ADMIN');
        }
        authStore.set(data.token, data.user);
        try {
            if (remember) {
                window.localStorage.removeItem(ADMIN_EPHEMERAL_KEY);
            } else {
                window.localStorage.setItem(ADMIN_EPHEMERAL_KEY, '1');
            }
        } catch (_) {
            /* storage unavailable */
        }
        // Track login history (best-effort).
        try {
            const prev = Array.isArray(data.user.login_history) ? data.user.login_history : [];
            await api.patch(`/users/${data.user.id}`, {
                last_login: new Date().toISOString(),
                login_history: [...prev, { at: new Date().toISOString() }].slice(-25),
            });
        } catch (_) {
            /* non-critical */
        }
        return { record: data.user, token: data.token };
    }, []);

    const adminLogout = useCallback(() => {
        try {
            window.localStorage.removeItem(ADMIN_EPHEMERAL_KEY);
        } catch (_) {
            /* storage unavailable */
        }
        authStore.clear();
        setAdminUser(null);
    }, []);

    const clearMustChangePassword = useCallback(() => setMustChangePassword(false), []);

    const role =
        adminUser?.staff_role ||
        (adminUser?.account_type === 'admin' ? 'super_admin' : null);

    const value = useMemo(
        () => ({
            adminUser,
            isAuthed: !!adminUser,
            mustChangePassword,
            role,
            isSuperAdmin:
                adminUser?.staff_role === 'super_admin' || adminUser?.account_type === 'admin',
            adminLogin,
            adminLogout,
            clearMustChangePassword,
        }),
        [adminUser, mustChangePassword, role, adminLogin, adminLogout, clearMustChangePassword],
    );

    return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => useContext(AdminAuthContext);

export default AdminAuthContext;
