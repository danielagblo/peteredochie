import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { crudController, registerCrudRoutes } from '../controllers/crud.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const adminOnly = [requireAuth, requireRole('super_admin', 'sales_manager')];

const controller = crudController(prisma.distributorTier, {
	modelName: 'distributorTier',
	publicList: true,
	publicGet: true,
	createGuard: adminOnly,
	updateGuard: adminOnly,
	deleteGuard: adminOnly,
	searchable: ['name'],
	orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
});

const router = Router();
registerCrudRoutes(router, controller);
export default router;
