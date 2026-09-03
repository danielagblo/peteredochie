// REST API client for the Express backend.
// Holds the JWT token in localStorage and exposes a small reactive store
// (onChange) so auth contexts can listen to login/logout changes.

const TOKEN_KEY = 'pel_auth_token';
const USER_KEY = 'pel_auth_user';

const listeners = new Set();

let cachedToken = null;
let cachedUser = null;
try {
	cachedToken = window.localStorage.getItem(TOKEN_KEY);
	const rawUser = window.localStorage.getItem(USER_KEY);
	cachedUser = rawUser ? JSON.parse(rawUser) : null;
} catch {
	cachedToken = null;
	cachedUser = null;
}

function notify(record, token) {
	for (const fn of listeners) fn(token, record);
}

export const authStore = {
	token: cachedToken,
	record: cachedUser,
	isValid: !!cachedToken,
	set(token, record) {
		this.token = token;
		this.record = record ?? null;
		this.isValid = !!token;
		try {
			if (token) window.localStorage.setItem(TOKEN_KEY, token);
			else window.localStorage.removeItem(TOKEN_KEY);
			if (record) window.localStorage.setItem(USER_KEY, JSON.stringify(record));
			else window.localStorage.removeItem(USER_KEY);
		} catch {
			/* storage unavailable */
		}
		notify(this.record, this.token);
	},
	// Update the stored record without changing the token (e.g. profile edit).
	updateRecord(patch) {
		const next = { ...(this.record || {}), ...patch };
		this.record = next;
		try {
			window.localStorage.setItem(USER_KEY, JSON.stringify(next));
		} catch {
			/* storage unavailable */
		}
		notify(this.record, this.token);
	},
	clear() {
		this.set(null, null);
	},
	onChange(fn) {
		listeners.add(fn);
		return () => listeners.delete(fn);
	},
};

// Base URL of the Express API. Same-origin by default for local dev; override
// with VITE_API_URL (e.g. https://api.example.com/hcgi/api) when the API is
// hosted separately from the frontend.
const API_BASE = import.meta.env.VITE_API_URL || '/hcgi/api';

function getToken() {
	return authStore.token;
}

export async function apiFetch(path, options = {}) {
	const { method = 'GET', body, headers = {}, auth = true, raw = false } = options;
	const fetchHeaders = { ...headers };
	if (body && typeof body !== 'string') {
		fetchHeaders['Content-Type'] = 'application/json';
	}
	if (auth && getToken()) {
		fetchHeaders.Authorization = getToken();
	}

	const res = await fetch(API_BASE + path, {
		method,
		headers: fetchHeaders,
		body: typeof body === 'string' ? body : body ? JSON.stringify(body) : undefined,
	});

	if (raw) return res;

	const data = res.status === 204 ? null : await res.json().catch(() => null);
	if (!res.ok) {
		const retryAfter = res.headers.get('Retry-After');
		const seconds = retryAfter ? parseInt(retryAfter, 10) : null;
		const retryHint = seconds ? ` Please wait ${seconds} second${seconds === 1 ? '' : 's'}.` : ' Please wait a moment and try again.';

		if (res.status === 429) {
			try {
				const { toast } = await import('@/hooks/use-toast');
				toast({
					variant: 'destructive',
					title: 'Rate limit reached',
					description: `Too many requests have been made in a short time.${retryHint}`,
				});
			} catch (_) {
				/* ignore toast error if not available */
			}
		}

		const err = new Error(data?.error || data?.message || (res.status === 429 ? `Too many requests.${retryHint}` : `Request failed (${res.status})`));
		err.status = res.status;
		err.payload = data;
		err.retryAfter = seconds;
		if (res.status === 401) authStore.clear();
		throw err;
	}
	return data;
}

// Convenience helpers.
export const api = {
	get: (path) => apiFetch(path, { method: 'GET' }),
	post: (path, body, opts = {}) => apiFetch(path, { ...opts, method: 'POST', body }),
	patch: (path, body, opts = {}) => apiFetch(path, { ...opts, method: 'PATCH', body }),
	put: (path, body, opts = {}) => apiFetch(path, { ...opts, method: 'PUT', body }),
	del: (path) => apiFetch(path, { method: 'DELETE' }),
};

// Build a query string for a PB-style list request.
function buildListQuery({ filter, sort, expand, page, perPage } = {}) {
	const params = new URLSearchParams();
	if (filter) params.set('filter', filter);
	if (sort) params.set('sort', sort);
	if (expand) params.set('expand', expand);
	if (page) params.set('page', page);
	if (perPage) params.set('perPage', perPage);
	const qs = params.toString();
	return qs ? `?${qs}` : '';
}

export const apiCrud = {
	// GET /resource?filter=&sort=&expand=  -> returns full items array
	async list(resource, options = {}) {
		const data = await apiFetch(`/${resource}${buildListQuery(options)}`);
		return data?.items || [];
	},
	// GET /resource/:id (record)
	getOne: (resource, id) => apiFetch(`/${resource}/${id}`),
	create: (resource, body) => apiFetch(`/${resource}`, { method: 'POST', body }),
	update: (resource, id, body) => apiFetch(`/${resource}/${id}`, { method: 'PATCH', body }),
	remove: (resource, id) => apiFetch(`/${resource}/${id}`, { method: 'DELETE' }),
};

export default api;
