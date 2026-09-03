import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SubscriberDashboard from '@/components/dashboard/SubscriberDashboard';
import DistributorDashboard from '@/components/dashboard/DistributorDashboard';
import SponsorDashboard from '@/components/dashboard/SponsorDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import { staffRoleOf, accountTypeOf } from '@/lib/accounts';

const DashboardPage = () => {
    const { user } = useAuth();

    // Fail-closed: only a recognized staff role may reach the admin dashboard.
    // A plain account_type === 'admin' WITHOUT a known staff role is NOT admin.
    // The decision is made synchronously from the user record's staff_role so the
    // rendered dashboard never flips after an async role lookup resolves.
    const role = staffRoleOf(user);

    if (role) return <AdminDashboard role={role} />;
    if (accountTypeOf(user) === 'distributor') return <DistributorDashboard />;
    if (accountTypeOf(user) === 'sponsor') return <SponsorDashboard />;

    return <SubscriberDashboard />;
};

export default DashboardPage;
