import fs from 'node:fs';
import bcrypt from 'bcryptjs';
import { createPrismaClient } from '../src/utils/prisma.js';

if (fs.existsSync('.env')) {
	try {
		process.loadEnvFile('.env');
	} catch (_) {
		/* ignore */
	}
}

const prisma = createPrismaClient();

const COUNTRIES = [
	{ code: 'GH', name: 'Ghana', currency: 'GHS', regions: ['Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central', 'Northern', 'Volta', 'Bono', 'Ahafo', 'Oti', 'Western North', 'North East', 'Savannah', 'Upper East', 'Upper West', 'Bono East'] },
	{ code: 'NG', name: 'Nigeria', currency: 'NGN', regions: ['Lagos', 'Federal Capital Territory', 'Enugu', 'Anambra', 'Rivers', 'Kaduna', 'Kano', 'Oyo', 'Delta', 'Edo', 'Imo', 'Abia', 'Cross River', 'Akwa Ibom', 'Ogun', 'Ondo', 'Ekiti', 'Kwara', 'Osun', 'Bayelsa', 'Ebonyi', 'Nasarawa', 'Plateau', 'Benue', 'Kogi', 'Niger', 'Sokoto', 'Kebbi', 'Jigawa', 'Yobe', 'Borno', 'Bauchi', 'Gombe', 'Taraba', 'Adamawa', 'Zamfara', 'Katsina'] },
	{ code: 'US', name: 'United States', currency: 'USD', regions: [] },
	{ code: 'GB', name: 'United Kingdom', currency: 'GBP', regions: [] },
	{ code: 'CA', name: 'Canada', currency: 'CAD', regions: [] },
	{ code: 'ZA', name: 'South Africa', currency: 'ZAR', regions: [] },
	{ code: 'KE', name: 'Kenya', currency: 'KES', regions: [] },
	{ code: 'AE', name: 'United Arab Emirates', currency: 'AED', regions: [] },
	{ code: 'AU', name: 'Australia', currency: 'AUD', regions: [] },
	{ code: 'DE', name: 'Germany', currency: 'EUR', regions: [] },
];

const EVENTS = [
	{
		title: 'The Journey Continues: Peter Edochie Book Launch – Accra',
		city: 'Accra', venue: 'Accra International Conference Centre',
		starts: new Date(), ends: new Date(), summary: 'An evening of stories, mentorship and celebration as we launch Peter Edochie\u2019s latest body of work in Ghana.',
		category: 'launch', eventType: 'ghana_launch', invitationOnly: false, price: 'From GHS 150',
		ticketTiers: [
			{ name: 'Standard', price: 150, currency: 'GHS' },
			{ name: 'VIP', price: 500, currency: 'GHS' },
		],
	},
	{
		title: 'The Masterclass: Writing With Purpose',
		city: 'Lagos', venue: 'Eko Hotel & Suites',
		starts: new Date(), ends: new Date(), summary: 'A hands-on masterclass for aspiring writers, entrepreneurs and storytellers.',
		category: 'masterclass', eventType: 'masterclass', invitationOnly: false, price: 'From NGN 50,000',
		ticketTiers: [
			{ name: 'Standard', price: 50000, currency: 'NGN' },
			{ name: 'VIP', price: 150000, currency: 'NGN' },
		],
	},
	{
		title: 'Meet & Greet: An Intimate Evening With Peter Edochie',
		city: 'London', venue: 'The Cumberland, London',
		starts: new Date(), ends: new Date(), summary: 'A limited-capacity meet and greet with behind-the-scenes stories, photo opportunities and a signed copy of the book.',
		category: 'meet_and_greet', eventType: 'meet_and_greet', invitationOnly: true, price: 'From £80',
		ticketTiers: [
			{ name: 'standard', price: 80, currency: 'GBP' },
			{ name: 'vip', price: 200, currency: 'GBP' },
		],
	},
];

const PACKAGES = [
	{ name: 'Platinum Partner', tier: 'platinum', price: 100000, currency: 'USD', sort: 1, benefits: ['Title sponsor billing', 'Keynote slot', 'Premium booth', 'Logo on all materials'] },
	{ name: 'Gold Partner', tier: 'gold', price: 50000, currency: 'USD', sort: 2, benefits: ['Stage branding', 'Booth', 'Logo placement'] },
	{ name: 'Silver Partner', tier: 'silver', price: 20000, currency: 'USD', sort: 3, benefits: ['Booth', 'Logo on website'] },
	{ name: 'Bronze Partner', tier: 'bronze', price: 7500, currency: 'USD', sort: 4, benefits: ['Logo on website', 'Recognition'] },
];

