import { isIntegrationConfigured } from './integrationConfig.js';
import logger from './logger.js';

// Simple email service. Uses nodemailer when SMTP is configured, otherwise
// logs the email content (dev mode). Replaces PocketBase's mailer hooks.
export const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@peteredochie.com';

export function isEmailConfigured() {
	return isIntegrationConfigured('SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS');
}

export async function sendEmail({ to, subject, html, text }) {
	if (!isEmailConfigured()) {
		logger.info(`[email (dev, not sent)] to=${to} subject="${subject}"`);
		return { dev: true };
	}

	const { default: nodemailer } = await import('nodemailer');

	const transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: Number(process.env.SMTP_PORT) || 587,
		secure: Number(process.env.SMTP_PORT) === 465,
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS,
		},
	});

	const info = await transporter.sendMail({
		from: EMAIL_FROM,
		to,
		subject,
		html,
		text,
	});

	logger.info(`[email sent] to=${to} id=${info.messageId}`);
	return info;
}

export default { sendEmail, isEmailConfigured, EMAIL_FROM };
