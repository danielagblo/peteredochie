import React, {
    createContext,
    useContext,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import pb from '@/lib/pocketbaseClient';

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
        isAdminRecord(pb.authStore.record) ? pb.authStore.record : null,
    );
    const [mustChangePassword, setMustChangePassword] = useState(
        () => !!(isAdminRecord(pb.authStore.record) && pb.authStore.record.must_change_password),
    );

    useEffect(
        () =>
            pb.authStore.onChange((_token, record) => {
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
                pb.authStore.clear();
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
        const result = await pb.collection('users').authWithPassword(email, password);
        if (!isAdminRecord(result.record)) {
            pb.authStore.clear();
            throw new Error('NOT_ADMIN');
        }
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
            const prev = Array.isArray(result.record.login_history)
                ? result.record.login_history
                : [];
            await pb.collection('users').update(
                result.record.id,
                {
                    last_login: new Date().toISOString(),
                    login_history: [...prev, { at: new Date().toISOString() }].slice(-25),
                },
                { requestKey: `admin-login-${result.record.id}` },
            );
        } catch (_) {
            /* non-critical */
        }
        return result;
    }, []);

    const adminLogout = useCallback(() => {
        try {
            window.localStorage.removeItem(ADMIN_EPHEMERAL_KEY);
        } catch (_) {
            /* storage unavailable */
        }
        pb.authStore.clear();
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
