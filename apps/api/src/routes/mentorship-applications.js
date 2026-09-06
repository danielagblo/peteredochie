import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { crudController, registerCrudRoutes } from '../controllers/crud.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import { sendSms } from '../utils/sms.js';
import { sendEmail } from '../utils/email.js';
import logger from '../utils/logger.js';

const adminOnly = [requireAuth, requireRole('super_admin', 'country_manager')];

const controller = crudController(prisma.mentorshipApplication, {
	modelName: 'mentorshipApplication',
	publicList: false,
	publicGet: false,
	listGuard: requireAuth,
	createGuard: optionalAuth,
	updateGuard: adminOnly,
	deleteGuard: adminOnly,
	searchable: ['name', 'email', 'discipline', 'country'],
	orderBy: { createdAt: 'desc' },
	include: { owner: { select: { id: true, name: true, email: true, phone: true } } },
	where: (req) => {
		if (req.employeeRole === 'super_admin' || req.employeeRole === 'country_manager') return undefined;
		return { ownerId: req.user?.id };
	},
	preCreate: async (req, data) => {
		if (req.user?.id) data.ownerId = req.user.id;
		return data;
	},
	postUpdate: async (req, updatedApp, incomingData) => {
		const status = incomingData?.status;
		if (status === 'accepted') {
			const recipientPhone = updatedApp.owner?.phone;
			const recipientEmail = updatedApp.email || updatedApp.owner?.email;
			const name = updatedApp.name || 'Applicant';
			const tier = (updatedApp.registrationType || updatedApp.requestedType || 'Mentorship').toUpperCase();

			if (recipientPhone) {
				logger.info(`[mentorship acceptance] Dispatching SMS to ${recipientPhone}`);
				try {
					const smsRes = await sendSms({
						to: recipientPhone,
						message: `Peter Edochie Legacy: Congratulations ${name}! Your Mentorship application (${tier} tier) has been accepted. Access programme materials at peteredochie.com/mentorship`,
					});
					logger.info('[mentorship sms result]', JSON.stringify(smsRes));
				} catch (err) {
					logger.error('[mentorship sms failed]', err.message);
				}
			}

			if (recipientEmail) {
				try {
					await sendEmail({
						to: recipientEmail,
						subject: `Mentorship Application Accepted — The Peter Edochie Legacy`,
						text: `Congratulations ${name}! Your application for the Peter Edochie Mentorship Programme (${tier} tier) has been accepted. Access your programme materials at https://peteredochie.com/mentorship`,
						html: `<p>Congratulations <strong>${name}</strong>!</p><p>Your application for the <strong>Peter Edochie Mentorship Programme</strong> (${tier} tier) has been accepted.</p><p><a href="https://peteredochie.com/mentorship">Click here to access programme materials and your cohort schedule</a>.</p>`,
					});
					logger.info(`[mentorship email sent] to=${recipientEmail}`);
				} catch (err) {
					logger.error('[mentorship email failed]', err.message);
				}
			}
		}
	},
});

const router = Router();
registerCrudRoutes(router, controller);
export default router;
