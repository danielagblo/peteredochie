import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { crudController, registerCrudRoutes } from '../controllers/crud.js';
import { requireAuth } from '../middleware/auth.js';

const controller = crudController(prisma.region, {
	modelName: 'region',
	publicList: true,
	publicGet: true,
	createGuard: requireAuth,
	updateGuard: requireAuth,
	deleteGuard: requireAuth,
	include: { country: true },
});

const router = Router();
registerCrudRoutes(router, controller);
export default router;
