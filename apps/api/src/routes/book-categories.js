import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { crudController, registerCrudRoutes } from '../controllers/crud.js';
import { requireAuth } from '../middleware/auth.js';

const controller = crudController(prisma.bookCategory, {
	modelName: 'bookCategory',
	publicList: true,
	publicGet: true,
	listGuard: undefined,
	createGuard: requireAuth,
	updateGuard: requireAuth,
	deleteGuard: requireAuth,
	orderBy: [{ sort: 'asc' }, { name: 'asc' }],
	searchable: ['name', 'slug'],
});

const router = Router();
registerCrudRoutes(router, controller);
export default router;
