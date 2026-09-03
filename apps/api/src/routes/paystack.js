import { Router } from "express";
import prisma from "../utils/prisma.js";
import { isIntegrationConfigured } from "../utils/integrationConfig.js";
import { decodeToken, verifyToken } from "../utils/token.js";
import logger from "../utils/logger.js";
import { sendEmail } from "../utils/email.js";
import { sendSms } from "../utils/sms.js";
import { getUsdRate } from "../services/rateService.js";

const router = Router();

const getPaystackSecretKey = () => process.env.PAYSTACK_SECRET_KEY;

// Convert a USD-major amount into the merchant's local Paystack currency
// (PAYSTACK_CURRENCY, e.g. GHS). Prices are stored/displayed in USD; Paystack
// only supports charging in the merchant's enabled currency, so we convert at
// a live rate to avoid Paystack's "unsupported_currency" rejection.
async function buildCharge(priceUsd, explicitCurrency) {
	const currency = explicitCurrency || process.env.PAYSTACK_CURRENCY || "USD";
	let amountInCents = Math.round(Number(priceUsd) * 100);
	if (currency !== "USD") {
		const rate = await getUsdRate(currency);
		amountInCents = Math.round(amountInCents * rate);
	}
	return { amountInCents, currency };
}

// Meet & Greet tier prices in USD major units.
const TIER_PRICES = { vip: 1000, standard: 500 };

// Admin roles that may bypass owner scoping on orders/tickets.
const isAdminRole = (role) =>
	["super_admin", "sales_manager", "fulfillment_officer", "inventory_manager"].includes(role);

function userIdFromToken(token) {
	try {
		const payload = verifyToken(token);
		return payload?.id || null;
	} catch {
		return decodeToken(token)?.id || null;
	}
}

function genReference() {
	const stamp = Date.now().toString(36).toUpperCase();
	const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
	return `PEL-${stamp}-${rand}`;
}

function genTicketReference() {
	const stamp = Date.now().toString(36).toUpperCase();
	const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
	return `PEL-MG-${stamp}-${rand}`;
}

function genSponsorshipReference() {
	const stamp = Date.now().toString(36).toUpperCase();
	const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
	return `PEL-SP-${stamp}-${rand}`;
}

function genDistributorReference() {
	const stamp = Date.now().toString(36).toUpperCase();
	const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
	return `PEL-DIS-${stamp}-${rand}`;
}

