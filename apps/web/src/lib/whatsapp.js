import { PUBLISHER } from '@/lib/content';

const digits = () => String(PUBLISHER.whatsapp || '').replace(/\D/g, '');

export const whatsappHref = (text = '') => {
    const n = digits();
    const q = text ? `?text=${encodeURIComponent(text)}` : '';
    return `https://wa.me/${n}${q}`;
};

export const openWhatsApp = (text = '') => {
    window.open(whatsappHref(text), '_blank', 'noopener,noreferrer');
};

const line = (label, value) => {
    const v = String(value ?? '').trim();
    return v ? `${label}: ${v}` : '';
};

export const composeWhatsApp = (title, fields = {}, extra = '') => {
    const body = Object.entries(fields)
        .map(([k, v]) => line(k, v))
        .filter(Boolean)
        .join('\n');
    return ['Pete Edochie Legacy', title, '', body, extra ? `\n${extra}` : '']
        .filter((p) => p !== '')
        .join('\n')
        .trim();
};
