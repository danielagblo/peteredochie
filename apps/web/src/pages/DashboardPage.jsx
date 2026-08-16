import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SubscriberDashboard from '@/components/dashboard/SubscriberDashboard';
import DistributorDashboard from '@/components/dashboard/DistributorDashboard';
import SponsorDashboard from '@/components/dashboard/SponsorDashboard';
import AdminDashboard from '@/components/dashboard/AdminDashboard';

const DashboardPage = () => {
    const { accountType, employeeRole } = useAuth();

    if (accountType === 'admin') return <AdminDashboard role="super_admin" />;
    if (employeeRole) return <AdminDashboard role={employeeRole} />;
    if (accountType === 'distributor') return <DistributorDashboard />;
    if (accountType === 'sponsor') return <SponsorDashboard />;

    return <SubscriberDashboard />;
};

export default DashboardPage;
