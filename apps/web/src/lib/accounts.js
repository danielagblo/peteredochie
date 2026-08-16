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

export const dashboardPath = () => '/dashboard';
