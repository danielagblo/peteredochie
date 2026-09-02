import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { crudController, registerCrudRoutes } from '../controllers/crud.js';
import { requireAuth } from '../middleware/auth.js';

// Subscribers are created publicly (newsletter), managed by admins.
const controller = crudController(prisma.subscriber, {
	modelName: 'subscriber',
	publicList: false,
	publicGet: false,
	listGuard: requireAuth,
	createGuard: undefined,
	updateGuard: requireAuth,
	deleteGuard: requireAuth,
	searchable: ['email', 'name', 'country'],
	orderBy: { createdAt: 'desc' },
});

const router = Router();

// Graceful public subscriber registration (handles duplicate emails gracefully)
router.post('/', async (req, res, next) => {
	try {
		const { email, name, country, interests } = req.body || {};
		if (!email || typeof email !== 'string' || !email.includes('@')) {
			return res.status(400).json({ error: 'A valid email address is required.' });
		}
		const cleanEmail = email.trim().toLowerCase();

		const existing = await prisma.subscriber.findUnique({
			where: { email: cleanEmail },
		});

		if (existing) {
			const updated = await prisma.subscriber.update({
				where: { email: cleanEmail },
				data: {
					name: name ? String(name).trim() : existing.name,
					country: country ? String(country).trim() : existing.country,
					interests: interests !== undefined ? interests : existing.interests,
				},
			});
			return res.status(200).json({
				id: updated.id,
				email: updated.email,
				name: updated.name,
				country: updated.country,
				interests: updated.interests,
				created: updated.createdAt,
				updated: updated.updatedAt,
				message: 'You are already subscribed to updates.',
				alreadySubscribed: true,
			});
		}

		const created = await prisma.subscriber.create({
			data: {
				email: cleanEmail,
				name: name ? String(name).trim() : null,
				country: country ? String(country).trim() : null,
				interests: interests !== undefined ? interests : ['General newsletter', 'Official announcements'],
			},
		});

		return res.status(201).json({
			id: created.id,
			email: created.email,
			name: created.name,
			country: created.country,
			interests: created.interests,
			created: created.createdAt,
			updated: created.updatedAt,
			message: 'Thank you for subscribing to The Pete Edochie Legacy updates.',
		});
	} catch (err) {
		return next(err);
	}
});

registerCrudRoutes(router, controller);
export default router;