function ticketCode(tier) {
	const prefix = tier === "vip" ? "MGV" : "MGS";
	return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function validateDistributorForCountry(distributorId, countryCode) {
	if (!distributorId) return null;
	const dist = await prisma.user.findUnique({
		where: { id: distributorId },
		include: { assignedCountry: true },
	});
	if (!dist || dist.accountType !== "distributor" || dist.approvalStatus !== "approved") {
		const err = new Error("Selected distributor is not available.");
		err.status = 422;
		throw err;
	}
	const assignedCode = dist.assignedCountry?.code;
	if (assignedCode && countryCode && assignedCode !== countryCode) {
		const err = new Error("That distributor does not serve the selected country.");
		err.status = 422;
		throw err;
	}
	if (countryCode && !assignedCode) {
		const country = await prisma.country.findUnique({
			where: { code: countryCode },
		});
		if (country?.primaryDistributorId && country.primaryDistributorId !== distributorId) {
			const err = new Error("That distributor is not assigned to the selected country.");
			err.status = 422;
			throw err;
		}
	}
	return distributorId;
}

// ─── Helpers to mark paid ─────────────────────────────────────────────────

async function markOrderPaid(reference) {
	const order = await prisma.order.findFirst({
		where: { paymentReference: reference },
		include: { items: true, owner: true },
	});
	if (!order) return null;
	if (order.paymentStatus === "paid") {
		return order; // already processed
	}

	const updated = await prisma.order.update({
		where: { id: order.id },
		data: { paymentStatus: "paid", orderStatus: "processing" },
	});

	// Decrement stock for each line item + audit log.
	for (const item of order.items) {
		if (!item.productId) continue;
		try {
			const product = await prisma.product.findUnique({ where: { id: item.productId } });
			if (!product) continue;
			const prev = Number(product.currentStock) || 0;
			const next = Math.max(0, prev - (Number(item.quantity) || 0));
			await prisma.product.update({
				where: { id: product.id },
				data: { currentStock: next },
			});
			await prisma.stockMovement.create({
				data: {
					productId: product.id,
					quantityChange: -(Number(item.quantity) || 0),
					previousStock: prev,
					newStock: next,
					reason: `Order ${reference} paid`,
					createdById: order.ownerId || null,
				},
			});
		} catch (err) {
			logger.error("stock decrement failed", "product", item.productId, "err", err.message);
		}
	}

	// Send confirmation email (replaces order-confirmation.pb.js hook).
	if (!order.confirmationSent && order.email) {
		try {
			await sendEmail({
				to: order.email,
				subject: `Order ${reference} confirmed`,
				html: `<p>Thank you for your order <strong>${reference}</strong>.</p>`,
				text: `Thank you for your order ${reference}.`,
			});
			await prisma.order.update({
				where: { id: order.id },
				data: { confirmationSent: true },
			});
		} catch (err) {
			logger.error("order confirmation email failed", err.message);
		}
	}

	// 1. Send SMS order confirmation via Arkesel
	try {
		const shippingPhone = order.shippingAddress?.phone;
		let customerPhone = shippingPhone;
		if (!customerPhone && order.ownerId) {
			const owner = await prisma.user.findUnique({ where: { id: order.ownerId } });
			customerPhone = owner?.phone;
		}
		if (customerPhone) {
			await sendSms({
				to: customerPhone,
				message: `Pete Edochie Legacy: Thank you! Your order ${reference} (${order.currency || "USD"} ${order.totalPrice}) is confirmed. Track status at peteredochie.com/track`,
			});
		}
	} catch (smsErr) {
		logger.error("order confirmation SMS failed", smsErr.message);
	}

	return updated;
}

async function markTicketPaid(reference) {
	const ticket = await prisma.meetAndGreetTicket.findFirst({
		where: { paymentReference: reference },
		include: { event: true, owner: true },
	});
	if (!ticket) return null;
	if (ticket.paymentStatus === "paid") {
		return ticket; // already processed
	}
	const updatedTicket = await prisma.meetAndGreetTicket.update({
		where: { id: ticket.id },
		data: { status: "confirmed", paymentStatus: "paid" },
	});

	// 2. Send SMS ticket pass / Meet & Greet confirmation via Arkesel
	try {
		const recipientPhone = ticket.owner?.phone;
		if (recipientPhone) {
			const eventTitle = ticket.event?.title || "Pete Edochie Meet & Greet";
			await sendSms({
				to: recipientPhone,
				message: `Pete Edochie Legacy: Your ${ticket.tier?.toUpperCase()} pass for ${eventTitle} is confirmed! Pass Code: ${ticket.confirmationCode}. View pass at peteredochie.com/dashboard`,
			});
		}
	} catch (smsErr) {
		logger.error("ticket confirmation SMS failed", smsErr.message);
	}

	return updatedTicket;
}

async function markSponsorshipPaid(reference) {
	const sponsorship = await prisma.sponsorship.findFirst({
		where: { paymentReference: reference },
		include: { owner: true, package: true },
	});
	if (!sponsorship) return null;
	if (sponsorship.paymentStatus === "paid") {
		return sponsorship; // already processed
	}
	const updated = await prisma.sponsorship.update({
		where: { id: sponsorship.id },
		data: { paymentStatus: "paid" },
	});

	// Notify the sponsor that payment was received.
	try {
		const recipientEmail = sponsorship.email || sponsorship.owner?.email;
		if (recipientEmail) {
			const tier = (sponsorship.packageTier || sponsorship.package?.name || "Sponsorship").toUpperCase();
			await sendEmail({
				to: recipientEmail,
				subject: `Payment received — ${tier} Sponsorship | The Pete Edochie Legacy`,
				text: `Thank you! Your ${tier} sponsorship payment (reference ${reference}) has been received. Our team will contact you to finalise the partnership.`,
				html: `<p>Thank you! Your <strong>${tier}</strong> sponsorship payment (reference <strong>${reference}</strong>) has been received.</p><p>Our team will contact you to finalise the partnership.</p>`,
			});
		}
	} catch (err) {
		logger.error("sponsorship payment email failed", err.message);
	}

	return updated;
}

function distributorTierForKey(tierKey) {
	return prisma.distributorTier.findFirst({ where: { id: tierKey } });
}

// ─── Routes ──────────────────────────────────────────────────────────────

// GET /paystack/status
router.get("/status", (req, res) => {
	res.json({
		configured: isIntegrationConfigured("PAYSTACK_SECRET_KEY"),
		currency: process.env.PAYSTACK_CURRENCY || "USD",
	});
});

// POST /paystack/initialize
router.post("/initialize", async (req, res) => {
	const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
	const userId = token ? userIdFromToken(token) : null;

	// Authenticated users must verify their email before ordering.
	if (userId) {
		const account = await prisma.user.findUnique({ where: { id: userId }, select: { verified: true, approvalStatus: true } });
		if (account && !account.verified) {
			return res.status(403).json({ error: "Please verify your email address before placing an order." });
		}
	}

	const {
		items,
		shipping_address: shipping,
		email,
		return_origin,
		country,
		fulfillment_method,
		distributor_id,
	} = req.body || {};

	if (!Array.isArray(items) || items.length === 0) {
		return res.status(422).json({ error: "Your cart is empty." });
	}
	if (!email) {
		return res.status(422).json({ error: "An email address is required." });
	}

	let total = 0;
	const lineItems = [];
	for (const line of items) {
		const product = await prisma.product.findUnique({ where: { id: line.product_id } });
		if (!product) {
			return res.status(422).json({ error: "One of the products in your cart is no longer available." });
		}
		if (product.externalUrl) {
			return res.status(422).json({ error: `${product.name} is only available through Amazon.` });
		}
		if (!product.enabled) {
			return res.status(422).json({ error: `${product.name} is not currently available.` });
		}
		const qty = Math.max(1, parseInt(line.quantity, 10) || 1);
		const unit = Number(product.price) || 0;
		const lineTotal = Math.round(unit * qty * 100) / 100;
		total += lineTotal;
		const variantLabel = line.variant ? ` (${line.variant})` : "";
		lineItems.push({
			productId: product.id,
			productName: `${product.name}${variantLabel}`,
			productFormat: product.format || null,
			productEdition: product.edition || "",
			quantity: qty,
			unitPrice: unit,
			totalPrice: lineTotal,
		});
	}
	total = Math.round(total * 100) / 100;

	const fulfillment = fulfillment_method === "distributor_collection" ? "distributor_collection" : "ship";
	let distributorId = null;
	if (fulfillment === "distributor_collection") {
		if (!country) return res.status(422).json({ error: "A country is required for distributor collection." });
		if (!distributor_id) return res.status(422).json({ error: "A distributor is required for collection orders." });
		try {
			distributorId = await validateDistributorForCountry(distributor_id, country);
		} catch (err) {
			return res.status(err.status || 422).json({ error: err.message });
		}
	}

	const reference = genReference();
	const summary = lineItems.map((l) => `${l.productName} × ${l.quantity}`).join(", ");

	let order;
	try {
		order = await prisma.order.create({
			data: {
				ownerId: userId || null,
				email,
				totalPrice: total,
				currency: "USD",
				shippingAddress: shipping || {},
				paymentStatus: "pending",
				paymentReference: reference,
				orderStatus: "pending",
				itemsSummary: summary,
				confirmationSent: false,
				country: country || "",
				fulfillmentMethod: fulfillment,
				distributorId,
				items: { create: lineItems },
			},
		});
	} catch (err) {
		logger.error("order create failed", err.message);
		return res.status(500).json({ error: "Could not create your order." });
	}

	if (!isIntegrationConfigured("PAYSTACK_SECRET_KEY")) {
		return res.status(503).json({
			error: "INTEGRATION_NOT_CONFIGURED",
			integration: "Paystack",
			envKeys: "PAYSTACK_SECRET_KEY",
			configured: false,
			order_id: order.id,
			reference,
			message: "Your preorder is recorded. Payment will open once Paystack is connected.",
		});
	}

	const { amountInCents, currency: chargeCurrency } = await buildCharge(total);
	const callbackUrl = `${return_origin || ""}/order/${reference}`;

	let paystackRes;
	try {
		paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${getPaystackSecretKey()}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email,
				amount: amountInCents,
				currency: chargeCurrency,
				reference,
				callback_url: callbackUrl,
				metadata: {
					order_id: order.id,
					custom_fields: [
						{ display_name: "Order", variable_name: "order", value: reference },
					],
				},
			}),
		});
	} catch (err) {
		return res.status(502).json({ error: `Paystack initialize failed: ${err.message}` });
	}

	if (!paystackRes.ok) {
		const body = await paystackRes.text();
		return res.status(502).json({ error: `Paystack initialize failed: ${paystackRes.status} — ${body}` });
	}

	const data = await paystackRes.json();
	if (!data.status || !data.data?.authorization_url) {
		return res.status(502).json({ error: "Paystack initialize returned no authorization URL." });
	}

	try {
		await prisma.order.update({
			where: { id: order.id },
			data: { paystackAccessCode: data.data.access_code || "" },
		});
	} catch (_) {
		/* non-fatal */
	}

	res.json({
		configured: true,
		order_id: order.id,
		reference,
		authorization_url: data.data.authorization_url,
		access_code: data.data.access_code,
	});
});

