import { isIntegrationConfigured } from './integrationConfig.js';
import logger from './logger.js';

// Simple email service. Uses the Gmail REST API (OAuth2 + googleapis) when
// GMAIL_CLIENT_ID / SECRET / REFRESH_TOKEN are set — this sends over HTTPS and
// therefore bypasses the outbound SMTP port blocking on Railway. Falls back to
// a generic SMTP transport when Gmail API is not configured, and logs the email
// content (dev mode) when neither is configured. Replaces PocketBase's mailer.
export const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@peteredochie.com';

// Gmail API is configured with OAuth2 client id/secret + refresh token.
export function isGmailConfigured() {
	return isIntegrationConfigured('GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN');
}

// Legacy generic SMTP config (used only if Gmail API is not set).
export function isSmtpConfigured() {
	return isIntegrationConfigured('SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS');
}

export function isEmailConfigured() {
	return isGmailConfigured() || isSmtpConfigured();
}

// Build the message with nodemailer's MailComposer, then send it through the
// Gmail API as a base64url-encoded RFC 822 / MIME message (over HTTPS, no SMTP).
async function sendViaGmailApi({ to, from, replyTo, subject, text, html, attachments }) {
	const { google } = await import('googleapis');
	const { default: MailComposer } = await import('nodemailer/lib/mail-composer');

	const clientId = process.env.GMAIL_CLIENT_ID;
	const clientSecret = process.env.GMAIL_CLIENT_SECRET;
	const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
	const user = process.env.GMAIL_USER || 'me';

	if (!clientId || !clientSecret || !refreshToken) {
		throw new Error('Missing required Gmail API credentials in environment.');
	}

	const oAuth2Client = new google.auth.OAuth2(
		clientId,
		clientSecret,
		'https://developers.google.com/oauthplayground'
	);
	oAuth2Client.setCredentials({ refresh_token: refreshToken });

	const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

	const mail = new MailComposer({ to, from, replyTo, subject, text, html, attachments });
	const messageBuffer = await mail.compile().build();

	// The Gmail API requires base64url encoding.
	const encodedMessage = Buffer.from(messageBuffer)
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');

	return gmail.users.messages.send({
		userId: user,
		requestBody: { raw: encodedMessage },
	});
}

export async function sendEmail({ to, subject, html, text }) {
	if (!isEmailConfigured()) {
		logger.info(`[email (dev, not sent)] to=${to} subject="${subject}"`);
		return { dev: true };
	}

	if (isGmailConfigured()) {
		try {
			const res = await sendViaGmailApi({
				to,
				from: EMAIL_FROM,
				subject,
				html,
				text,
			});
			logger.info(`[email sent (gmail api)] to=${to} id=${res.data?.id}`);
			return res.data;
		} catch (err) {
			logger.error('[email gmail api failed]', err.message);
			throw err;
		}
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

	logger.info(`[email sent (smtp)] to=${to} id=${info.messageId}`);
	return info;
}

export default { sendEmail, isEmailConfigured, isGmailConfigured, isSmtpConfigured, EMAIL_FROM };
