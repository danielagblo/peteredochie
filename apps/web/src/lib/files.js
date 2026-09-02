// Build a usable URL for an image/file path stored on a record.
// Supports absolute URLs, root-relative paths, and bare filenames.
export function fileUrl(value) {
    if (!value) return '';
    if (typeof value !== 'string') return '';
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith('/')) return value;
    // Bare filename -> served from the backend's public uploads dir.
    return `/hcgi/api/files/${encodeURIComponent(value)}`;
}

export default fileUrl;
