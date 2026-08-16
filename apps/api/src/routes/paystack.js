import { Router } from "express";
import Pocketbase from "pocketbase";
import pocketbaseClient from "../utils/pocketbaseClient.js";
import { isIntegrationConfigured } from "../utils/integrationConfig.js";
import logger from "../utils/logger.js";

const router = Router();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PB_HOST = process.env.POCKETBASE_URL || "http://localhost:8090";

// Meet & Greet tier prices in USD major units.
const TIER_PRICES = { vip: 1000, standard: 500 };

// Per-request PocketBase client that forwards the caller's JWT, so the
// orders/order_items/meet_and_greet_tickets access rules enforce ownership
// (owner = caller).
async function userClient(token) {
  if (!token) {
    const err = new Error("Authentication required");
    err.status = 401;
    throw err;
  }
  const client = new Pocketbase(PB_HOST);
  client.autoCancellation(false);
  client.authStore.save(token, null);
  return client;
}

// Decode the user id from a PocketBase JWT (the authStore record is null
// after save(token, null), so we read it from the token payload instead).
function userIdFromToken(token) {
  try {
    const part = token.split(".")[1];
    const padded = part + "=".repeat((4 - (part.length % 4)) % 4);
    const payload = JSON.parse(Buffer.from(padded, "base64url").toString("utf8"));
    return payload.id || null;
  } catch (_) {
    return null;
  }
}

