import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { crudController, registerCrudRoutes } from '../controllers/crud.js';
import { requireAuth } from '../middleware/auth.js';

const controller = crudController(prisma.news, {
	modelName: 'news',
	publicList: true,
	publicGet: true,
	createGuard: requireAuth,
	updateGuard: requireAuth,
	deleteGuard: requireAuth,
	searchable: ['title', 'category'],
	orderBy: { published: 'desc' },
});

const router = Router();
registerCrudRoutes(router, controller);
export default router;
