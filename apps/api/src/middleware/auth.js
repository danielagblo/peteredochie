import prisma from '../utils/prisma.js';
import { verifyToken } from '../utils/token.js';

// Extract the user id from the request body or the authenticated user.
async function loadUser(token) {
	if (!token) return null;
	let payload;
	try {
		payload = verifyToken(token);
	} catch {
		return null;
	}
	if (!payload?.id) return null;
	return prisma.user.findUnique({ where: { id: payload.id } });
}

export async function requireAuth(req, res, next) {
	try {
		const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
		const user = await loadUser(token);
		if (!user) {
			return res.status(401).json({ error: 'Authentication required.' });
		}
		req.user = user;
		if (user.staffRole) {
			const employeeRole = await prisma.employeeRole.findUnique({
				where: { userId: user.id },
			});
			req.employeeRole = employeeRole?.role || user.staffRole;
		} else {
			req.employeeRole = null;
		}
		next();
	} catch (err) {
		next(err);
	}
}

// Require one of the given staff roles (or super_admin which implies all).
export function requireRole(...roles) {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(401).json({ error: 'Authentication required.' });
		}
		const role = req.employeeRole;
		if (role === 'super_admin' || roles.includes(role)) {
			return next();
		}
		return res.status(403).json({ error: 'You do not have permission to perform this action.' });
	};
}

export function requireSuperAdmin(req, res, next) {
	if (!req.user) {
		return res.status(401).json({ error: 'Authentication required.' });
	}
	if (req.employeeRole !== 'super_admin') {
		return res.status(403).json({ error: 'Super admin access required.' });
	}
	next();
}

// Attach a user from a valid token if present, but do not reject when absent.
// Used for endpoints that allow both guests and authenticated users (e.g. checkout).
export async function optionalAuth(req, res, next) {
	try {
		const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
		req.user = await loadUser(token);
		const user = req.user;
		req.employeeRole = user?.staffRole || null;
		next();
	} catch (err) {
		next(err);
	}
}
