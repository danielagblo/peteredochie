import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { crudController, registerCrudRoutes } from '../controllers/crud.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const adminOnly = [requireAuth, requireRole('super_admin', 'inventory_manager', 'sales_manager')];

// Stock movements are a read-only audit trail; only admins may read them.
const controller = crudController(prisma.stockMovement, {
	modelName: 'stockMovement',
	publicList: false,
	publicGet: false,
	listGuard: adminOnly,
	createGuard: adminOnly,
	updateGuard: adminOnly,
	deleteGuard: adminOnly,
	orderBy: { createdAt: 'desc' },
	include: { product: { select: { id: true, name: true } }, createdBy: { select: { id: true, name: true } } },
	preCreate: async (req, data) => {
		if (req.user?.id) data.createdById = req.user.id;
		return data;
	},
});

const router = Router();
registerCrudRoutes(router, controller);
export default router;
