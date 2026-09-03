import React from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import AdminDashboard from '@/components/dashboard/AdminDashboard';

const AdminPortalPage = () => {
    const { admin, role } = useAdminAuth();
    const effectiveRole = role || admin?.staff_role || admin?.role || 'super_admin';

    return <AdminDashboard role={effectiveRole} />;
};

export default AdminPortalPage;
