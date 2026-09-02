import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { crudController, registerCrudRoutes } from '../controllers/crud.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const adminOnly = [requireAuth, requireRole('super_admin')];

const controller = crudController(prisma.employeeRole, {
	modelName: 'employeeRole',
	publicList: false,
	publicGet: false,
	listGuard: requireAuth,
	createGuard: adminOnly,
	updateGuard: adminOnly,
	deleteGuard: adminOnly,
	include: { user: { select: { id: true, name: true, email: true } } },
});

const router = Router();
registerCrudRoutes(router, controller);
export default router;
