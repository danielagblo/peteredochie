import { Router } from "express";
import prisma from "../utils/prisma.js";
import { isIntegrationConfigured } from "../utils/integrationConfig.js";
import { decodeToken, verifyToken } from "../utils/token.js";
import logger from "../utils/logger.js";
import { sendEmail } from "../utils/email.js";

const router = Router();

const getPaystackSecretKey = () => process.env.PAYSTACK_SECRET_KEY;

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

	return updated;
}

async function markTicketPaid(reference) {
	const ticket = await prisma.meetAndGreetTicket.findFirst({
		where: { paymentReference: reference },
	});
	if (!ticket) return null;
	if (ticket.paymentStatus === "paid") {
		return ticket; // already processed
	}
	return prisma.meetAndGreetTicket.update({
		where: { id: ticket.id },
		data: { status: "confirmed", paymentStatus: "paid" },
	});
}

// ─── Routes ──────────────────────────────────────────────────────────────

// GET /paystack/status
router.get("/status", (req, res) => {
	res.json({ configured: isIntegrationConfigured("PAYSTACK_SECRET_KEY") });
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

	const amountInCents = Math.round(total * 100);
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
				currency: "USD",
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

	const amountInCents = Math.round(price * 100);
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
				currency: "USD",
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

// GET /paystack/verify?reference=...
router.get("/verify", async (req, res) => {
	const { reference } = req.query;
	if (!reference) return res.status(422).json({ error: "reference is required" });

	const isTicket = String(reference).startsWith("PEL-MG-");

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
			if (isTicket) {
				const t = await prisma.meetAndGreetTicket.findFirst({ where: { paymentReference: reference } });
				if (t) await prisma.meetAndGreetTicket.update({ where: { id: t.id }, data: { paymentStatus: "failed" } });
			} else {
				const o = await prisma.order.findFirst({ where: { paymentReference: reference } });
				if (o) await prisma.order.update({ where: { id: o.id }, data: { paymentStatus: "failed" } });
			}
		} catch (_) { /* ignore */ }
		return res.json({ configured: true, kind: isTicket ? "ticket" : "order", reference, payment_status: "failed" });
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
			if (ref && String(ref).startsWith("PEL-MG-")) {
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
