import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { crudController, registerCrudRoutes } from '../controllers/crud.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

// Registration-type rank used for tier gating (replaces mentorship-materials-access hook).
const TIER_RANK = { scholarship: 0, standard: 1, patron: 2, legacy: 3 };

const ADMIN_ROLES = ['super_admin', 'country_manager', 'inventory_manager', 'sales_manager'];

// Public list only shows published materials up to the caller's tier; admins see all.
const controller = crudController(prisma.mentorshipMaterial, {
	modelName: 'mentorshipMaterial',
	publicList: false,
	publicGet: false,
	listGuard: optionalAuth,
	createGuard: requireAuth,
	updateGuard: requireAuth,
	deleteGuard: requireAuth,
	searchable: ['title', 'module', 'cohort'],
	orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
	where: (req) => {
		if (req.employeeRole && ADMIN_ROLES.includes(req.employeeRole)) {
			return undefined; // admins see all
		}
		const base = { published: true };
		const userTierRank = TIER_RANK[req.user?.registrationType];
		const allowed = userTierRank === undefined
			? ['scholarship'] // guests / unknown users see lowest tier
			: Object.keys(TIER_RANK).filter((k) => TIER_RANK[k] <= userTierRank);
		base.registrationType = { in: allowed };
		return base;
	},
});

const router = Router();

// Admin list (all materials regardless of published/tier).
router.get('/admin', requireAuth, async (req, res) => {
	try {
		if (!req.employeeRole || !ADMIN_ROLES.includes(req.employeeRole)) {
			return res.status(403).json({ error: 'Admin access required.' });
		}
		const items = await prisma.mentorshipMaterial.findMany({
			orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
		});
		res.json({ items });
	} catch (err) {
		res.status(500).json({ error: 'Could not list records.' });
	}
});

// Override guards so public list uses optionalAuth (to resolve tier for logged-in users).
registerCrudRoutes(router, controller, { base: '/' });
export default router;
