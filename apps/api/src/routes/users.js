import { Router } from 'express';
import prisma from '../utils/prisma.js';
import bcrypt from 'bcryptjs';
import { crudController, registerCrudRoutes } from '../controllers/crud.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import { sendSms } from '../utils/sms.js';
import { sendEmail } from '../utils/email.js';

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
		const isPrivilegedStaff = ['super_admin', 'sales_manager', 'inventory_manager', 'fulfillment_officer', 'country_manager', 'sponsorship_manager'].includes(req.employeeRole);
		if (!isPrivilegedStaff) {
			// Non-staff users cannot change protected fields (role, approvalStatus, accountType)
			// and can only edit their own profile.
			for (const key of PROTECTED_FIELDS) delete data[key];
			if (req.user && req.params.id !== req.user.id) {
				throw Object.assign(new Error('Not allowed'), { status: 403 });
			}
		} else if (req.employeeRole !== 'super_admin') {
			// Staff managers can update approval status, but only super_admin can change staffRole
			delete data.staffRole;
		}
		if (data.password) {
			data.passwordHash = await bcrypt.hash(String(data.password), 10);
			delete data.password;
		}
		return data;
	},
	// 3. Send SMS & Email when a distributor or sponsor application is approved
	postUpdate: async (req, updatedUser, incomingData) => {
		const status = incomingData?.approvalStatus || incomingData?.approval_status;
		if (status === 'approved') {
			const typeLabel = updatedUser.accountType === 'distributor' ? 'Distributor' : updatedUser.accountType === 'sponsor' ? 'Sponsor' : 'Member';
			
			if (updatedUser.phone) {
				logger.info(`[approval] Dispatching SMS to ${updatedUser.phone} for user ${updatedUser.id}`);
				try {
					const smsRes = await sendSms({
						to: updatedUser.phone,
						message: `Pete Edochie Legacy: Congratulations! Your ${typeLabel} account has been approved by King Dawie Publishing. Log in at peteredochie.com/dashboard to access trade pricing and tools.`,
					});
					logger.info('[approval sms result]', JSON.stringify(smsRes));
				} catch (err) {
					logger.error('[approval sms failed]', err.message);
				}
			} else {
				logger.warn(`[approval] User ${updatedUser.id} (${updatedUser.email}) has no phone number on file. SMS skipped.`);
			}

			if (updatedUser.email) {
				logger.info(`[approval] Dispatching email to ${updatedUser.email}`);
				try {
					await sendEmail({
						to: updatedUser.email,
						subject: `Your ${typeLabel} Account Has Been Approved — The Pete Edochie Legacy`,
						text: `Congratulations! Your ${typeLabel} account has been approved by King Dawie Publishing. Log in at https://peteredochie.com/dashboard to access your portal.`,
						html: `<p>Congratulations! Your <strong>${typeLabel}</strong> account has been approved by King Dawie Publishing.</p><p><a href="https://peteredochie.com/dashboard">Click here to access your dashboard</a>.</p>`,
					});
					logger.info(`[approval email sent] to=${updatedUser.email}`);
				} catch (err) {
					logger.error('[approval email failed]', err.message);
				}
			}
		}
	},
});

const router = Router();
registerCrudRoutes(router, controller);

export default router;
