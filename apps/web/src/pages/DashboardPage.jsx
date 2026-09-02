import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SubscriberDashboard from '@/components/dashboard/SubscriberDashboard';
import DistributorDashboard from '@/components/dashboard/DistributorDashboard';
import SponsorDashboard from '@/components/dashboard/SponsorDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import { staffRoleOf, accountTypeOf, isKnownStaffRole } from '@/lib/accounts';

const DashboardPage = () => {
    const { user, employeeRole } = useAuth();

    // Fail-closed: only a recognized staff role may reach the admin dashboard.
    // A plain account_type === 'admin' WITHOUT a known staff role is NOT admin.
    const role = staffRoleOf(user) || (isKnownStaffRole(employeeRole) ? employeeRole : null);

    if (role) return <AdminDashboard role={role} />;
    if (accountTypeOf(user) === 'distributor') return <DistributorDashboard />;
    if (accountTypeOf(user) === 'sponsor') return <SponsorDashboard />;

    return <SubscriberDashboard />;
};

export default DashboardPage;