const DISTRIBUTOR_TIERS = [
	{ name: 'Tier 1 — 50 to 249 units', minUnits: 50, maxUnits: 249, discount: 35, terms: 'Payment on order', sort: 1 },
	{ name: 'Tier 2 — 250 to 999 units', minUnits: 250, maxUnits: 999, discount: 42, terms: '30-day terms on approval', sort: 2 },
	{ name: 'Tier 3 — 1,000+ units', minUnits: 1000, maxUnits: null, discount: 50, terms: 'Negotiated terms and freight support', sort: 3 },
];

async function main() {
	// Remove previously-seeded catalog/content so re-running keeps them fresh,
	// but preserve users and employee roles so real accounts and passwords are not wiped.
	await prisma.news.deleteMany({});
	await prisma.bookPreregistration.deleteMany({});
	await prisma.product.deleteMany({});
	await prisma.bookCategory.deleteMany({});
	await prisma.event.deleteMany({});
	await prisma.sponsorshipPackage.deleteMany({});
	await prisma.subscriber.deleteMany({});

	const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
	const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';

	// Check if an admin already exists (by email, staffRole, or role)
	let admin = await prisma.user.findFirst({
		where: {
			OR: [
				{ email: adminEmail },
				{ staffRole: 'super_admin' },
				{ role: 'admin' },
			],
		},
	});

	if (admin) {
		console.log(`  ℹ Admin already exists: ${admin.email} (skipping admin creation, password preserved)`);
	} else {
		const adminHash = await bcrypt.hash(adminPassword, 10);
		admin = await prisma.user.create({
			data: {
				email: adminEmail,
				passwordHash: adminHash,
				name: 'Administrator',
				staffRole: 'super_admin',
				accountType: 'admin',
				role: 'admin',
				staffStatus: 'active',
				verified: true,
				mustChangePassword: false,
			},
		});

		await prisma.employeeRole.create({
			data: { userId: admin.id, role: 'super_admin' },
		});
		console.log(`  ✅ Created super admin: ${adminEmail} (role=super_admin)`);
	}

	for (const c of COUNTRIES) {
		const country = await prisma.country.upsert({
			where: { code: c.code },
			update: { name: c.name, currency: c.currency, status: 'active' },
			create: { code: c.code, name: c.name, currency: c.currency, status: 'active' },
		});
		for (const regionName of c.regions) {
			const existing = await prisma.region.findFirst({ where: { countryId: country.id, name: regionName } });
			if (!existing) {
				await prisma.region.create({ data: { countryId: country.id, name: regionName, status: 'active' } });
			}
		}
	}
	console.log(`  countries: ${COUNTRIES.length}, with regions`);

	for (const ev of EVENTS) {
		const existing = await prisma.event.findFirst({ where: { title: ev.title } });
		if (!existing) {
			await prisma.event.create({
				data: {
					title: ev.title, city: ev.city, venue: ev.venue,
					starts: ev.starts, ends: ev.ends, summary: ev.summary,
					category: ev.category, eventType: ev.eventType,
					invitationOnly: ev.invitationOnly, price: ev.price, ticketTiers: ev.ticketTiers,
				},
			});
		}
	}
	console.log(`  events: ${EVENTS.length}`);

	for (const p of PACKAGES) {
		await prisma.sponsorshipPackage.upsert({
			where: { id: `${p.tier}-package` },
			update: { name: p.name, tier: p.tier, price: p.price, currency: p.currency, benefits: p.benefits, sort: p.sort, enabled: true },
			create: { id: `${p.tier}-package`, name: p.name, tier: p.tier, price: p.price, currency: p.currency, benefits: p.benefits, sort: p.sort, enabled: true },
		});
	}
	console.log(`  sponsorship packages: ${PACKAGES.length}`);

	for (const t of DISTRIBUTOR_TIERS) {
		await prisma.distributorTier.upsert({
			where: { id: `dist-tier-${t.sort}` },
			update: { name: t.name, minUnits: t.minUnits, maxUnits: t.maxUnits, discount: t.discount, terms: t.terms, enabled: true },
			create: { id: `dist-tier-${t.sort}`, name: t.name, minUnits: t.minUnits, maxUnits: t.maxUnits, discount: t.discount, terms: t.terms, enabled: true, sort: t.sort },
		});
	}
	console.log(`  distributor tiers: ${DISTRIBUTOR_TIERS.length}`);

	const CATEGORY_SEEDS = [
		{ name: 'Hardcover Editions', slug: 'hardcover-editions', description: 'Cloth-bound and standard hardcover books from the Peter Edochie Legacy imprint.', sort: 1, enabled: true },
		{ name: 'Digital Editions', slug: 'digital-editions', description: 'Audiobook and e-book formats fulfilled digitally or via partner retailers.', sort: 2, enabled: true },
		{ name: 'Signed & Collector', slug: 'signed-collector', description: 'Personally signed, numbered and limited collector editions.', sort: 3, enabled: true },
		{ name: 'Legacy Collection', slug: 'legacy-collection', description: 'Future titles, companion volumes and archive publications.', sort: 4, enabled: true },
	];
	const catBySlug = {};
	for (const seed of CATEGORY_SEEDS) {
		const cat = await prisma.bookCategory.upsert({
			where: { slug: seed.slug },
			update: seed,
			create: seed,
		});
		catBySlug[seed.slug] = cat;
	}
	console.log(`  book categories: ${CATEGORY_SEEDS.length}`);

	const BOOK_IMAGE = 'https://images.hostinger.com/3283c1af-6e58-4eca-a80a-6d5dc5464e9d.png';
	const products = [
		{
			name: 'The Peter Edochie Autobiography',
			edition: 'Signed copy',
			format: 'hardcopy',
			price: 85,
			productType: 'book',
			status: 'preorder',
			currentStock: 200,
			lowStockThreshold: 20,
			enabled: true,
			mainOrderEnabled: false,
			bookCategoryId: catBySlug['signed-collector'].id,
			author: 'Peter Edochie',
			isbn: '978-0000000001',
			pages: 412,
			language: 'English',
			publishedYear: '2026',
			excerpt: 'A personally signed hardcover of the official autobiography — cloth bound, 412 pages, 32 archive photographs.',
			image: BOOK_IMAGE,
			createdById: admin.id,
		},
		{
			name: 'The Peter Edochie Autobiography',
			edition: 'Standard copy',
			format: 'hardcopy',
			price: 45,
			productType: 'book',
			status: 'preorder',
			currentStock: 500,
			lowStockThreshold: 30,
			enabled: true,
			mainOrderEnabled: false,
			bookCategoryId: catBySlug['hardcover-editions'].id,
			author: 'Peter Edochie',
			isbn: '978-0000000002',
			pages: 412,
			language: 'English',
			publishedYear: '2026',
			excerpt: 'The standard hardcover edition of the official autobiography — 412 pages, 32 archive photographs.',
			image: BOOK_IMAGE,
			createdById: admin.id,
		},
		{
			name: 'The Peter Edochie Autobiography',
			edition: 'Audiobook',
			format: 'digital',
			price: 24.99,
			productType: 'book',
			status: 'preorder',
			currentStock: 9999,
			lowStockThreshold: 50,
			enabled: true,
			mainOrderEnabled: false,
			bookCategoryId: catBySlug['digital-editions'].id,
			author: 'Peter Edochie',
			isbn: '978-0000000003',
			language: 'English',
			publishedYear: '2026',
			excerpt: 'Narrated by Peter Edochie with extended audio extracts from the archive recordings.',
			createdById: admin.id,
		},
		{
			name: 'The Peter Edochie Autobiography',
			edition: 'E-book',
			format: 'digital',
			price: 14.99,
			productType: 'book',
			status: 'preorder',
			currentStock: 9999,
			lowStockThreshold: 50,
			enabled: true,
			mainOrderEnabled: false,
			bookCategoryId: catBySlug['digital-editions'].id,
			author: 'Peter Edochie',
			isbn: '978-0000000004',
			language: 'English',
			publishedYear: '2026',
			excerpt: 'The digital edition for Kindle and compatible e-readers.',
			createdById: admin.id,
		},
		{ name: 'Signature Journal ', format: 'hardcopy', price: 25, productType: 'merchandise', status: 'main_order', currentStock: 200, lowStockThreshold: 10, enabled: true, mainOrderEnabled: true, category: 'merchandise', createdById: admin.id },
	];
	for (const pd of products) {
		const existing = await prisma.product.findFirst({
			where: { name: pd.name, edition: pd.edition || undefined },
		});
		if (!existing) {
			await prisma.product.create({ data: pd });
		}
	}
	console.log(`  products: ${products.length}`);

	const news = [
		{ title: 'Announcing the Ghana Book Launch', excerpt: 'We are thrilled to announce the public book launch coming to Accra later this year.', body: 'Join us for an evening of stories, mentorship and celebration.', category: 'news', published: new Date() },
		{ title: 'Mentorship Applications Now Open', excerpt: 'Applications for the scholarship and standard mentorship cohorts are open.', body: 'Submit your application before the deadline to be considered.', category: 'mentorship', published: new Date() },
	];
	for (const n of news) {
		const existing = await prisma.news.findFirst({ where: { title: n.title } });
		if (!existing) {
			await prisma.news.create({ data: n });
		}
	}
	console.log(`  news: ${news.length}`);

	await prisma.subscriber.upsert({
		where: { email: 'hello@peteredochie.com' },
		update: {},
		create: { email: 'hello@peteredochie.com', name: 'Newsletter', country: 'Ghana' },
	});
	console.log('  seed data complete');
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
