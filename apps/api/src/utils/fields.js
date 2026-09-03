// Converts between the internal Prisma camelCase field names and the
// snake_case / PocketBase-style naming the frontend uses at the API boundary.

// snake_case (API) -> camelCase (Prisma) for CREATE/UPDATE payloads.
const INPUT = {
	user: {
		id: 'id',
		email: 'email',
		name: 'name',
		avatar: 'avatar',
		verified: 'verified',
		role: 'role',
		account_type: 'accountType',
		approval_status: 'approvalStatus',
		organisation: 'organisation',
		country: 'country',
		phone: 'phone',
		territory: 'territory',
		newsletter: 'newsletter',
		interests: 'interests',
		staff_role: 'staffRole',
		last_login: 'lastLogin',
		login_history: 'loginHistory',
		must_change_password: 'mustChangePassword',
		staff_status: 'staffStatus',
		country_assignment: 'countryAssignment',
		assigned_country: 'assignedCountryId',
		collection_address: 'collectionAddress',
		collection_hours: 'collectionHours',
		password: 'password',
		password_hash: 'passwordHash',
		created: 'createdAt',
		updated: 'updatedAt',
	},
	employeeRole: {
		id: 'id',
		user_id: 'userId',
		user: 'userId',
		role: 'role',
		permissions: 'permissions',
	},
	event: {
		id: 'id',
		title: 'title',
		city: 'city',
		venue: 'venue',
		starts: 'starts',
		ends: 'ends',
		summary: 'summary',
		category: 'category',
		image: 'image',
		event_type: 'eventType',
		invitation_only: 'invitationOnly',
		price: 'price',
		ticket_tiers: 'ticketTiers',
	},
	news: {
		id: 'id',
		title: 'title',
		excerpt: 'excerpt',
		body: 'body',
		category: 'category',
		image: 'image',
		published: 'published',
	},
	enquiry: {
		id: 'id',
		name: 'name',
		email: 'email',
		organisation: 'organisation',
		subject: 'subject',
		message: 'message',
	},
	subscriber: {
		id: 'id',
		email: 'email',
		name: 'name',
		country: 'country',
		phone: 'phone',
		referral_source: 'referralSource',
		consent_given: 'consentGiven',
		consent_at: 'consentAt',
		interests: 'interests',
	},
	country: {
		id: 'id',
		name: 'name',
		code: 'code',
		currency: 'currency',
		status: 'status',
		launch_date: 'launchDate',
		regional_coordinator: 'regionalCoordinatorId',
		primary_distributor: 'primaryDistributorId',
	},
	region: {
		id: 'id',
		name: 'name',
		country: 'countryId',
		country_id: 'countryId',
		status: 'status',
	},
	product: {
		id: 'id',
		name: 'name',
		description: 'description',
		format: 'format',
		price: 'price',
		edition: 'edition',
		product_type: 'productType',
		status: 'status',
		inventory_limit: 'inventoryLimit',
		current_stock: 'currentStock',
		low_stock_threshold: 'lowStockThreshold',
		enabled: 'enabled',
		main_order_enabled: 'mainOrderEnabled',
		external_url: 'externalUrl',
		image: 'image',
		created_by: 'createdById',
		variants: 'variants',
		category: 'category',
		book_category: 'bookCategoryId',
		author: 'author',
		isbn: 'isbn',
		pages: 'pages',
		language: 'language',
		excerpt: 'excerpt',
		published_year: 'publishedYear',
	},
	bookCategory: {
		id: 'id',
		name: 'name',
		slug: 'slug',
		description: 'description',
		sort: 'sort',
		enabled: 'enabled',
	},
	bookPreregistration: {
		id: 'id',
		product: 'productId',
		product_id: 'productId',
		full_name: 'fullName',
		email: 'email',
		phone: 'phone',
		country: 'country',
		city: 'city',
		quantity: 'quantity',
		notes: 'notes',
		status: 'status',
		edition: 'edition',
	},
	order: {
		id: 'id',
		owner: 'ownerId',
		owner_id: 'ownerId',
		email: 'email',
		total_price: 'totalPrice',
		currency: 'currency',
		shipping_address: 'shippingAddress',
		payment_status: 'paymentStatus',
		payment_reference: 'paymentReference',
		paystack_access_code: 'paystackAccessCode',
		order_status: 'orderStatus',
		items_summary: 'itemsSummary',
		estimated_delivery: 'estimatedDelivery',
		tracking_number: 'trackingNumber',
		confirmation_sent: 'confirmationSent',
		country: 'country',
		distributor: 'distributorId',
		distributor_id: 'distributorId',
		fulfillment_method: 'fulfillmentMethod',
	},
	orderItem: {
		id: 'id',
		order: 'orderId',
		order_id: 'orderId',
		product: 'productId',
		product_id: 'productId',
		product_name: 'productName',
		product_format: 'productFormat',
		product_edition: 'productEdition',
		quantity: 'quantity',
		unit_price: 'unitPrice',
		total_price: 'totalPrice',
	},
	meetAndGreetTicket: {
		id: 'id',
		owner: 'ownerId',
		owner_id: 'ownerId',
		event: 'eventId',
		event_id: 'eventId',
		tier: 'tier',
		price: 'price',
		status: 'status',
		confirmation_code: 'confirmationCode',
		photographer: 'photographer',
		payment_reference: 'paymentReference',
		payment_status: 'paymentStatus',
		paystack_access_code: 'paystackAccessCode',
		country: 'country',
		distributor: 'distributorId',
		distributor_id: 'distributorId',
		fulfillment_method: 'fulfillmentMethod',
	},
	eventRegistration: {
		id: 'id',
		owner: 'ownerId',
		owner_id: 'ownerId',
		event: 'eventId',
		event_id: 'eventId',
		status: 'status',
		confirmation_code: 'confirmationCode',
		country: 'country',
		distributor: 'distributorId',
		distributor_id: 'distributorId',
		fulfillment_method: 'fulfillmentMethod',
	},
	sponsorshipPackage: {
		id: 'id',
		name: 'name',
		tier: 'tier',
		description: 'description',
		price: 'price',
		currency: 'currency',
		benefits: 'benefits',
		deliverables: 'deliverables',
		duration: 'duration',
		image: 'image',
		enabled: 'enabled',
		sort: 'sort',
	},
	sponsorship: {
		id: 'id',
		owner: 'ownerId',
		owner_id: 'ownerId',
		company_name: 'companyName',
		industry: 'industry',
		contact_person: 'contactPerson',
		email: 'email',
		phone: 'phone',
		website: 'website',
		package_tier: 'packageTier',
		package: 'packageId',
		package_id: 'packageId',
		investment_amount: 'investmentAmount',
		currency: 'currency',
		message: 'message',
		status: 'status',
		payment_status: 'paymentStatus',
		payment_reference: 'paymentReference',
		paystack_access_code: 'paystackAccessCode',
		admin_notes: 'adminNotes',
		country: 'country',
	},
	mentorshipApplication: {
		id: 'id',
		name: 'name',
		email: 'email',
		country: 'country',
		discipline: 'discipline',
		statement: 'statement',
		owner: 'ownerId',
		owner_id: 'ownerId',
		status: 'status',
		cohort: 'cohort',
		requested_type: 'requestedType',
		registration_type: 'registrationType',
	},
	mentorshipMaterial: {
		id: 'id',
		title: 'title',
		description: 'description',
		module: 'module',
		cohort: 'cohort',
		registration_type: 'registrationType',
		sort: 'sort',
		published: 'published',
		url: 'url',
		video_url: 'videoUrl',
		file: 'file',
	},
	stockMovement: {
		id: 'id',
		product: 'productId',
		product_id: 'productId',
		quantity_change: 'quantityChange',
		previous_stock: 'previousStock',
		new_stock: 'newStock',
		reason: 'reason',
		created_by: 'createdById',
	},
	distributorTier: {
		id: 'id',
		name: 'name',
		min_units: 'minUnits',
		max_units: 'maxUnits',
		discount: 'discount',
		terms: 'terms',
		enabled: 'enabled',
		sort: 'sort',
	},
};

