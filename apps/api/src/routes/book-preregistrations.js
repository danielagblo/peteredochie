import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { crudController, registerCrudRoutes } from '../controllers/crud.js';
import { requireAuth } from '../middleware/auth.js';

const controller = crudController(prisma.bookPreregistration, {
	modelName: 'bookPreregistration',
	publicList: false,
	publicGet: false,
	listGuard: requireAuth,
	createGuard: undefined,
	updateGuard: requireAuth,
	deleteGuard: requireAuth,
	orderBy: { createdAt: 'desc' },
	include: {
		product: {
			select: { id: true, name: true, edition: true, productType: true },
		},
	},
	searchable: ['fullName', 'email', 'phone', 'city', 'country'],
	preCreate: async (_req, data) => {
		if (data.productId && !data.edition) {
			const product = await prisma.product.findUnique({
				where: { id: data.productId },
				select: { edition: true, name: true },
			});
			if (product) data.edition = product.edition || product.name;
		}
		if (data.quantity == null || data.quantity < 1) data.quantity = 1;
		if (!data.status) data.status = 'pending';
		return data;
	},
});

const router = Router();

router.get('/stats', async (req, res) => {
	try {
		const productId = req.query.product || req.query.product_id;
		const where = {
			status: { not: 'cancelled' },
			...(productId ? { productId: String(productId) } : {}),
		};
		const rows = await prisma.bookPreregistration.findMany({
			where,
			select: { productId: true, quantity: true },
		});
		const byProduct = {};
		let totalCopies = 0;
		let totalRegistrations = 0;
		for (const row of rows) {
			const qty = Number(row.quantity) || 1;
			if (!byProduct[row.productId]) byProduct[row.productId] = { copies: 0, registrations: 0 };
			byProduct[row.productId].copies += qty;
			byProduct[row.productId].registrations += 1;
			totalCopies += qty;
			totalRegistrations += 1;
		}
		res.json({ totalCopies, totalRegistrations, byProduct });
	} catch (_) {
		res.status(500).json({ error: 'Could not load pre-registration stats.' });
	}
});

registerCrudRoutes(router, controller);
export default router;
