// Static country + region reference used by the checkout form and shop.
// Mirrors the PocketBase `countries` / `regions` collections (seeded with
// Ghana + Nigeria) but kept client-side so the checkout dropdowns always
// render even before the collections load. `zip` marks countries where a
// postal code is compulsory; for others it is optional.

export const COUNTRIES = [
    {
        code: 'GH',
        name: 'Ghana',
        currency: 'GHS',
        zip: false,
        regions: [
            'Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central',
            'Northern', 'Volta', 'Bono', 'Ahafo', 'Oti', 'Western North',
            'North East', 'Savannah', 'Upper East', 'Upper West', 'Bono East',
        ],
    },
    {
        code: 'NG',
        name: 'Nigeria',
        currency: 'NGN',
        zip: true,
        regions: [
            'Lagos', 'Federal Capital Territory', 'Enugu', 'Anambra', 'Rivers',
            'Kaduna', 'Kano', 'Oyo', 'Delta', 'Edo', 'Imo', 'Abia', 'Cross River',
            'Akwa Ibom', 'Ogun', 'Ondo', 'Ekiti', 'Kwara', 'Osun', 'Bayelsa',
            'Ebonyi', 'Nasarawa', 'Plateau', 'Benue', 'Kogi', 'Niger', 'Sokoto',
            'Kebbi', 'Jigawa', 'Yobe', 'Borno', 'Bauchi', 'Gombe', 'Taraba',
            'Adamawa', 'Zamfara', 'Katsina',
        ],
    },
    { code: 'US', name: 'United States', currency: 'USD', zip: true, regions: [] },
    { code: 'GB', name: 'United Kingdom', currency: 'GBP', zip: true, regions: [] },
    { code: 'CA', name: 'Canada', currency: 'CAD', zip: true, regions: [] },
    { code: 'ZA', name: 'South Africa', currency: 'ZAR', zip: true, regions: [] },
    { code: 'KE', name: 'Kenya', currency: 'KES', zip: false, regions: [] },
    { code: 'AE', name: 'United Arab Emirates', currency: 'AED', zip: false, regions: [] },
    { code: 'AU', name: 'Australia', currency: 'AUD', zip: true, regions: [] },
    { code: 'DE', name: 'Germany', currency: 'EUR', zip: true, regions: [] },
    { code: 'FR', name: 'France', currency: 'EUR', zip: true, regions: [] },
    { code: 'OTHER', name: 'Other / Not listed', currency: 'USD', zip: false, regions: [] },
];

export const COUNTRY_BY_CODE = COUNTRIES.reduce((acc, c) => ({ ...acc, [c.code]: c }), {});

export const countryName = (code) => COUNTRY_BY_CODE[code]?.name || code || '';

export const regionsFor = (code) => COUNTRY_BY_CODE[code]?.regions || [];

export const zipRequired = (code) => !!COUNTRY_BY_CODE[code]?.zip;

export const currencyFor = (code) => COUNTRY_BY_CODE[code]?.currency || 'USD';
