import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { crudController, registerCrudRoutes } from '../controllers/crud.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';

const isAdminRole = (role) =>
	['super_admin', 'sales_manager', 'fulfillment_officer', 'country_manager'].includes(role);

const adminOnly = [requireAuth, requireRole('super_admin', 'sales_manager', 'fulfillment_officer', 'country_manager')];

const controller = crudController(prisma.meetAndGreetTicket, {
	modelName: 'meetAndGreetTicket',
	publicList: false,
	publicGet: false,
	listGuard: requireAuth,
	createGuard: optionalAuth,
	updateGuard: adminOnly,
	deleteGuard: adminOnly,
	searchable: ['confirmationCode', 'paymentReference', 'tier'],
	orderBy: { createdAt: 'desc' },
	include: { event: true },
	where: (req) => {
		if (isAdminRole(req.employeeRole)) return undefined;
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
