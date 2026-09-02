import bcrypt from 'bcryptjs';
import { createPrismaClient } from '../src/utils/prisma.js';

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

async function main() {
	// Remove any previously-seeded records so re-running always produces
	// clean data (e.g. non-ASCII chars like £ survive a utf8mb4 connection).
	await prisma.news.deleteMany({});
	await prisma.product.deleteMany({});
	await prisma.event.deleteMany({});
	await prisma.sponsorshipPackage.deleteMany({});
	await prisma.subscriber.deleteMany({});
	await prisma.employeeRole.deleteMany({});
	await prisma.user.deleteMany({});

	const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
	const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';

	const adminHash = await bcrypt.hash(adminPassword, 10);

	const admin = await prisma.user.upsert({
		where: { email: adminEmail },
		update: { staffRole: 'super_admin', accountType: 'admin', role: 'admin', staffStatus: 'active', verified: true },
		create: {
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

	await prisma.employeeRole.upsert({
		where: { userId: admin.id },
		update: { role: 'super_admin' },
		create: { userId: admin.id, role: 'super_admin' },
	});
	console.log(`  admin user: ${adminEmail} (role=super_admin)`);

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

	const products = [
		{ name: 'The Journey Continues (Hardcover)', format: 'hardcopy', price: 30, edition: '1st Edition', productType: 'book', status: 'main_order', currentStock: 500, lowStockThreshold: 20, enabled: true, mainOrderEnabled: true, category: 'book', createdById: admin.id },
		{ name: 'The Journey Continues (Paperback)', format: 'hardcopy', price: 18, edition: '1st Edition', productType: 'book', status: 'main_order', currentStock: 900, lowStockThreshold: 30, enabled: true, mainOrderEnabled: true, category: 'book', createdById: admin.id },
		{ name: 'The Journey Continues (Digital eBook)', format: 'digital', price: 9.99, edition: 'Digital', productType: 'book', status: 'main_order', currentStock: 9999, lowStockThreshold: 50, enabled: true, mainOrderEnabled: true, category: 'book', createdById: admin.id },
		{ name: 'Signature Journal ', format: 'hardcopy', price: 25, productType: 'merchandise', status: 'main_order', currentStock: 200, lowStockThreshold: 10, enabled: true, mainOrderEnabled: true, category: 'merchandise', createdById: admin.id },
	];
	for (const pd of products) {
		const existing = await prisma.product.findFirst({ where: { name: pd.name } });
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
