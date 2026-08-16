import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = ({ children, redirectTo = '/login', allow }) => {
    const { isAuthed, accountType } = useAuth();
    const location = useLocation();

    if (!isAuthed) {
        const next = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`${redirectTo}?next=${next}`} replace />;
    }

    if (Array.isArray(allow) && allow.length > 0 && !allow.includes(accountType)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default ProtectedRoute;

export { ProtectedRoute };
