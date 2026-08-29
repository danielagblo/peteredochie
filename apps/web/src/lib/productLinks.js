/** Public order URL for a product (used in admin QR codes). */
export function productOrderUrl(productId, productType = 'book', origin) {
    const base = (origin || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');
    if (productType === 'merchandise') return `${base}/shop/item/${productId}`;
    return `${base}/book/item/${productId}`;
}
