import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { crudController, registerCrudRoutes } from '../controllers/crud.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';

const adminOnly = [requireAuth, requireRole('super_admin', 'country_manager')];

const controller = crudController(prisma.mentorshipApplication, {
	modelName: 'mentorshipApplication',
	publicList: false,
	publicGet: false,
	listGuard: requireAuth,
	createGuard: optionalAuth,
	updateGuard: adminOnly,
	deleteGuard: adminOnly,
	searchable: ['name', 'email', 'discipline', 'country'],
	orderBy: { createdAt: 'desc' },
	where: (req) => {
		if (req.employeeRole === 'super_admin' || req.employeeRole === 'country_manager') return undefined;
		return { ownerId: req.user?.id };
	},
	preCreate: async (req, data) => {
		if (req.user?.id) data.ownerId = req.user.id;
		return data;
	},
});

const router = Router();
registerCrudRoutes(router, controller);
export default router;
