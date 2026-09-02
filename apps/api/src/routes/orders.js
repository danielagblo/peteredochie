import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { crudController, registerCrudRoutes } from '../controllers/crud.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const isAdminRole = (role) =>
	['super_admin', 'sales_manager', 'fulfillment_officer', 'inventory_manager'].includes(role);

const controller = crudController(prisma.order, {
	modelName: 'order',
	publicList: false,
	publicGet: false,
	listGuard: requireAuth,
	createGuard: optionalAuth,
	updateGuard: requireAuth,
	deleteGuard: requireAuth,
	searchable: ['email', 'paymentReference', 'orderStatus', 'paymentStatus'],
	orderBy: { createdAt: 'desc' },
	include: { items: true, distributor: { select: { id: true, name: true, email: true } } },
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
