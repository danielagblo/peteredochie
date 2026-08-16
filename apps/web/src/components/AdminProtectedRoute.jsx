import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const AdminProtectedRoute = ({ children }) => {
    const { isAuthed, mustChangePassword } = useAdminAuth();
    const location = useLocation();

    if (!isAuthed) {
        const next = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/admin/login?next=${next}`} replace />;
    }

    if (mustChangePassword && location.pathname !== '/admin/dashboard') {
        return <Navigate to="/admin/dashboard" replace />;
    }

    return children;
};

export default AdminProtectedRoute;
