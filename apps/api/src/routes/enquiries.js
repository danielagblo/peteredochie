import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { crudController, registerCrudRoutes } from '../controllers/crud.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const adminOnly = [requireAuth, requireRole('super_admin')];

// Enquiries are created publicly (contact form), listed/viewed by admins.
const controller = crudController(prisma.enquiry, {
	modelName: 'enquiry',
	publicList: false,
	publicGet: false,
	listGuard: adminOnly,
	createGuard: undefined,
	updateGuard: adminOnly,
	deleteGuard: adminOnly,
	orderBy: { createdAt: 'desc' },
});

const router = Router();
registerCrudRoutes(router, controller);
export default router;
