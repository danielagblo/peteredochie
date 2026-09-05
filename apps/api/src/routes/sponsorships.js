import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { crudController, registerCrudRoutes } from '../controllers/crud.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { sendSms } from '../utils/sms.js';
import { sendEmail } from '../utils/email.js';
import logger from '../utils/logger.js';

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
	include: { package: true, owner: { select: { id: true, name: true, email: true, phone: true } } },
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
	postUpdate: async (req, updatedSponsorship, incomingData) => {
		const status = incomingData?.status;
		if (status === 'approved') {
			const recipientPhone = updatedSponsorship.phone || updatedSponsorship.owner?.phone;
			const recipientEmail = updatedSponsorship.email || updatedSponsorship.owner?.email;
			const company = updatedSponsorship.companyName || 'Partner';
			const tier = (updatedSponsorship.packageTier || updatedSponsorship.package?.name || 'Sponsorship').toUpperCase();

			if (recipientPhone) {
				logger.info(`[sponsorship approval] Dispatching SMS to ${recipientPhone}`);
				try {
					const smsRes = await sendSms({
						to: recipientPhone,
						message: `Peter Edochie Legacy: Congratulations ${company}! Your ${tier} sponsorship proposal has been approved by King Dawie Publishing. View details in your dashboard: peteredochie.com/dashboard`,
					});
					logger.info('[sponsorship approval sms result]', JSON.stringify(smsRes));
				} catch (err) {
					logger.error('[sponsorship approval sms failed]', err.message);
				}
			}

			if (recipientEmail) {
				try {
					await sendEmail({
						to: recipientEmail,
						subject: `Sponsorship Approved — ${tier} Package | The Peter Edochie Legacy`,
						text: `Congratulations ${company}! Your ${tier} sponsorship has been approved. Access your partner dashboard at https://peteredochie.com/dashboard`,
						html: `<p>Congratulations <strong>${company}</strong>!</p><p>Your <strong>${tier}</strong> sponsorship has been approved by King Dawie Publishing.</p><p><a href="https://peteredochie.com/dashboard">Access your partner portal here</a>.</p>`,
					});
					logger.info(`[sponsorship approval email sent] to=${recipientEmail}`);
				} catch (err) {
					logger.error('[sponsorship approval email failed]', err.message);
				}
			}
		}
	},
});

const router = Router();
registerCrudRoutes(router, controller);
export default router;
