import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { crudController, registerCrudRoutes } from '../controllers/crud.js';
import { requireAuth } from '../middleware/auth.js';

const controller = crudController(prisma.orderItem, {
	modelName: 'orderItem',
	publicList: false,
	publicGet: false,
	listGuard: requireAuth,
	createGuard: requireAuth,
	updateGuard: requireAuth,
	deleteGuard: requireAuth,
	orderBy: { createdAt: 'asc' },
	include: { product: { select: { id: true, name: true } } },
});

const router = Router();
registerCrudRoutes(router, controller);
export default router;
