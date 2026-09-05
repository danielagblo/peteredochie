import apiServerClient from '@/lib/apiServerClient';
import { authStore } from '@/lib/api';

const authHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    if (authStore.token) {
        headers.Authorization = authStore.token;
    }
    return headers;
};

// Format a USD amount stored as a major-unit number.
export const formatUSD = (n) => {
    const v = Number(n) || 0;
    return v > 0 ? `USD ${v.toFixed(2)}` : 'TBD';
};

// Is this product fulfilled off-platform (Amazon redirect)?
export const isRedirectOnly = (product) => !!product?.external_url;

// Is this product purchasable on-platform right now?
export const isPurchasable = (product) => {
    if (!product) return false;
    if (!product.enabled) return false;
    if (isRedirectOnly(product)) return false;
    if (product.status === 'unavailable') return false;
    // Main-order products require the admin to explicitly enable main order.
    if (product.status === 'main_order' && !product.main_order_enabled) return false;
    return true;
};

export const paystackStatus = async () => {
    try {
        const res = await apiServerClient.fetch('/paystack/status');
        const data = await res.json();
        return !!data?.configured;
    } catch (_) {
        return false;
    }
};

// Authenticated users must verify their email before purchasing. Throws a 403
// so callers can surface the verification notice without hitting the API.
const requireVerified = async () => {
    const record = authStore.record;
    if (record && !record.verified) {
        const err = new Error('Please verify your email address before completing this purchase.');
        err.status = 403;
        err.verificationRequired = true;
        throw err;
    }
};

// Create a pending Meet & Greet ticket + start a Paystack transaction.
// Returns { configured, authorization_url, reference, ticket_id, confirmation_code }
// or { configured: false, ticket_id, reference, confirmation_code } when Paystack
// is not set up yet.
export const initializeTicket = async (payload) => {
    await requireVerified();
    const res = await apiServerClient.fetch('/paystack/tickets/initialize', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok && data?.configured !== false) {
        const err = new Error(data?.message || data?.error || 'Could not start ticket checkout.');
        err.payload = data;
        err.status = res.status;
        throw err;
    }
    return data;
};

// Create a pending order + start a Paystack transaction.
// Returns { configured, authorization_url, reference, order_id } or
// { configured: false, order_id, reference } when Paystack is not set up.
// Create a pending order + start a Paystack transaction.
// Returns { configured, authorization_url, reference, order_id } or
// { configured: false, order_id, reference } when Paystack is not set up.
export const initializeOrder = async (payload) => {
    const res = await apiServerClient.fetch('/paystack/initialize', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    // A 503 with configured:false is the expected "Paystack not set up yet"
    // state — the order is still recorded as pending, so treat it as a result.
    if (!res.ok && data?.configured !== false) {
        const err = new Error(data?.message || data?.error || 'Could not start checkout.');
        err.payload = data;
        err.status = res.status;
        throw err;
    }
    return data;
};

// Create a sponsorship application + start a Paystack transaction.
// Returns { configured, authorization_url, reference, sponsorship_id } or
// { configured: false, sponsorship_id, reference } when Paystack is not set up.
export const initializeSponsorship = async (payload) => {
    const res = await apiServerClient.fetch('/paystack/sponsorships/initialize', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok && data?.configured !== false) {
        const err = new Error(data?.message || data?.error || 'Could not start sponsorship checkout.');
        err.payload = data;
        err.status = res.status;
        throw err;
    }
    return data;
};

// Create a distributor bulk order + start a Paystack transaction.
// Returns { configured, authorization_url, reference, order_id } or
// { configured: false, order_id, reference } when Paystack is not set up.
export const initializeDistributorOrder = async (payload) => {
    await requireVerified();
    const res = await apiServerClient.fetch('/paystack/distributors/initialize', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok && data?.configured !== false) {
        const err = new Error(data?.message || data?.error || 'Could not start distributor checkout.');
        err.payload = data;
        err.status = res.status;
        throw err;
    }
    return data;
};

export const verifyOrder = async (reference) => {
    const res = await apiServerClient.fetch(`/paystack/verify?reference=${encodeURIComponent(reference)}`);
    const data = await res.json();
    if (!res.ok) {
        const err = new Error(data?.message || data?.error || 'Could not verify payment.');
        err.payload = data;
        throw err;
    }
    return data;
};

export const claimGuestOrders = async () => {
    const res = await apiServerClient.fetch('/paystack/claim-orders', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(data?.error || 'Could not claim guest orders.');
        err.payload = data;
        throw err;
    }
    return data;
};

export const lookupGuestOrder = async (reference, email) => {
    const qs = `reference=${encodeURIComponent(reference)}&email=${encodeURIComponent(email)}`;
    const res = await apiServerClient.fetch(`/paystack/lookup?${qs}`);
    const data = await res.json();
    if (!res.ok) {
        const err = new Error(data?.error || 'Could not find that order.');
        err.payload = data;
        throw err;
    }
    return data;
};
