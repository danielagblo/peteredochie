// Resolve the event referenced by a registration or ticket.
//
// The public events page falls back to static OFFICIAL_EVENTS (cart slug ids)
// until the database is seeded. Seeding is optional and non-destructive
// bootstrapping keeps registrations/tickets working before then: when the
// frontend sends the official calendar metadata alongside the request, we
// create the missing event record on demand (id is the same stable slug, so a
// later seed aligns to it).

export function sanitizeEventMeta(meta = {}) {
	const text = (v, fallback = '') => (typeof v === 'string' ? v.trim() : fallback);
	return {
		id: text(meta.id),
		title: text(meta.title).slice(0, 200),
		city: text(meta.city).slice(0, 120),
		venue: text(meta.venue).slice(0, 200),
		starts: meta.starts ? new Date(meta.starts) : null,
		ends: meta.ends ? new Date(meta.ends) : null,
		summary: text(meta.summary).slice(0, 900),
		category: text(meta.category).slice(0, 60) || 'launch',
		eventType: text(meta.event_type || meta.eventType).slice(0, 60),
		invitationOnly: typeof meta.invitation_only === 'boolean' ? meta.invitation_only : false,
		ticketTiers: Array.isArray(meta.ticket_tiers) ? meta.ticket_tiers : [],
	};
}

// Returns the existing or freshly-created event record for `eventId`.
// Throws a 422 error when the event cannot be resolved.
export async function resolveEventForWrite(prisma, eventId, meta = {}) {
	if (!eventId) {
		const err = new Error('An event is required.');
		err.status = 422;
		throw err;
	}

	const existing = await prisma.event.findUnique({ where: { id: eventId } });
	if (existing) return existing;

	const clean = sanitizeEventMeta(meta);
	if (clean.title) {
		const byTitle = await prisma.event.findFirst({ where: { title: clean.title } });
		if (byTitle) return byTitle;

		return prisma.event.create({
			data: {
				id: eventId,
				title: clean.title,
				city: clean.city,
				venue: clean.venue,
				starts: clean.starts || new Date(),
				ends: clean.ends,
				summary: clean.summary,
				category: clean.category,
				eventType: clean.eventType,
				invitationOnly: clean.invitationOnly,
				ticketTiers: clean.ticketTiers,
			},
		});
	}

	const err = new Error('The selected event is not open for registration yet.');
	err.status = 422;
	throw err;
}