import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { crudController, registerCrudRoutes } from '../controllers/crud.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const adminOnly = [requireAuth, requireRole('super_admin', 'sponsorship_manager')];

// Create is authenticated (owner attached), list restricted to owners/admins.
const controller = crudController(prisma.sponsorship, {
	modelName: 'sponsorship',
	publicList: false,
	publicGet: false,
	listGuard: requireAuth,
	createGuard: requireAuth,
	updateGuard: adminOnly,
	deleteGuard: adminOnly,
	searchable: ['companyName', 'contactPerson', 'email'],
	orderBy: { createdAt: 'desc' },
	include: { package: true, owner: { select: { id: true, name: true, email: true } } },
	where: (req) => {
		if (req.employeeRole === 'super_admin' || req.employeeRole === 'sponsorship_manager') {
			return undefined;
		}
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
