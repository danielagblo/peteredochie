import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { signToken } from '../utils/token.js';
import logger from '../utils/logger.js';

const STAFF_ROLES = [
	'super_admin',
	'inventory_manager',
	'sales_manager',
	'fulfillment_officer',
	'country_manager',
	'sponsorship_manager',
];

const ACCOUNT_TYPES = ['subscriber', 'distributor', 'sponsor', 'admin'];
const USER_ROLES = ['supporter', 'patron', 'legacy_circle', 'sponsor', 'media', 'admin'];

const CAMEL_TO_SNAKE = {
	accountType: 'account_type',
	approvalStatus: 'approval_status',
	staffRole: 'staff_role',
	staffStatus: 'staff_status',
	lastLogin: 'last_login',
	loginHistory: 'login_history',
	mustChangePassword: 'must_change_password',
	countryAssignment: 'country_assignment',
	assignedCountryId: 'assigned_country',
	collectionAddress: 'collection_address',
	collectionHours: 'collection_hours',
	createdAt: 'created',
	updatedAt: 'updated',
};

// Return the user shaped like the old PocketBase record the frontend expects
// (snake_case fields, plus PB-style `created`/`updated` aliases).
function sanitizeUser(user) {
	if (!user) return null;
	const out = {};
	for (const [key, value] of Object.entries(user)) {
		if (key === 'passwordHash' || key === 'tokenKey') continue;
		out[CAMEL_TO_SNAKE[key] || key] = value;
	}
	if (user.assignedCountry) {
		out.assigned_country = user.assignedCountry;
		delete out.assignedCountry;
		delete out.assigned_country_id;
	}
	return out;
}

export async function register(req, res) {
	const { email, password, name, phone, organisation, country, interests } = req.body || {};

	if (!email || !password) {
		return res.status(422).json({ error: 'Email and password are required.' });
	}
	if (typeof password !== 'string' || password.length < 8) {
		return res.status(422).json({ error: 'Password must be at least 8 characters.' });
	}

	const normalizedEmail = String(email).trim().toLowerCase();

	const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
	if (existing) {
		return res.status(409).json({ error: 'An account with this email already exists.' });
	}

	const passwordHash = await bcrypt.hash(password, 10);

	let user;
	try {
		user = await prisma.user.create({
			data: {
				email: normalizedEmail,
				passwordHash,
				name: name || null,
				phone: phone || null,
				organisation: organisation || null,
				country: country || null,
				interests: interests || undefined,
				approvalStatus: 'not_required',
			},
		});
	} catch (err) {
		logger.error('register create failed', err.message);
		return res.status(500).json({ error: 'Could not create account.' });
	}

	const token = signToken({ id: user.id, email: user.email, role: user.role });

	const loginHistory = user.loginHistory || [];
	await prisma.user.update({
		where: { id: user.id },
		data: {
			lastLogin: new Date(),
			loginHistory: [...loginHistory, { at: new Date().toISOString() }],
		},
	});

	res.status(201).json({ token, user: sanitizeUser(user) });
}

export async function login(req, res) {
	const { email, password } = req.body || {};
	if (!email || !password) {
		return res.status(422).json({ error: 'Email and password are required.' });
	}

	const normalizedEmail = String(email).trim().toLowerCase();
	const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
	if (!user) {
		return res.status(401).json({ error: 'Invalid credentials.' });
	}

	const valid = await bcrypt.compare(password, user.passwordHash);
	if (!valid) {
		return res.status(401).json({ error: 'Invalid credentials.' });
	}

	const token = signToken({ id: user.id, email: user.email, role: user.role });

	const loginHistory = user.loginHistory || [];
	await prisma.user.update({
		where: { id: user.id },
		data: {
			lastLogin: new Date(),
			loginHistory: [...loginHistory, { at: new Date().toISOString() }],
		},
	});

	res.json({ token, user: sanitizeUser(user) });
}

// Current authenticated user.
export async function me(req, res) {
	if (!req.user) {
		return res.status(401).json({ error: 'Authentication required.' });
	}
	res.json({ user: sanitizeUser(req.user) });
}

export async function requestPasswordReset(req, res) {
	const { email } = req.body || {};
	if (!email) {
		return res.status(422).json({ error: 'Email is required.' });
	}

	const normalizedEmail = String(email).trim().toLowerCase();
	const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
	if (!user) {
		// Do not reveal whether the account exists.
		return res.status(200).json({ message: 'If that account exists, a reset link has been sent.' });
	}

	const token = signToken({ id: user.id, purpose: 'password_reset' });

	// TODO: send reset email via email service (Phase 5).
	logger.info(`Password reset requested for ${normalizedEmail}`);

	res.status(200).json({ message: 'If that account exists, a reset link has been sent.', reset_token: token });
}

export async function confirmPasswordReset(req, res) {
	const { token, password } = req.body || {};
	if (!token || !password) {
		return res.status(422).json({ error: 'Token and new password are required.' });
	}
	if (typeof password !== 'string' || password.length < 8) {
		return res.status(422).json({ error: 'Password must be at least 8 characters.' });
	}

	let payload;
	try {
		const { verifyToken } = await import('../utils/token.js');
		payload = verifyToken(token);
	} catch {
		return res.status(401).json({ error: 'Invalid or expired reset token.' });
	}
	if (payload?.purpose !== 'password_reset' || !payload.id) {
		return res.status(401).json({ error: 'Invalid reset token.' });
	}

	const passwordHash = await bcrypt.hash(password, 10);
	await prisma.user.update({
		where: { id: payload.id },
		data: { passwordHash, mustChangePassword: null },
	});

	res.status(200).json({ message: 'Password updated successfully.' });
}

// Authenticated user verifies their current password and sets a new one.
export async function changePassword(req, res) {
	if (!req.user) {
		return res.status(401).json({ error: 'Authentication required.' });
	}
	const { current_password, password } = req.body || {};
	if (typeof password !== 'string' || password.length < 8) {
		return res.status(422).json({ error: 'Your new password must be at least 8 characters.' });
	}
	if (req.body.password !== req.body.password_confirm) {
		return res.status(422).json({ error: 'Your new passwords do not match.' });
	}

	const user = await prisma.user.findUnique({ where: { id: req.user.id } });
	if (!user) {
		return res.status(404).json({ error: 'User not found.' });
	}

	const valid = await bcrypt.compare(current_password || '', user.passwordHash);
	if (!valid) {
		return res.status(400).json({ error: 'Your current password is incorrect.' });
	}

	const passwordHash = await bcrypt.hash(password, 10);
	await prisma.user.update({
		where: { id: user.id },
		data: { passwordHash, mustChangePassword: null },
	});

	res.status(200).json({ message: 'Password updated.' });
}

// Super admin resets any user's password without the old one.
export async function adminSetPassword(req, res) {
	const userId = req.params?.id || req.body?.user_id;
	const { password } = req.body || {};
	if (!userId || !password) {
		return res.status(422).json({ error: 'User id and new password are required.' });
	}
	if (typeof password !== 'string' || password.length < 8) {
		return res.status(422).json({ error: 'Password must be at least 8 characters.' });
	}

	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) {
		return res.status(404).json({ error: 'User not found.' });
	}

	const passwordHash = await bcrypt.hash(password, 10);
	await prisma.user.update({
		where: { id: userId },
		data: { passwordHash, mustChangePassword: null },
	});

	res.status(200).json({ message: 'Password updated.' });
}

export { sanitizeUser };