function genReference(orderId) {
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

// GET /paystack/status — is Paystack configured?
router.get("/status", (req, res) => {
  res.json({ configured: isIntegrationConfigured("PAYSTACK_SECRET_KEY") });
});

// POST /paystack/initialize — create a pending order + line items, then start
// a Paystack transaction. Body: { items: [{product_id, quantity}],
// shipping_address, email, return_origin }
router.post("/initialize", async (req, res) => {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  let client;
  try {
    client = await userClient(token);
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.message });
  }

  const { items, shipping_address: shipping, email, return_origin, country } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(422).json({ error: "Your cart is empty." });
  }
  if (!email) {
    return res.status(422).json({ error: "An email address is required." });
  }

  const userId = userIdFromToken(token);
  if (!userId) {
    return res.status(401).json({ error: "Authentication required." });
  }

  // Load products via the superuser client (broad read, including disabled).
  let total = 0;
  const lineItems = [];
  for (const line of items) {
    let product;
    try {
      product = await pocketbaseClient.collection("products").getOne(line.product_id, { requestKey: `init-prod-${line.product_id}` });
    } catch (_) {
      return res.status(422).json({ error: "One of the products in your cart is no longer available." });
    }
    // Redirect-only products (external_url) are not sold on-platform.
    if (product.external_url) {
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
      product: product.id,
      product_name: `${product.name}${variantLabel}`,
      product_format: product.format,
      product_edition: product.edition || "",
      quantity: qty,
      unit_price: unit,
      total_price: lineTotal,
    });
  }
  total = Math.round(total * 100) / 100;

  const reference = genReference();
  const summary = lineItems.map((l) => `${l.product_name} × ${l.quantity}`).join(", ");

  // Create the order as the caller (owner-scoped).
  let order;
  try {
    order = await client.collection("orders").create({
      owner: userId,
      email,
      total_price: total,
      currency: "USD",
      shipping_address: shipping || {},
      payment_status: "pending",
      payment_reference: reference,
      order_status: "pending",
      items_summary: summary,
      confirmation_sent: false,
      country: country || "",
    });
  } catch (err) {
    logger.error("order create failed", err.message);
    throw new Error(`Could not create your order: ${err.status || ""} ${err.message || ""}`);
  }

  // Create line items as the caller.
  try {
    for (let i = 0; i < lineItems.length; i++) {
      await client.collection("order_items").create(
        { ...lineItems[i], order: order.id },
        { requestKey: `init-item-${order.id}-${i}` },
      );
    }
  } catch (err) {
    logger.error("order_items create failed", err.message);
    throw new Error(`Could not save order lines: ${err.status || ""} ${err.message || ""}`);
  }

  // If Paystack is not configured yet, record the preorder and return a
  // setup state — the order exists as "pending" and shows in the dashboard.
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
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
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
    throw new Error(`Paystack initialize failed: ${err.message}`);
  }

  if (!paystackRes.ok) {
    const body = await paystackRes.text();
    throw new Error(`Paystack initialize failed: ${paystackRes.status} ${paystackRes.statusText} — ${body}`);
  }

  const data = await paystackRes.json();
  if (!data.status || !data.data?.authorization_url) {
    throw new Error(`Paystack initialize returned no authorization URL: ${JSON.stringify(data)}`);
  }

  // Persist the access code for reference.
  try {
    await pocketbaseClient.collection("orders").update(order.id, {
      paystack_access_code: data.data.access_code || "",
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

// POST /paystack/tickets/initialize — create a pending Meet & Greet ticket,
// then start a Paystack transaction. Body: { event_id, tier, email, return_origin }
router.post("/tickets/initialize", async (req, res) => {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  let client;
  try {
    client = await userClient(token);
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.message });
  }

  const { event_id, tier, email, return_origin } = req.body || {};
  if (!event_id || !tier) {
    return res.status(422).json({ error: "Event and ticket tier are required." });
  }
  if (!email) {
    return res.status(422).json({ error: "An email address is required." });
  }

  const userId = userIdFromToken(token);
  if (!userId) {
    return res.status(401).json({ error: "Authentication required." });
  }

  const price = TIER_PRICES[tier];
  if (price == null) {
    return res.status(422).json({ error: "Invalid ticket tier." });
  }

  // Load the event (superuser client) to validate it is a ticketed event.
  let event;
  try {
    event = await pocketbaseClient.collection("events").getOne(event_id, { requestKey: `ticket-event-${event_id}` });
  } catch (_) {
    return res.status(422).json({ error: "Event not found." });
  }
  if (event.event_type !== "meet_and_greet") {
    return res.status(422).json({ error: "This event is not ticketed." });
  }

  const reference = genTicketReference();
  const confirmationCode = ticketCode(tier);

  // Create the ticket as the caller (owner-scoped), held as pending until
  // Paystack confirms payment.
  let ticket;
  try {
    ticket = await client.collection("meet_and_greet_tickets").create({
      owner: userId,
      event: event_id,
      tier,
      price,
      status: "pending",
      confirmation_code: confirmationCode,
      photographer: tier === "vip",
      payment_reference: reference,
      payment_status: "pending",
    });
  } catch (err) {
    logger.error("ticket create failed", err.message);
    throw new Error(`Could not create your ticket: ${err.status || ""} ${err.message || ""}`);
  }

  // If Paystack is not configured yet, record the pending ticket and return
  // a setup state.
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
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
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
    throw new Error(`Paystack initialize failed: ${err.message}`);
  }

  if (!paystackRes.ok) {
    const body = await paystackRes.text();
    throw new Error(`Paystack initialize failed: ${paystackRes.status} ${paystackRes.statusText} — ${body}`);
  }

  const data = await paystackRes.json();
  if (!data.status || !data.data?.authorization_url) {
    throw new Error(`Paystack initialize returned no authorization URL: ${JSON.stringify(data)}`);
  }

  try {
    await pocketbaseClient.collection("meet_and_greet_tickets").update(ticket.id, {
      paystack_access_code: data.data.access_code || "",
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

// Apply a successful payment to an order: mark paid, decrement stock, log
// stock movements. Idempotent — safe to call from both verify and webhook.
async function markOrderPaid(reference, paystackRef) {
  let order;
  try {
    order = await pocketbaseClient.collection("orders").getFirstListItem(
      `payment_reference = "${reference}"`,
      { requestKey: `verify-find-${reference}` },
    );
  } catch (_) {
    return null;
  }

  if (order.payment_status === "paid") {
    return order; // already processed
  }

  await pocketbaseClient.collection("orders").update(order.id, {
    payment_status: "paid",
    order_status: "processing",
  });

  // Decrement stock for each line item + audit log.
  let lineItems = [];
  try {
    lineItems = await pocketbaseClient.collection("order_items").getFullList({
      filter: `order = "${order.id}"`,
      requestKey: `verify-items-${order.id}`,
    });
  } catch (_) {
    /* still mark paid */
  }

  for (const item of lineItems) {
    try {
      const product = await pocketbaseClient.collection("products").getOne(item.product, { requestKey: `verify-prod-${item.product}` });
      const prev = Number(product.current_stock) || 0;
      const next = Math.max(0, prev - (Number(item.quantity) || 0));
      await pocketbaseClient.collection("products").update(product.id, { current_stock: next });
      await pocketbaseClient.collection("stock_movements").create({
        product: product.id,
        quantity_change: -(Number(item.quantity) || 0),
        previous_stock: prev,
        new_stock: next,
        reason: `Order ${reference} paid`,
        created_by: order.owner,
      });
    } catch (err) {
      logger.error("stock decrement failed", "product", item.product, "err", err.message);
    }
  }

  // Reload so the confirmation hook sees payment_status = "paid".
  try {
    order = await pocketbaseClient.collection("orders").getOne(order.id, { requestKey: `verify-reload-${order.id}` });
  } catch (_) {
    /* hook fires on the update above */
  }

  return order;
}

// Apply a successful payment to a Meet & Greet ticket: mark confirmed + paid.
// Idempotent.
async function markTicketPaid(reference) {
  let ticket;
  try {
    ticket = await pocketbaseClient.collection("meet_and_greet_tickets").getFirstListItem(
      `payment_reference = "${reference}"`,
      { requestKey: `ticket-find-${reference}` },
    );
  } catch (_) {
    return null;
  }

  if (ticket.payment_status === "paid") {
    return ticket; // already processed
  }

  await pocketbaseClient.collection("meet_and_greet_tickets").update(ticket.id, {
    status: "confirmed",
    payment_status: "paid",
  });

  try {
    ticket = await pocketbaseClient.collection("meet_and_greet_tickets").getOne(ticket.id, { requestKey: `ticket-reload-${ticket.id}` });
  } catch (_) {
    /* return the pre-reload value */
  }

  return ticket;
}

// GET /paystack/verify?reference=... — called by the frontend after Paystack
// redirects back. Verifies with Paystack and marks the order OR ticket paid.
router.get("/verify", async (req, res) => {
  const { reference } = req.query;
  if (!reference) {
    return res.status(422).json({ error: "reference is required" });
  }

  const isTicket = String(reference).startsWith("PEL-MG-");

  if (!isIntegrationConfigured("PAYSTACK_SECRET_KEY")) {
    // No key: nothing to verify, but the record already exists as pending.
    try {
      if (isTicket) {
        const ticket = await pocketbaseClient.collection("meet_and_greet_tickets").getFirstListItem(
          `payment_reference = "${reference}"`,
          { requestKey: `verify-ticket-nok-${reference}` },
        );
        return res.json({ configured: false, kind: "ticket", ticket_id: ticket.id, reference, payment_status: ticket.payment_status || "pending" });
      }
      const order = await pocketbaseClient.collection("orders").getFirstListItem(
        `payment_reference = "${reference}"`,
        { requestKey: `verify-nok-${reference}` },
      );
      return res.json({ configured: false, kind: "order", order_id: order.id, reference, payment_status: order.payment_status });
    } catch (_) {
      throw new Error(`Record not found for reference ${reference}`);
    }
  }

  let verifyRes;
  try {
    verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    });
  } catch (err) {
    throw new Error(`Paystack verify failed: ${err.message}`);
  }

  if (!verifyRes.ok) {
    const body = await verifyRes.text();
    throw new Error(`Paystack verify failed: ${verifyRes.status} ${verifyRes.statusText} — ${body}`);
  }

  const data = await verifyRes.json();
  const success = data.status && data.data?.status === "success";

  if (!success) {
    // Mark failed but keep the record.
    try {
      if (isTicket) {
        const t = await pocketbaseClient.collection("meet_and_greet_tickets").getFirstListItem(`payment_reference = "${reference}"`, { requestKey: `verify-ticket-fail-${reference}` });
        await pocketbaseClient.collection("meet_and_greet_tickets").update(t.id, { payment_status: "failed" });
      } else {
        await pocketbaseClient.collection("orders").update(
          (await pocketbaseClient.collection("orders").getFirstListItem(`payment_reference = "${reference}"`, { requestKey: `verify-fail-${reference}` })).id,
          { payment_status: "failed" },
        );
      }
    } catch (_) {
      /* ignore */
    }
    return res.json({ configured: true, kind: isTicket ? "ticket" : "order", reference, payment_status: "failed" });
  }

  if (isTicket) {
    const ticket = await markTicketPaid(reference);
    return res.json({ configured: true, kind: "ticket", ticket_id: ticket?.id, reference, payment_status: "paid" });
  }

  const order = await markOrderPaid(reference, data.data);
  res.json({ configured: true, kind: "order", order_id: order?.id, reference, payment_status: "paid" });
});

// POST /paystack/webhook — Paystack event callback.
router.post("/webhook", async (req, res) => {
  const secret = PAYSTACK_SECRET_KEY;
  if (!isIntegrationConfigured("PAYSTACK_SECRET_KEY")) {
    return res.status(200).json({ status: "ignored" });
  }

  const crypto = await import("crypto");
  const hash = crypto
    .createHmac("sha512", secret)
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
        await markOrderPaid(ref, event.data);
      }
    } catch (err) {
      logger.error("webhook markPaid failed", err.message);
    }
  }

  res.status(200).json({ status: "ok" });
});

export default router;
