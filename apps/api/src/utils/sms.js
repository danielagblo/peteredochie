import { isIntegrationConfigured } from './integrationConfig.js';
import logger from './logger.js';

// Arkesel SMS API Service.
// API Docs: https://developers.arkesel.com/
// Uses ARKESEL_API_KEY and ARKESEL_SENDER_ID from environment variables.
// Fails gracefully in dev simulation mode when keys are not configured.

export function isArkeselConfigured() {
	return isIntegrationConfigured('ARKESEL_API_KEY');
}

export const ARKESEL_SENDER_ID = process.env.ARKESEL_SENDER_ID || 'PeteEdochie';

/**
 * Format and normalize phone numbers for international SMS delivery.
 * Strips whitespace, brackets, hyphens, and leading '+' or '00'.
 */
export function normalizePhoneNumber(phone) {
	if (!phone) return '';
	let clean = String(phone).trim().replace(/[\s\-()]/g, '');
	if (clean.startsWith('+')) clean = clean.slice(1);
	if (clean.startsWith('00')) clean = clean.slice(2);
	return clean;
}

/**
 * Send an SMS message via Arkesel v2 API.
 * @param {Object} options
 * @param {string|string[]} options.to - Recipient phone number(s)
 * @param {string} options.message - SMS text content
 * @param {string} [options.sender] - Custom Sender ID (max 11 chars)
 */
export async function sendSms({ to, message, sender }) {
	const recipients = (Array.isArray(to) ? to : [to])
		.map(normalizePhoneNumber)
		.filter(Boolean);

	if (recipients.length === 0) {
		logger.warn('[sms skipped] No valid recipient phone number provided.');
		return { skipped: true, reason: 'no_recipients' };
	}

	const senderId = (sender || ARKESEL_SENDER_ID).slice(0, 11);
	const text = String(message || '').trim();

	if (!text) {
		logger.warn('[sms skipped] SMS message content is empty.');
		return { skipped: true, reason: 'empty_message' };
	}

	if (!isArkeselConfigured()) {
		logger.info(`[sms (dev, not sent)] to=${recipients.join(',')} sender="${senderId}" message="${text}"`);
		return { dev: true, recipients, message: text };
	}

	const apiKey = process.env.ARKESEL_API_KEY;

	try {
		const res = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
			method: 'POST',
			headers: {
				'api-key': apiKey,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				sender: senderId,
				message: text,
				recipients,
			}),
		});

		const data = await res.json().catch(() => ({}));

		if (!res.ok || data.status === 'error') {
			const errMsg = data.message || `HTTP ${res.status}`;
			logger.error('[sms arkesel failed]', errMsg);
			throw new Error(`Arkesel SMS delivery failed: ${errMsg}`);
		}

		logger.info(`[sms sent (arkesel)] to=${recipients.join(',')} status=${data.status || 'success'}`);
		return data;
	} catch (err) {
		logger.error('[sms error]', err.message);
		// Return error metadata instead of crashing outer operations
		return { error: err.message };
	}
}

export default { isArkeselConfigured, sendSms, normalizePhoneNumber, ARKESEL_SENDER_ID };
