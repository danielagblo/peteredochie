import rateLimit from 'express-rate-limit';

export const globalRateLimit = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute window
	max: 1000,               // max 1000 requests per minute for testing
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: 'Too many requests, please try again later' },
	validate: { trustProxy: false },
});