// POST /paystack/tickets/initialize
router.post("/tickets/initialize", async (req, res) => {
	const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
	const userId = token ? userIdFromToken(token) : null;
	if (!userId) {
		return res.status(401).json({ error: "Authentication required." });
	}

	// Must verify email before purchasing tickets.
	const verifier = await prisma.user.findUnique({ where: { id: userId }, select: { verified: true } });
	if (verifier && !verifier.verified) {
		return res.status(403).json({ error: "Please verify your email address before purchasing tickets." });
	}
	const { event_id, tier, email, return_origin, country, fulfillment_method, distributor_id } = req.body || {};
	if (!event_id || !tier) {
		return res.status(422).json({ error: "Event and ticket tier are required." });
	}
	if (!email) {
		return res.status(422).json({ error: "An email address is required." });
	}

	const price = TIER_PRICES[tier];
	if (price == null) {
		return res.status(422).json({ error: "Invalid ticket tier." });
	}

	const event = await prisma.event.findUnique({ where: { id: event_id } });
	if (!event) {
		return res.status(422).json({ error: "Event not found." });
	}
	if (event.eventType !== "meet_and_greet") {
		return res.status(422).json({ error: "This event is not ticketed." });
	}

	const reference = genTicketReference();
	const confirmationCode = ticketCode(tier);

	const fulfillment = fulfillment_method === "distributor_collection" ? "distributor_collection" : "ship";
	let distributorId = null;
	if (fulfillment === "distributor_collection") {
		if (!country) return res.status(422).json({ error: "A country is required for distributor collection." });
		if (!distributor_id) return res.status(422).json({ error: "A distributor is required for collection." });
		try {
			distributorId = await validateDistributorForCountry(distributor_id, country);
		} catch (err) {
			return res.status(err.status || 422).json({ error: err.message });
		}
	}

	let ticket;
	try {
		ticket = await prisma.meetAndGreetTicket.create({
			data: {
				ownerId: userId,
				eventId: event_id,
				tier,
				price,
				status: "pending",
				confirmationCode,
				photographer: tier === "vip",
				paymentReference: reference,
				paymentStatus: "pending",
				country: country || "",
				fulfillmentMethod: fulfillment,
				distributorId,
			},
		});
	} catch (err) {
		logger.error("ticket create failed", err.message);
		return res.status(500).json({ error: "Could not create your ticket." });
	}

	if (!isIntegrationConfigured("PAYSTACK_SECRET_KEY")) {
		return res.status(503).json({
			error: "INTEGRATION_NOT_CONFIGURED",
			integration: "Paystack",
			envKeys: "PAYSTACK_SECRET_KEY",
			configured: false,
			ticket_id: ticket.id,
			reference,
			confirmation_code: confirmationCode,
			message: "Your ticket is recorded as pending. Payment will open once Paystack is connected.",
		});
	}

	const { amountInCents, currency: chargeCurrency } = await buildCharge(price);
	const callbackUrl = `${return_origin || ""}/events?ticket=${reference}`;

	let paystackRes;
	try {
		paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${getPaystackSecretKey()}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email,
				amount: amountInCents,
				currency: chargeCurrency,
				reference,
				callback_url: callbackUrl,
				metadata: {
					ticket_id: ticket.id,
					event_id,
					tier,
					custom_fields: [
						{ display_name: "Ticket", variable_name: "ticket", value: `${tier.toUpperCase()} — ${event.title}` },
						{ display_name: "Confirmation", variable_name: "confirmation", value: confirmationCode },
					],
				},
			}),
		});
	} catch (err) {
		return res.status(502).json({ error: `Paystack initialize failed: ${err.message}` });
	}

	if (!paystackRes.ok) {
		const body = await paystackRes.text();
		return res.status(502).json({ error: `Paystack initialize failed: ${paystackRes.status} — ${body}` });
	}

	const data = await paystackRes.json();
	if (!data.status || !data.data?.authorization_url) {
		return res.status(502).json({ error: "Paystack initialize returned no authorization URL." });
	}

	try {
		await prisma.meetAndGreetTicket.update({
			where: { id: ticket.id },
			data: { paystackAccessCode: data.data.access_code || "" },
		});
	} catch (_) {
		/* non-fatal */
	}

	res.json({
		configured: true,
		ticket_id: ticket.id,
		reference,
		confirmation_code: confirmationCode,
		authorization_url: data.data.authorization_url,
		access_code: data.data.access_code,
	});
});

