import pb from '@/lib/pocketbaseClient';
import { countryName } from '@/lib/countries';

export const FULFILLMENT_METHODS = [
    { value: 'ship', label: 'Ship to my address', hint: 'Delivered to the address you provide.' },
    { value: 'distributor_collection', label: 'Collect from country distributor', hint: 'Pick up from your local King Dawie distributor.' },
];

export const fulfillmentLabel = (value) =>
    FULFILLMENT_METHODS.find((m) => m.value === value)?.label || value || '—';

export async function fetchCountryDistributor(countryCode) {
    if (!countryCode || countryCode === 'OTHER') return null;

    try {
        const country = await pb.collection('countries').getFirstListItem(
            `code = "${countryCode}" && (status = "active" || status = "coming_soon")`,
            { expand: 'primary_distributor', requestKey: `dist-country-${countryCode}` },
        );
        const dist = country.expand?.primary_distributor;
        if (dist?.account_type === 'distributor' && dist.approval_status === 'approved') {
            return { country, distributor: dist };
        }
    } catch (_) {
        /* try fallback */
    }

    try {
        const distributor = await pb.collection('users').getFirstListItem(
            `account_type = "distributor" && approval_status = "approved" && assigned_country.code = "${countryCode}"`,
            { expand: 'assigned_country', requestKey: `dist-user-${countryCode}` },
        );
        return {
            country: distributor.expand?.assigned_country || { code: countryCode, name: countryName(countryCode) },
            distributor,
        };
    } catch (_) {
        return null;
    }
}

export function distributorDetails(distributor) {
    if (!distributor) return null;
    return {
        id: distributor.id,
        name: distributor.name || distributor.organisation || 'Local distributor',
        organisation: distributor.organisation || '',
        phone: distributor.phone || '',
        territory: distributor.territory || '',
        email: distributor.email || '',
        address: distributor.collection_address || '',
        hours: distributor.collection_hours || '',
    };
}
