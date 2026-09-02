import { Router } from 'express';
import prisma from '../utils/prisma.js';
import bcrypt from 'bcryptjs';
import { crudController, registerCrudRoutes } from '../controllers/crud.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';

const STAFF_ROLES = [
	'super_admin',
	'inventory_manager',
	'sales_manager',
	'fulfillment_officer',
	'country_manager',
	'sponsorship_manager',
];

// Fields that only a super_admin may set (replaces admin-protection + account-guards).
const PROTECTED_FIELDS = ['staffRole', 'accountType', 'approvalStatus'];

const adminGuard = [requireAuth, requireRole('super_admin', 'inventory_manager', 'sales_manager', 'fulfillment_officer', 'country_manager', 'sponsorship_manager')];

const controller = crudController(prisma.user, {
	modelName: 'user',
	filterVia: { assigned_country: { field: 'assignedCountry' } },
	include: {
		assignedCountry: true,
		employeeRole: true,
	},
	publicList: false,
	publicGet: false,
	listGuard: adminGuard,
	createGuard: adminGuard,
	updateGuard: requireAuth,
	deleteGuard: requireRole('super_admin'),
	searchable: ['email', 'name', 'organisation', 'country'],
	orderBy: { createdAt: 'desc' },
	// Prevents non-super-admins from escalating their own privileges.
	preCreate: async (req, data) => {
		if (req.employeeRole !== 'super_admin') {
			for (const key of PROTECTED_FIELDS) delete data[key];
		}
		if (data.password) {
			data.passwordHash = await bcrypt.hash(String(data.password), 10);
			delete data.password;
		}
		// A new staff member created by a super_admin is auto-approved.
		if (req.employeeRole === 'super_admin' && data.staffRole) {
			if (!data.approvalStatus) data.approvalStatus = 'approved';
		}
		return data;
	},
	preUpdate: async (req, data) => {
		if (req.employeeRole !== 'super_admin') {
			// Non-admins cannot change their own role/approval-status/account-type,
			// and can only edit their own record.
			for (const key of PROTECTED_FIELDS) delete data[key];
			if (req.user && req.params.id !== req.user.id) {
				throw Object.assign(new Error('Not allowed'), { status: 403 });
			}
		}
		if (data.password) {
			data.passwordHash = await bcrypt.hash(String(data.password), 10);
			delete data.password;
		}
		return data;
	},
});

const router = Router();
registerCrudRoutes(router, controller);

export default router;
