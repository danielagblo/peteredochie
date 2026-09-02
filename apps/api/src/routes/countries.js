import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { crudController, registerCrudRoutes } from '../controllers/crud.js';
import { requireAuth } from '../middleware/auth.js';

const controller = crudController(prisma.country, {
	modelName: 'country',
	publicList: true,
	publicGet: true,
	createGuard: requireAuth,
	updateGuard: requireAuth,
	deleteGuard: requireAuth,
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