// POST /paystack/sponsorships/initialize
// Creates a Sponsorship record and returns a Paystack authorization URL.
router.post("/sponsorships/initialize", async (req, res) => {
	const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
	const userId = token ? userIdFromToken(token) : null;

	const {
		sponsorship_id,
		company_name,
		industry,
		contact_person,
		email,
		phone,
		website,
		package_id,
		package_tier,
		message,
		country,
		return_origin,
	} = req.body || {};

	let price = 0;
	let currency = "USD";
	let tier = package_tier || null;
	let packageId = package_id || null;

	if (packageId) {
		const pkg = await prisma.sponsorshipPackage.findUnique({ where: { id: packageId } });
		if (!pkg) return res.status(422).json({ error: "Selected sponsorship package was not found." });
		if (!pkg.enabled) return res.status(422).json({ error: "Selected sponsorship package is unavailable." });
		price = Number(pkg.price) || 0;
		currency = pkg.currency || "USD";
		tier = pkg.tier || tier;
	}

	if (price <= 0) {
		return res.status(422).json({ error: "Please choose a sponsorship package with a valid investment amount." });
	}

	// Resume path: re-initialise payment for an existing (unpaid) application
	// instead of creating a duplicate. Ownership is enforced so users can only
	// pay for their own application.
	let sponsorship;
	if (sponsorship_id) {
		const existing = await prisma.sponsorship.findUnique({ where: { id: sponsorship_id } });
		if (!existing) return res.status(404).json({ error: "Sponsorship application not found." });
		if (existing.paymentStatus === "paid") {
			return res.status(422).json({ error: "This sponsorship has already been paid." });
		}
		if (userId && existing.ownerId && existing.ownerId !== userId) {
			return res.status(403).json({ error: "You are not authorised to pay for this sponsorship." });
		}
		if (!userId && existing.email && email && String(email).toLowerCase() !== String(existing.email).toLowerCase()) {
			return res.status(403).json({ error: "This sponsorship is associated with a different email." });
		}

		const reference = genSponsorshipReference();
		sponsorship = existing;
		try {
			sponsorship = await prisma.sponsorship.update({
				where: { id: existing.id },
				data: {
					packageId: packageId || existing.packageId,
					packageTier: tier || existing.packageTier,
					investmentAmount: price,
					currency,
					paymentStatus: "pending",
					status: existing.status || "pending",
					paymentReference: reference,
					country: country || existing.country || "",
				},
			});
		} catch (err) {
			logger.error("sponsorship resume failed", err.message);
			return res.status(500).json({ error: "Could not resume your sponsorship payment." });
		}
	} else {
		if (!company_name || !contact_person || !email) {
			return res.status(422).json({ error: "Company name, contact person and email are required." });
		}

		try {
			sponsorship = await prisma.sponsorship.create({
				data: {
					ownerId: userId || null,
					companyName: company_name,
					industry: industry || null,
					contactPerson: contact_person,
					email,
					phone: phone || null,
					website: website || null,
					packageId: packageId || null,
					packageTier: tier || null,
					investmentAmount: price,
					currency,
					message: message || null,
					status: "pending",
					paymentStatus: "pending",
					paymentReference: genSponsorshipReference(),
					country: country || "",
				},
			});
		} catch (err) {
			logger.error("sponsorship create failed", err.message);
			return res.status(500).json({ error: "Could not create your sponsorship application." });
		}
	}

	const reference = sponsorship.paymentReference;
	const companyNameForMeta = sponsorship.companyName || company_name || "";

	if (!isIntegrationConfigured("PAYSTACK_SECRET_KEY")) {
		return res.status(503).json({
			error: "INTEGRATION_NOT_CONFIGURED",
			integration: "Paystack",
			envKeys: "PAYSTACK_SECRET_KEY",
			configured: false,
			sponsorship_id: sponsorship.id,
			reference,
			message: "Your sponsorship proposal is recorded. Payment will open once Paystack is connected.",
		});
	}

	const { amountInCents, currency: chargeCurrency } = await buildCharge(price);
	const callbackUrl = `${return_origin || ""}/dashboard?sponsor_payment=${reference}`;

	let paystackRes;
	try {
		paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${getPaystackSecretKey()}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email: sponsorship.email || email,
				amount: amountInCents,
				currency: chargeCurrency,
				reference,
				callback_url: callbackUrl,
				metadata: {
					sponsorship_id: sponsorship.id,
					custom_fields: [
						{ display_name: "Company", variable_name: "company", value: companyNameForMeta },
					],
				},
			}),
		});
	} catch (err) {
		return res.status(502).json({ error: `Paystack initialize failed: ${err.message}` });
	}

	if (!paystackRes.ok) {
		const body = await paystackRes.text();
		return res.status(502).json({ error: `Paystack initialize failed: ${paystackRes.status} — ${body}` });
	}

	const data = await paystackRes.json();
	if (!data.status || !data.data?.authorization_url) {
		return res.status(502).json({ error: "Paystack initialize returned no authorization URL." });
	}

	try {
		await prisma.sponsorship.update({
			where: { id: sponsorship.id },
			data: { paystackAccessCode: data.data.access_code || "" },
		});
	} catch (_) {
		/* non-fatal */
	}

	res.json({
		configured: true,
		sponsorship_id: sponsorship.id,
		reference,
		authorization_url: data.data.authorization_url,
		access_code: data.data.access_code,
	});
});

