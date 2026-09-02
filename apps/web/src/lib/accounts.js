export const ACCOUNT_TYPES = [
    {
        value: 'subscriber',
        icon: 'user',
        title: 'General Subscriber',
        description: 'For fans, attendees, supporters and readers.',
        can: [
            'Register for events and purchase tickets',
            'Buy and pre-order books',
            'View purchased tickets and QR passes',
            'Access the members area and downloads',
            'Receive newsletters and manage your profile',
        ],
        note: null,
    },
    {
        value: 'distributor',
        icon: 'truck',
        title: 'Distributor',
        description: 'For book distributors working with King Dawie Publishing.',
        can: [
            'Apply to become an approved distributor',
            'View distributor pricing tiers',
            'Manage assigned territories',
            'View and track distributor orders',
            'Download distributor resources',
        ],
        note: 'Requires admin approval',
    },
    {
        value: 'sponsor',
        icon: 'building',
        title: 'Sponsor / Corporate Partner',
        description: 'For companies interested in sponsorship and partnership.',
        can: [
            'Purchase sponsorship packages',
            'Upload company information and brand assets',
            'Download sponsorship invoices',
            'Track sponsorship status and deliverables',
            'Communicate directly with administrators',
        ],
        note: 'Requires approval',
    },
];

export const ACCOUNT_TYPE_MAP = ACCOUNT_TYPES.reduce((acc, t) => ({ ...acc, [t.value]: t }), {});

export const ACCOUNT_LABEL = {
    subscriber: 'General Subscriber',
    distributor: 'Distributor',
    sponsor: 'Sponsor / Corporate Partner',
    admin: 'Administrator',
};

export const INTEREST_OPTIONS = [
    'Event announcements',
    'Meet & Greet and event updates',
    'Book launch news',
    'Mentorship programme',
    'Future country launches',
    'General newsletter',
];

export const accountTypeOf = (user) => {
    if (!user) return 'subscriber';
    if (user.account_type) return user.account_type;
    if (user.role === 'admin') return 'admin';
    if (user.role === 'sponsor') return 'sponsor';
    return 'subscriber';
};

// The only staff roles recognized by the platform. Anything outside this set is
// treated as NOT a staff member (fail-closed) so unknown/legacy role strings
// can never unlock admin access.
export const KNOWN_STAFF_ROLES = [
    'super_admin',
    'inventory_manager',
    'sales_manager',
    'fulfillment_officer',
    'country_manager',
    'sponsorship_manager',
];

export const STAFF_ROLE_LABEL = {
    super_admin: 'Super Admin',
    inventory_manager: 'Inventory Manager',
    sales_manager: 'Sales Manager',
    fulfillment_officer: 'Fulfillment Officer',
    country_manager: 'Country Manager',
    sponsorship_manager: 'Sponsorship Manager',
};

// Return the user's staff role ONLY if it is a recognized role; otherwise null.
// This deliberately does NOT treat account_type === 'admin' as a staff role, so a
// mismatched/legacy admin account without a real staff role cannot unlock admin UI.
export const staffRoleOf = (user) => {
    const role = user && user.staff_role ? user.staff_role : null;
    return role && KNOWN_STAFF_ROLES.includes(role) ? role : null;
};

export const isKnownStaffRole = (role) =>
    !!role && KNOWN_STAFF_ROLES.includes(role);

export const dashboardPath = () => '/dashboard';
