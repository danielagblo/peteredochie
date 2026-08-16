/// <reference path="../pb_data/types.d.ts" />

// Sends an order confirmation email the moment an order is marked "paid".
// Idempotent: guarded by the `confirmation_sent` flag so a webhook + a
// verify callback (both update the same record) never double-send.

onRecordAfterUpdateSuccess((e) => {
  const order = e.record;
  const paymentStatus = order.getString("payment_status");

  if (paymentStatus !== "paid") {
    e.next();
    return;
  }
  if (order.getBool("confirmation_sent")) {
    e.next();
    return;
  }

  const recipient = order.getString("email");
  if (!recipient) {
    e.next();
    return;
  }

  // Gather line items for the email body.
  let itemsHtml = "";
  let itemsText = "";
  try {
    const items = $app.findRecordsByFilter(
      "order_items",
      "order = {:orderId}",
      "",
      100,
      0,
      { orderId: order.id },
    );
    for (const item of items) {
      const name = item.getString("product_name");
      const qty = item.getInt("quantity");
      const total = item.getFloat("total_price");
      itemsHtml += `<tr><td style="padding:6px 0">${name} × ${qty}</td><td style="padding:6px 0;text-align:right">USD ${total.toFixed(2)}</td></tr>`;
      itemsText += `- ${name} × ${qty} — USD ${total.toFixed(2)}\n`;
    }
  } catch (err) {
    $app.logger().error("order email: load items failed", "err", String(err));
  }

  const total = order.getFloat("total_price");
  const reference = order.getString("payment_reference");
  const orderStatus = order.getString("order_status");

  const message = new MailerMessage({
    from: { name: "King Dawie Publishing" },
    to: [{ address: recipient }],
    subject: `Order confirmed — ${reference || order.id}`,
    html: `
      <h1 style="font-family:Georgia,serif">Your order is confirmed</h1>
      <p>Thank you for preordering from the Pete Edochie Legacy platform.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${itemsHtml}</table>
      <p style="margin-top:16px"><strong>Total:</strong> USD ${total.toFixed(2)}</p>
      <p><strong>Payment reference:</strong> ${reference || "—"}</p>
      <p><strong>Order status:</strong> ${orderStatus}</p>
      <p style="margin-top:16px;color:#666">You can track this order in your dashboard under “Orders”.</p>
      <p style="margin-top:24px;font-size:12px;color:#999">© King Dawie Publishing. All rights reserved.</p>
    `,
    text: `Your order is confirmed.\n\n${itemsText}\nTotal: USD ${total.toFixed(2)}\nPayment reference: ${reference || "—"}\nOrder status: ${orderStatus}\n\nTrack this order in your dashboard.\n\n© King Dawie Publishing.`,
  });

  try {
    $app.newMailClient().send(message);
    order.set("confirmation_sent", true);
    $app.save(order);
  } catch (err) {
    $app.logger().error("order confirmation email failed", "to", recipient, "err", String(err));
  }

  e.next();
}, "orders");