// POST /paystack/distributors/initialize
// Creates an Order for a distributor's bulk purchase at the selected tier's
// discount and returns a Paystack authorization URL.
router.post("/distributors/initialize", async (req, res) => {
	const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
	const userId = token ? userIdFromToken(token) : null;
	if (!userId) {
		return res.status(401).json({ error: "Authentication required." });
	}

	const verifier = await prisma.user.findUnique({ where: { id: userId }, select: { verified: true } });
	if (verifier && !verifier.verified) {
		return res.status(403).json({ error: "Please verify your email address before placing an order." });
	}

	const {
		product_id,
		quantity,
		tier_id,
		email,
		country,
		return_origin,
	} = req.body || {};

	if (!product_id || !quantity || !tier_id || !email) {
		return res.status(422).json({ error: "Product, quantity, pricing tier and email are required." });
	}

	const product = await prisma.product.findUnique({ where: { id: product_id } });
	if (!product) return res.status(422).json({ error: "Product not found." });
	if (!product.enabled) return res.status(422).json({ error: "This product is not currently available." });

	const tier = await distributorTierForKey(tier_id);
	if (!tier || !tier.enabled) return res.status(422).json({ error: "Selected pricing tier is not available." });

	const qty = Math.max(parseInt(quantity, 10) || 0, 0);
	if (qty <= 0) return res.status(422).json({ error: "Please enter a valid quantity." });
	if (tier.minUnits && qty < tier.minUnits) {
		return res.status(422).json({ error: `This tier requires a minimum of ${tier.minUnits} units.` });
	}
	if (tier.maxUnits && qty > tier.maxUnits) {
		return res.status(422).json({ error: `This tier is limited to a maximum of ${tier.maxUnits} units.` });
	}

	const retail = Number(product.price) || 0;
	const discount = Number(tier.discount) || 0;
	const unit = Math.round((retail * (1 - discount / 100)) * 100) / 100;
	const total = Math.round(unit * qty * 100) / 100;

	const reference = genDistributorReference();
	const summary = `${product.name} × ${qty} (${tier.name}, ${discount}% off retail)`;

	let order;
	try {
		order = await prisma.order.create({
			data: {
				ownerId: userId,
				email,
				totalPrice: total,
				currency: "USD",
				shippingAddress: { country: country || "" },
				paymentStatus: "pending",
				paymentReference: reference,
				orderStatus: "pending",
				itemsSummary: summary,
				confirmationSent: false,
				country: country || "",
				fulfillmentMethod: "distributor",
				items: {
					create: [
						{
							productId: product.id,
							productName: product.name,
							productFormat: product.format || null,
							productEdition: product.edition || "",
							quantity: qty,
							unitPrice: unit,
							totalPrice: total,
						},
					],
				},
			},
		});
	} catch (err) {
		logger.error("distributor order create failed", err.message);
		return res.status(500).json({ error: "Could not create your distributor order." });
	}

	if (!isIntegrationConfigured("PAYSTACK_SECRET_KEY")) {
		return res.status(503).json({
			error: "INTEGRATION_NOT_CONFIGURED",
			integration: "Paystack",
			envKeys: "PAYSTACK_SECRET_KEY",
			configured: false,
			order_id: order.id,
			reference,
			message: "Your bulk order is recorded. Payment will open once Paystack is connected.",
		});
	}

	const { amountInCents, currency: chargeCurrency } = await buildCharge(total);
	const callbackUrl = `${return_origin || ""}/dashboard?distributor_order=${reference}`;

	let paystackRes;
	try {
		paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${getPaystackSecretKey()}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email,
				amount: amountInCents,
				currency: chargeCurrency,
				reference,
				callback_url: callbackUrl,
				metadata: {
					order_id: order.id,
					custom_fields: [
						{ display_name: "Distributor Order", variable_name: "dist_order", value: reference },
					],
				},
			}),
		});
	} catch (err) {
		return res.status(502).json({ error: `Paystack initialize failed: ${err.message}` });
	}

	if (!paystackRes.ok) {
		const body = await paystackRes.text();
		return res.status(502).json({ error: `Paystack initialize failed: ${paystackRes.status} — ${body}` });
	}

	const data = await paystackRes.json();
	if (!data.status || !data.data?.authorization_url) {
		return res.status(502).json({ error: "Paystack initialize returned no authorization URL." });
	}

	try {
		await prisma.order.update({
			where: { id: order.id },
			data: { paystackAccessCode: data.data.access_code || "" },
		});
	} catch (_) {
		/* non-fatal */
	}

	res.json({
		configured: true,
		order_id: order.id,
		reference,
		authorization_url: data.data.authorization_url,
		access_code: data.data.access_code,
	});
});

