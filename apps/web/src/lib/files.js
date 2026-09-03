// Build a usable URL for an image/file path stored on a record.
// Supports absolute URLs, root-relative paths, and bare filenames.
const API_FILES_BASE = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/files`
    : '/hcgi/api/files';

export function fileUrl(value) {
    if (!value) return '';
    if (typeof value !== 'string') return '';
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith('/')) return value;
    // Bare filename -> served from the backend's public uploads dir.
    return `${API_FILES_BASE}/${encodeURIComponent(value)}`;
}

export default fileUrl;
