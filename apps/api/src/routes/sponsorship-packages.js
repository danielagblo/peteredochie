import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { crudController, registerCrudRoutes } from '../controllers/crud.js';
import { requireAuth } from '../middleware/auth.js';

const controller = crudController(prisma.sponsorshipPackage, {
	modelName: 'sponsorshipPackage',
	publicList: true,
	publicGet: true,
	createGuard: requireAuth,
	updateGuard: requireAuth,
	deleteGuard: requireAuth,
	searchable: ['name', 'tier'],
	orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
});

const router = Router();
registerCrudRoutes(router, controller);
export default router;