// GET /paystack/verify?reference=...
router.get("/verify", async (req, res) => {
	const { reference } = req.query;
	if (!reference) return res.status(422).json({ error: "reference is required" });

	const isTicket = String(reference).startsWith("PEL-MG-");
	const isSponsorship = String(reference).startsWith("PEL-SP-");

	if (!isIntegrationConfigured("PAYSTACK_SECRET_KEY")) {
		try {
			if (isTicket) {
				const ticket = await prisma.meetAndGreetTicket.findFirst({ where: { paymentReference: reference } });
				if (!ticket) return res.status(404).json({ error: "Record not found" });
				return res.json({ configured: false, kind: "ticket", ticket_id: ticket.id, reference, payment_status: ticket.paymentStatus || "pending" });
			}
			const order = await prisma.order.findFirst({ where: { paymentReference: reference } });
			if (!order) return res.status(404).json({ error: "Record not found" });
			return res.json({
				configured: false, kind: "order", order_id: order.id, reference,
				payment_status: order.paymentStatus, email: order.email, total_price: order.totalPrice,
				currency: order.currency, items_summary: order.itemsSummary, order_status: order.orderStatus,
			});
		} catch (_) {
			return res.status(404).json({ error: `Record not found for reference ${reference}` });
		}
	}

	let verifyRes;
	try {
		verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
			headers: { Authorization: `Bearer ${getPaystackSecretKey()}` },
		});
	} catch (err) {
		return res.status(502).json({ error: `Paystack verify failed: ${err.message}` });
	}

	if (!verifyRes.ok) {
		const body = await verifyRes.text();
		return res.status(502).json({ error: `Paystack verify failed: ${verifyRes.status} — ${body}` });
	}

	const data = await verifyRes.json();
	const success = data.status && data.data?.status === "success";

	if (!success) {
		try {
			if (isSponsorship) {
				const s = await prisma.sponsorship.findFirst({ where: { paymentReference: reference } });
				if (s) await prisma.sponsorship.update({ where: { id: s.id }, data: { paymentStatus: "failed" } });
			} else if (isTicket) {
				const t = await prisma.meetAndGreetTicket.findFirst({ where: { paymentReference: reference } });
				if (t) await prisma.meetAndGreetTicket.update({ where: { id: t.id }, data: { paymentStatus: "failed" } });
			} else {
				const o = await prisma.order.findFirst({ where: { paymentReference: reference } });
				if (o) await prisma.order.update({ where: { id: o.id }, data: { paymentStatus: "failed" } });
			}
		} catch (_) { /* ignore */ }
		const kind = isSponsorship ? "sponsorship" : isTicket ? "ticket" : "order";
		return res.json({ configured: true, kind, reference, payment_status: "failed" });
	}

	if (isSponsorship) {
		const sponsorship = await markSponsorshipPaid(reference);
		return res.json({ configured: true, kind: "sponsorship", sponsorship_id: sponsorship?.id, reference, payment_status: "paid" });
	}

	if (isTicket) {
		const ticket = await markTicketPaid(reference);
		return res.json({ configured: true, kind: "ticket", ticket_id: ticket?.id, reference, payment_status: "paid" });
	}

	const order = await markOrderPaid(reference);
	res.json({
		configured: true, kind: "order", order_id: order?.id, reference, payment_status: "paid",
		email: order?.email, total_price: order?.totalPrice, currency: order?.currency,
		items_summary: order?.itemsSummary, order_status: order?.orderStatus,
	});
});

