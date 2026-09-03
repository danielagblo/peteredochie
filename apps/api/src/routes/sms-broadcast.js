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
		const [subscribersCount, distributorsCount, sponsorsCount, allUsersCount] = await Promise.all([
			prisma.subscriber.count({ where: { phone: { not: null } } }),
			prisma.user.count({ where: { accountType: 'distributor', phone: { not: null } } }),
			prisma.user.count({ where: { accountType: 'sponsor', phone: { not: null } } }),
			prisma.user.count({ where: { phone: { not: null } } }),
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
		});
	} catch (err) {
		logger.error('SMS status fetch failed:', err);
		res.status(500).json({ error: 'Could not fetch SMS configuration status.' });
	}
});

// 2. Broadcast or Test-Send an SMS campaign (admin only)
router.post('/send', requireAuth, requireRole('super_admin'), async (req, res) => {
	try {
		const {
			message,
			targetAudience = 'all_subscribers', // 'all_subscribers' | 'distributors' | 'sponsors' | 'all_users'
			targetCountry = 'all',
			isTest = false,
			testPhone = '',
		} = req.body || {};

		const text = String(message || '').trim();
		if (!text) {
			return res.status(400).json({ error: 'SMS message content is required.' });
		}

		// ─── A. Test Send ───
		if (isTest) {
			const recipient = normalizePhoneNumber(testPhone || req.user?.phone || '');
			if (!recipient) {
				return res.status(400).json({ error: 'A valid test phone number is required.' });
			}

			const smsResult = await sendSms({
				to: recipient,
				message: text,
			});

			return res.json({
				success: true,
				isTest: true,
				recipient,
				configured: isArkeselConfigured(),
				mode: isArkeselConfigured() ? 'live_arkesel' : 'dev_simulation',
				message: isArkeselConfigured()
					? `Test SMS dispatched via Arkesel to ${recipient}.`
					: `Dev simulation: test SMS logged for ${recipient}.`,
				smsResult,
			});
		}

		// ─── B. Broadcast to Selected Audience ───
		let recipientPhones = [];

		if (targetAudience === 'all_subscribers') {
			const where = { phone: { not: null } };
			if (targetCountry && targetCountry !== 'all') {
				where.country = targetCountry;
			}
			const subs = await prisma.subscriber.findMany({
				where,
				select: { phone: true },
			});
			recipientPhones = subs.map((s) => s.phone);
		} else if (targetAudience === 'distributors') {
			const where = { accountType: 'distributor', phone: { not: null } };
			if (targetCountry && targetCountry !== 'all') {
				where.country = targetCountry;
			}
			const dists = await prisma.user.findMany({
				where,
				select: { phone: true },
			});
			recipientPhones = dists.map((u) => u.phone);
		} else if (targetAudience === 'sponsors') {
			const where = { accountType: 'sponsor', phone: { not: null } };
			if (targetCountry && targetCountry !== 'all') {
				where.country = targetCountry;
			}
			const sps = await prisma.user.findMany({
				where,
				select: { phone: true },
			});
			recipientPhones = sps.map((u) => u.phone);
		} else if (targetAudience === 'all_users') {
			const where = { phone: { not: null } };
			if (targetCountry && targetCountry !== 'all') {
				where.country = targetCountry;
			}
			const users = await prisma.user.findMany({
				where,
				select: { phone: true },
			});
			recipientPhones = users.map((u) => u.phone);
		}

		// Normalize and deduplicate numbers
		const uniqueRecipients = Array.from(
			new Set(recipientPhones.map(normalizePhoneNumber).filter(Boolean))
		);

		if (uniqueRecipients.length === 0) {
			return res.status(400).json({
				error: 'No valid phone numbers found for the selected audience.',
			});
		}

		logger.info(`Starting SMS broadcast to ${uniqueRecipients.length} phone number(s)...`);

		// Send SMS in batches of 50 to avoid API payload overruns
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
