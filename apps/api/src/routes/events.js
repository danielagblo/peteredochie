import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { crudController, registerCrudRoutes } from '../controllers/crud.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const admin = requireRole('super_admin', 'inventory_manager', 'sales_manager', 'country_manager');

const adminOnly = [requireAuth, requireRole('super_admin', 'inventory_manager', 'sales_manager', 'country_manager')];

const controller = crudController(prisma.event, {
	modelName: 'event',
	publicList: true,
	publicGet: true,
	createGuard: adminOnly,
	updateGuard: adminOnly,
	deleteGuard: adminOnly,
	searchable: ['title', 'city', 'venue', 'category'],
	orderBy: { starts: 'asc' },
});

const router = Router();
registerCrudRoutes(router, controller);
export default router;