// Add PB-style timestamp aliases for every model on input (snake->camel).
for (const map of Object.values(INPUT)) {
	map.created = 'createdAt';
	map.updated = 'updatedAt';
}

// camelCase (Prisma) -> snake_case (API) for READ output.
// Also injects PB-style `created`/`updated` aliases.
const OUTPUT = {};
for (const [model, map] of Object.entries(INPUT)) {
	OUTPUT[model] = {};
	for (const [snake, camel] of Object.entries(map)) {
		OUTPUT[model][camel] = snake;
	}
}
// Add PB-style timestamps for every model on output (camel->snake).
for (const map of Object.values(OUTPUT)) {
	map.createdAt = 'created';
	map.updatedAt = 'updated';
}

// Relation sub-keys within a fetched record -> { model, as } so mapRecord can
// recurse and emit the expanded object at the PocketBase snake_case key.
const RELATIONS = {
	user: {
		assignedCountry: { model: 'country', as: 'assigned_country' },
		employeeRole: { model: 'employeeRole', as: 'employee_role' },
	},
	order: { items: { model: 'orderItem', as: 'items' }, distributor: { model: 'user', as: 'distributor' } },
	meetAndGreetTicket: {
		event: { model: 'event', as: 'event' },
		distributor: { model: 'user', as: 'distributor' },
		owner: { model: 'user', as: 'owner' },
	},
	eventRegistration: {
		event: { model: 'event', as: 'event' },
		distributor: { model: 'user', as: 'distributor' },
		owner: { model: 'user', as: 'owner' },
	},
	sponsorship: { package: { model: 'sponsorshipPackage', as: 'package' }, owner: { model: 'user', as: 'owner' } },
	employeeRole: { user: { model: 'user', as: 'user' } },
	stockMovement: {
		product: { model: 'product', as: 'product' },
		createdBy: { model: 'user', as: 'created_by' },
	},
	product: {
		createdBy: { model: 'user', as: 'created_by' },
		bookCategory: { model: 'bookCategory', as: 'book_category' },
	},
	bookCategory: {},
	bookPreregistration: {
		product: { model: 'product', as: 'product' },
	},
	country: {
		primaryDistributor: { model: 'user', as: 'primary_distributor' },
		regionalCoordinator: { model: 'user', as: 'regional_coordinator' },
		assignedUsers: { model: 'user', as: 'assigned_users' },
	},
	region: { country: { model: 'country', as: 'country' } },
	event: {
		tickets: { model: 'meetAndGreetTicket', as: 'tickets' },
		registrations: { model: 'eventRegistration', as: 'registrations' },
	},
	sponsorshipPackage: { sponsorships: { model: 'sponsorship', as: 'sponsorships' } },
	orderItem: { product: { model: 'product', as: 'product' }, order: { model: 'order', as: 'order' } },
	mentorshipApplication: { owner: { model: 'user', as: 'owner' } },
};

