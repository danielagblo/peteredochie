import { Router } from 'express';
import {
	register,
	login,
	me,
	requestVerification,
	verifyEmail,
	requestPasswordReset,
	confirmPasswordReset,
	adminSetPassword,
	changePassword,
} from '../../controllers/auth.js';
import { requireAuth, requireSuperAdmin } from '../../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, me);
router.post('/request-verification', requireAuth, requestVerification);
router.post('/verify-email', verifyEmail);
router.post('/request-password-reset', requestPasswordReset);
router.post('/confirm-password-reset', confirmPasswordReset);
router.post('/change-password', requireAuth, changePassword);
router.post('/admin/set-password', requireAuth, requireSuperAdmin, adminSetPassword);

export default router;
