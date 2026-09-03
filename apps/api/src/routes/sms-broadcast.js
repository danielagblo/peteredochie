import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { sendSms, isArkeselConfigured, normalizePhoneNumber, ARKESEL_SENDER_ID } from '../utils/sms.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

// 1. Get SMS service configuration and audience statistics (admin only)
router.get('/status', requireAuth, requireRole('super_admin'), async (req, res) => {
	try {
		const configured = isArkeselConfigured();

		// Count users with valid phone numbers by group
		const [subscribersCount, distributorsCount, sponsorsCount, allUsersCount, totalSmsLogsCount] = await Promise.all([
			prisma.subscriber.count({ where: { phone: { not: null } } }),
			prisma.user.count({ where: { accountType: 'distributor', phone: { not: null } } }),
			prisma.user.count({ where: { accountType: 'sponsor', phone: { not: null } } }),
			prisma.user.count({ where: { phone: { not: null } } }),
			prisma.smsLog.count(),
		]);

		res.json({
			configured,
			senderId: ARKESEL_SENDER_ID,
			mode: configured ? 'live_arkesel' : 'dev_simulation',
			audience: {
				subscribers: subscribersCount,
				distributors: distributorsCount,
				sponsors: sponsorsCount,
				allUsers: allUsersCount,
			},
			totalLogsCount: totalSmsLogsCount,
		});
	} catch (err) {
		logger.error('SMS status fetch failed:', err);
		res.status(500).json({ error: 'Could not fetch SMS configuration status.' });
	}
});

// 2. Fetch SMS delivery history & logs (admin only)
router.get('/logs', requireAuth, requireRole('super_admin'), async (req, res) => {
	try {
		const logs = await prisma.smsLog.findMany({
			orderBy: { createdAt: 'desc' },
			take: 100,
			include: {
				sentBy: {
					select: { id: true, name: true, email: true },
				},
			},
		});

		res.json({
			items: logs.map((log) => ({
				id: log.id,
				recipient_phone: log.recipientPhone,
				message: log.message,
				sender_id: log.senderId,
				status: log.status,
				context: log.context,
				created_at: log.createdAt,
				sent_by: log.sentBy ? { id: log.sentBy.id, name: log.sentBy.name, email: log.sentBy.email } : null,
			})),
		});
	} catch (err) {
		logger.error('SMS logs fetch failed:', err);
		res.status(500).json({ error: 'Could not fetch SMS logs.' });
	}
});

// 3. Broadcast SMS campaign and record in sms_logs (admin only)
router.post('/send', requireAuth, requireRole('super_admin'), async (req, res) => {
	try {
		const {
			message,
			targetAudience = 'all_users',
			targetCountry = 'all',
			context = 'broadcast',
		} = req.body || {};

		const text = String(message || '').trim();
		if (!text) {
			return res.status(400).json({ error: 'SMS message content is required.' });
		}

		// Fetch all valid phone numbers across users and subscribers
		const [subscribers, users] = await Promise.all([
			prisma.subscriber.findMany({
				where: { phone: { not: null } },
				select: { phone: true },
			}),
			prisma.user.findMany({
				where: { phone: { not: null } },
				select: { phone: true },
			}),
		]);

		const allPhones = [...subscribers.map((s) => s.phone), ...users.map((u) => u.phone)];
		const uniqueRecipients = Array.from(
			new Set(allPhones.map(normalizePhoneNumber).filter(Boolean))
		);

		if (uniqueRecipients.length === 0) {
			return res.status(400).json({
				error: 'No valid phone numbers found in the database.',
			});
		}

		logger.info(`Starting SMS broadcast to ${uniqueRecipients.length} phone number(s)...`);

		// Send SMS in batches of 50
		const BATCH_SIZE = 50;
		let totalSent = 0;
		const configured = isArkeselConfigured();

		for (let i = 0; i < uniqueRecipients.length; i += BATCH_SIZE) {
			const batch = uniqueRecipients.slice(i, i + BATCH_SIZE);
			try {
				await sendSms({
					to: batch,
					message: text,
				});
				totalSent += batch.length;
			} catch (batchErr) {
				logger.error(`SMS batch ${i} failed:`, batchErr.message);
			}
		}

		// Log each sent SMS into sms_logs database table
		await prisma.smsLog.createMany({
			data: uniqueRecipients.map((phone) => ({
				recipientPhone: phone,
				message: text,
				senderId: ARKESEL_SENDER_ID,
				status: 'sent',
				context,
				sentById: req.user?.id || null,
			})),
		});

		res.json({
			success: true,
			sentCount: totalSent,
			configured,
			mode: configured ? 'live_arkesel' : 'dev_simulation',
			message: configured
				? `SMS broadcast dispatched successfully to ${totalSent} recipient(s).`
				: `Dev simulation: SMS broadcast logged for ${totalSent} recipient(s).`,
		});
	} catch (err) {
		logger.error('SMS broadcast error:', err);
		res.status(500).json({ error: 'Could not complete SMS broadcast.' });
	}
});

export default router;