// POST /paystack/webhook
router.post("/webhook", async (req, res) => {
	if (!isIntegrationConfigured("PAYSTACK_SECRET_KEY")) {
		return res.status(200).json({ status: "ignored" });
	}

	const crypto = await import("crypto");
	const hash = crypto
		.createHmac("sha512", getPaystackSecretKey() || "")
		.update(JSON.stringify(req.body))
		.digest("hex");

	const signature = req.headers["x-paystack-signature"] || "";
	if (hash !== signature) {
		return res.status(401).json({ error: "invalid signature" });
	}

	const event = req.body;
	if (event.event === "charge.success" && event.data?.status === "success") {
		const ref = event.data.reference;
		try {
			if (ref && String(ref).startsWith("PEL-SP-")) {
				await markSponsorshipPaid(ref);
			} else if (ref && String(ref).startsWith("PEL-MG-")) {
				await markTicketPaid(ref);
			} else {
				await markOrderPaid(ref);
			}
		} catch (err) {
			logger.error("webhook markPaid failed", err.message);
		}
	}

	res.status(200).json({ status: "ok" });
});

// POST /paystack/claim-orders
router.post("/claim-orders", async (req, res) => {
	const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
	const userId = token ? userIdFromToken(token) : null;
	if (!userId) {
		return res.status(401).json({ error: "Authentication required." });
	}

	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) return res.status(401).json({ error: "User not found." });

	const email = String(user.email || "").trim().toLowerCase();
	if (!email) return res.status(422).json({ error: "Your account has no email address." });

	const guests = await prisma.order.findMany({
		where: { email, ownerId: null },
	});

	const claimed = [];
	for (const order of guests) {
		try {
			await prisma.order.update({ where: { id: order.id }, data: { ownerId: userId } });
			claimed.push(order.id);
		} catch (err) {
			logger.error("claim-orders update failed", order.id, err.message);
		}
	}

	res.json({ claimed: claimed.length, order_ids: claimed });
});

// GET /paystack/lookup?reference=&email=
router.get("/lookup", async (req, res) => {
	const reference = String(req.query.reference || "").trim();
	const email = String(req.query.email || "").trim().toLowerCase();
	if (!reference || !email) {
		return res.status(422).json({ error: "Order reference and email are required." });
	}

	const order = await prisma.order.findFirst({
		where: { paymentReference: reference },
		include: { items: true },
	});
	if (!order) return res.status(404).json({ error: "No order found for that reference." });
	if (String(order.email || "").trim().toLowerCase() !== email) {
		return res.status(404).json({ error: "No order found for that reference and email." });
	}

	res.json({
		reference: order.paymentReference,
		email: order.email,
		payment_status: order.paymentStatus,
		order_status: order.orderStatus,
		total_price: order.totalPrice,
		currency: order.currency,
		items_summary: order.itemsSummary,
		shipping_address: order.shippingAddress,
		created: order.createdAt,
		items: order.items.map((it) => ({
			product_name: it.productName,
			quantity: it.quantity,
			total_price: it.totalPrice,
		})),
	});
});

export default router;
