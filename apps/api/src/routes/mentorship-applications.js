import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { crudController, registerCrudRoutes } from '../controllers/crud.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const controller = crudController(prisma.mentorshipApplication, {
	modelName: 'mentorshipApplication',
	publicList: false,
	publicGet: false,
	listGuard: requireAuth,
	createGuard: optionalAuth,
	updateGuard: requireAuth,
	deleteGuard: requireAuth,
	searchable: ['name', 'email', 'discipline', 'country'],
	orderBy: { createdAt: 'desc' },
	preCreate: async (req, data) => {
		if (req.user?.id) data.ownerId = req.user.id;
		return data;
	},
});

const router = Router();
registerCrudRoutes(router, controller);
export default router;
