import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { crudController, registerCrudRoutes } from '../controllers/crud.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const adminOnly = [requireAuth, requireRole('super_admin', 'country_manager')];

const controller = crudController(prisma.country, {
	modelName: 'country',
	publicList: true,
	publicGet: true,
	createGuard: adminOnly,
	updateGuard: adminOnly,
	deleteGuard: adminOnly,
	searchable: ['name', 'code'],
	orderBy: { name: 'asc' },
	include: {
		primaryDistributor: { select: { id: true, name: true, email: true } },
		regionalCoordinator: { select: { id: true, name: true, email: true } },
	},
});

const router = Router();
registerCrudRoutes(router, controller);
export default router;
