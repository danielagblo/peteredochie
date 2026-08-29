export const REGISTRATION_TYPES = [
    { value: 'scholarship', label: 'Scholarship', rank: 1, hint: 'Fully funded place — core cohort materials.' },
    { value: 'standard', label: 'Standard', rank: 2, hint: 'Standard registration — workshops and assignments.' },
    { value: 'patron', label: 'Patron', rank: 3, hint: 'Patron membership — extended sessions and resources.' },
    { value: 'legacy', label: 'Legacy Circle', rank: 4, hint: 'Invitation tier — full archive and private sessions.' },
];

const RANK = Object.fromEntries(REGISTRATION_TYPES.map((t) => [t.value, t.rank]));

export const registrationTypeLabel = (value) =>
    REGISTRATION_TYPES.find((t) => t.value === value)?.label || value || '—';

export const registrationTypeRank = (value) => RANK[value] || 0;

export const canAccessMaterial = (userType, materialType) =>
    registrationTypeRank(userType) >= registrationTypeRank(materialType);

export const effectiveRegistrationType = (application) =>
    application?.registration_type || application?.requested_type || '';
