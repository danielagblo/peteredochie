import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { crudController, registerCrudRoutes } from '../controllers/crud.js';
import { requireAuth } from '../middleware/auth.js';

// Enquiries are created publicly (contact form), listed/viewed by admins.
const controller = crudController(prisma.enquiry, {
	modelName: 'enquiry',
	publicList: false,
	publicGet: false,
	listGuard: requireAuth,
	createGuard: undefined,
	updateGuard: requireAuth,
	deleteGuard: requireAuth,
	orderBy: { createdAt: 'desc' },
});

const router = Router();
registerCrudRoutes(router, controller);
export default router;
