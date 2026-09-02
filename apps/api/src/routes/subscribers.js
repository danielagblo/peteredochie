import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { crudController, registerCrudRoutes } from '../controllers/crud.js';
import { requireAuth } from '../middleware/auth.js';

// Subscribers are created publicly (newsletter), managed by admins.
const controller = crudController(prisma.subscriber, {
	modelName: 'subscriber',
	publicList: false,
	publicGet: false,
	listGuard: requireAuth,
	createGuard: undefined,
	updateGuard: requireAuth,
	deleteGuard: requireAuth,
	searchable: ['email', 'name', 'country'],
	orderBy: { createdAt: 'desc' },
});

const router = Router();
registerCrudRoutes(router, controller);
export default router;
