import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import pb from '@/lib/pocketbaseClient';
import { accountTypeOf } from '@/lib/accounts';

const AuthContext = createContext(null);

const EPHEMERAL_KEY = 'pel_auth_ephemeral';
const TAB_KEY = 'pel_auth_tab';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(pb.authStore.record);
    const [employeeRole, setEmployeeRole] = useState(null);

    useEffect(() => {
        try {
            if (window.localStorage.getItem(EPHEMERAL_KEY) === '1' && window.sessionStorage.getItem(TAB_KEY) !== '1') {
                window.localStorage.removeItem(EPHEMERAL_KEY);
                pb.authStore.clear();
            }
        } catch (_) {
            /* storage unavailable */
        }
    }, []);

    useEffect(() => pb.authStore.onChange((_token, record) => setUser(record)), []);

    // Load the signed-in user's staff role (if any) from employee_roles.
    useEffect(() => {
        const id = pb.authStore.record?.id;
        if (!id) {
            setEmployeeRole(null);
            return;
        }
        pb.collection('employee_roles')
            .getFirstListItem(`user = "${id}"`, { requestKey: `emp-role-${id}` })
            .then((r) => setEmployeeRole(r.role))
            .catch(() => setEmployeeRole(null));
    }, [user]);

    const login = useCallback(async (email, password, remember = true) => {
        const result = await pb.collection('users').authWithPassword(email, password);
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
        return result;
    }, []);

    const signup = useCallback(
        async (email, password, extraFields = {}) => {
            await pb.collection('users').create({ email, password, passwordConfirm: password, ...extraFields });
            const result = await login(email, password, true);
            try {
                await pb.collection('users').requestVerification(email);
            } catch (_) {
                /* verification email is best-effort */
            }
            return result;
        },
        [login],
    );

    const refresh = useCallback(async () => {
        if (!pb.authStore.isValid) return null;
        try {
            return await pb.collection('users').authRefresh();
        } catch (_) {
            return null;
        }
    }, []);

    const value = useMemo(
        () => ({
            user,
            isAuthed: pb.authStore.isValid,
            accountType: accountTypeOf(user),
            isVerified: !!user?.verified,
            employeeRole,
            isStaff: !!employeeRole || accountTypeOf(user) === 'admin',
            login,
            signup,
            refresh,
            requestVerification: (email) => pb.collection('users').requestVerification(email),
            resetPassword: (email) => pb.collection('users').requestPasswordReset(email),
            logout: () => {
                try {
                    window.localStorage.removeItem(EPHEMERAL_KEY);
                } catch (_) {
                    /* storage unavailable */
                }
                pb.authStore.clear();
            },
        }),
        [user, employeeRole, login, signup, refresh],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
