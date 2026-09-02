import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { crudController, registerCrudRoutes } from '../controllers/crud.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const adminOnly = [requireAuth, requireRole('super_admin', 'inventory_manager', 'sales_manager')];

const controller = crudController(prisma.news, {
	modelName: 'news',
	publicList: true,
	publicGet: true,
	createGuard: adminOnly,
	updateGuard: adminOnly,
	deleteGuard: adminOnly,
	searchable: ['title', 'category'],
	orderBy: { published: 'desc' },
});

const router = Router();
registerCrudRoutes(router, controller);
export default router;