export function mapInput(model, data) {
	const map = INPUT[model];
	if (!map || !data) return { ...data };
	const out = {};
	for (const [key, value] of Object.entries(data)) {
		if (map[key] !== undefined) out[map[key]] = value;
	}
	return out;
}

// Recursively map a read record (and its expanded relations) to snake_case.
export function mapRecord(model, record) {
	if (!record) return record;
	const map = OUTPUT[model];
	if (!map) return record;
	const out = {};
	for (const [key, value] of Object.entries(record)) {
		if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
			const rel = RELATIONS[model]?.[key];
			if (rel) {
				out[rel.as] = mapRecord(rel.model, value);
				continue;
			}
		}
		if (Array.isArray(value)) {
			const rel = RELATIONS[model]?.[key];
			if (rel) {
				out[rel.as] = value.map((item) => mapRecord(rel.model, item));
				continue;
			}
		}
		const outKey = map[key] !== undefined ? map[key] : key;
		// Skip emitting the raw id for a relation that was expanded (object wins).
		out[outKey] = value;
	}
	return out;
}

export function mapModel(snakeModel) {
	const aliases = {
		'employee-roles': 'employeeRole',
		'users': 'user',
		'meet-and-greet-tickets': 'meetAndGreetTicket',
		'event-registrations': 'eventRegistration',
		'events': 'event',
		'news': 'news',
		'enquiries': 'enquiry',
		'subscribers': 'subscriber',
		'countries': 'country',
		'regions': 'region',
		'products': 'product',
		'orders': 'order',
		'order-items': 'orderItem',
		'sponsorship-packages': 'sponsorshipPackage',
		'sponsorships': 'sponsorship',
		'mentorship-applications': 'mentorshipApplication',
		'mentorship-materials': 'mentorshipMaterial',
		'stock-movements': 'stockMovement',
		'distributor-tiers': 'distributorTier',
		'book-categories': 'bookCategory',
		'book-preregistrations': 'bookPreregistration',
	};
	return aliases[snakeModel] || snakeModel;
}

export const FIELD_MODELS = Object.freeze({ ...INPUT });
