import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { crudController, registerCrudRoutes } from '../controllers/crud.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const manage = requireRole('super_admin', 'inventory_manager', 'sales_manager');

const adminOnly = [requireAuth, requireRole('super_admin', 'inventory_manager', 'sales_manager')];

const controller = crudController(prisma.product, {
	modelName: 'product',
	publicList: true,
	publicGet: true,
	createGuard: adminOnly,
	updateGuard: adminOnly,
	deleteGuard: adminOnly,
	searchable: ['name', 'category', 'productType'],
	orderBy: { createdAt: 'desc' },
	include: { createdBy: { select: { id: true, name: true, email: true } } },
	preCreate: async (req, data) => {
		if (req.user?.id) data.createdById = req.user.id;
		return data;
	},
});

const router = Router();
registerCrudRoutes(router, controller);
export default router;
