import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { sendEmail, isEmailConfigured, EMAIL_FROM } from '../utils/email.js';
import { renderNewsletterHtml, renderNewsletterText } from '../utils/emailTemplate.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();

// Check SMTP configuration status (admin only)
router.get('/status', requireAuth, requireRole('super_admin'), (req, res) => {
	const configured = isEmailConfigured();
	res.json({
		configured,
		host: process.env.SMTP_HOST || null,
		port: Number(process.env.SMTP_PORT) || 587,
		from: EMAIL_FROM,
		mode: configured ? 'smtp' : 'dev_simulation',
	});
});

// Broadcast or test-send a newsletter campaign (admin only)
router.post('/send', requireAuth, requireRole('super_admin'), async (req, res) => {
	try {
		const {
			subject,
			previewText = '',
			headline = '',
			content,
			ctaText = '',
			ctaUrl = '',
			targetInterest = 'all',
			targetCountry = 'all',
			isTest = false,
			testEmail = '',
		} = req.body || {};

		if (!subject || !content) {
			return res.status(400).json({ error: 'Subject and content are required.' });
		}

		// ─── 1. Test Mode: Send single preview to specified address or admin ───
		if (isTest) {
			const recipient = (testEmail || req.user?.email || '').trim();
			if (!recipient) {
				return res.status(400).json({ error: 'A recipient email is required for test send.' });
			}

			const html = renderNewsletterHtml({
				subject: `[TEST PREVIEW] ${subject}`,
				previewText,
				headline,
				content,
				ctaText,
				ctaUrl,
				recipientName: req.user?.name || 'Admin',
				recipientEmail: recipient,
			});

			const text = renderNewsletterText({
				subject: `[TEST PREVIEW] ${subject}`,
				headline,
				content,
				ctaText,
				ctaUrl,
				recipientName: req.user?.name || 'Admin',
			});

			await sendEmail({
				to: recipient,
				subject: `[TEST] ${subject}`,
				html,
				text,
			});

			return res.json({
				success: true,
				isTest: true,
				recipient,
				configured: isEmailConfigured(),
				mode: isEmailConfigured() ? 'smtp' : 'dev_simulation',
				message: isEmailConfigured()
					? `Test email sent to ${recipient}`
					: `Dev simulation: test email preview logged for ${recipient}`,
			});
		}

		// ─── 2. Broadcast Mode: Send to matched subscribers ───
		const where = {};
		if (targetCountry && targetCountry !== 'all') {
			where.country = targetCountry;
		}

		const allSubscribers = await prisma.subscriber.findMany({
			where,
			select: { id: true, email: true, name: true, country: true, interests: true },
		});

		// Filter by interest if specified
		const recipients = targetInterest && targetInterest !== 'all'
			? allSubscribers.filter((s) => {
				if (!s.interests) return false;
				let list = [];
				if (Array.isArray(s.interests)) list = s.interests;
				else if (typeof s.interests === 'string') {
					try { list = JSON.parse(s.interests); } catch { list = [s.interests]; }
				}
				return Array.isArray(list) && list.includes(targetInterest);
			})
			: allSubscribers;

		if (!recipients.length) {
			return res.status(400).json({
				error: 'No active subscribers match the selected targeting criteria.',
			});
		}

		logger.info(`Starting newsletter broadcast "${subject}" to ${recipients.length} subscriber(s)...`);

		// Record campaign in database
		const campaign = await prisma.newsletterCampaign.create({
			data: {
				subject,
				previewText: previewText || null,
				content,
				targetInterest: targetInterest === 'all' ? null : targetInterest,
				targetCountry: targetCountry === 'all' ? null : targetCountry,
				recipientCount: recipients.length,
				status: 'sent',
				sentById: req.user?.id || null,
			},
		});

		// Send to each subscriber asynchronously (capped batch to avoid socket overflow)
		const configured = isEmailConfigured();
		const BATCH_SIZE = 10;
		for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
			const batch = recipients.slice(i, i + BATCH_SIZE);
			await Promise.all(
				batch.map(async (sub) => {
					try {
						const html = renderNewsletterHtml({
							subject,
							previewText,
							headline,
							content,
							ctaText,
							ctaUrl,
							recipientName: sub.name || '',
							recipientEmail: sub.email,
						});
						const text = renderNewsletterText({
							subject,
							headline,
							content,
							ctaText,
							ctaUrl,
							recipientName: sub.name || '',
						});

						await sendEmail({
							to: sub.email,
							subject,
							html,
							text,
						});
					} catch (subErr) {
						logger.error(`Failed to send newsletter to ${sub.email}:`, subErr.message);
					}
				}),
			);
		}

		res.json({
			success: true,
			campaignId: campaign.id,
			sentCount: recipients.length,
			configured,
			mode: configured ? 'smtp' : 'dev_simulation',
			message: configured
				? `Campaign broadcast successfully to ${recipients.length} subscriber(s).`
				: `Dev simulation: campaign logged for ${recipients.length} subscriber(s). Configure SMTP to send live emails.`,
		});
	} catch (err) {
		logger.error('Newsletter send error:', err);
		res.status(500).json({ error: 'Could not complete newsletter dispatch.' });
	}
});

// List sent campaigns history (admin only)
router.get('/campaigns', requireAuth, requireRole('super_admin'), async (req, res) => {
	try {
		const campaigns = await prisma.newsletterCampaign.findMany({
			orderBy: { createdAt: 'desc' },
			take: 50,
			include: {
				sentBy: {
					select: { id: true, name: true, email: true },
				},
			},
		});

		res.json({
			items: campaigns.map((c) => ({
				id: c.id,
				subject: c.subject,
				preview_text: c.previewText,
				content: c.content,
				target_interest: c.targetInterest,
				target_country: c.targetCountry,
				recipient_count: c.recipientCount,
				status: c.status,
				sent_at: c.sentAt,
				created: c.createdAt,
				sent_by: c.sentBy ? { id: c.sentBy.id, name: c.sentBy.name, email: c.sentBy.email } : null,
			})),
		});
	} catch (err) {
		logger.error('Newsletter campaigns fetch failed:', err);
		res.status(500).json({ error: 'Could not fetch campaigns.' });
	}
});

export default router;
