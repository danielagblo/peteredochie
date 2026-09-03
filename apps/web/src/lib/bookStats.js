import { api } from '@/lib/api';

/** Public pre-registration stats (no auth). */
export async function fetchBookPreregStats(productId) {
    const qs = productId ? `?product=${encodeURIComponent(productId)}` : '';
    return api.get(`/book-preregistrations/stats${qs}`);
}
