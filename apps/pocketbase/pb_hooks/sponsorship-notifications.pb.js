/// <reference path="../pb_data/types.d.ts" />

// Notify sponsors when their application is approved or rejected.
onRecordAfterUpdateSuccess((e) => {
  const status = e.record.get("status");
  const email = e.record.get("email");
  const company = e.record.get("company_name");

  if (!email || (status !== "approved" && status !== "rejected")) {
    e.next();
    return;
  }

  const subject =
    status === "approved"
      ? "Your sponsorship has been approved — Pete Edochie Legacy"
      : "Update on your sponsorship application — Pete Edochie Legacy";

  const html =
    status === "approved"
      ? `<h2>Sponsorship approved</h2><p>Dear ${company},</p><p>Your sponsorship application to the Pete Edochie Legacy has been approved by King Dawie Publishing. A partnership director will be in touch with your invoice, brand assets and event invitations.</p><p>You can track your sponsorship from your sponsor dashboard.</p>`
      : `<h2>Sponsorship application update</h2><p>Dear ${company},</p><p>Thank you for your interest in partnering with the Pete Edochie Legacy. After review, we are unable to proceed with your sponsorship at this time. You are welcome to reapply for a future cycle.</p>`;

  try {
    const message = new MailerMessage({
      from: { name: "King Dawie Publishing" },
      to: [{ address: email }],
      subject,
      html,
    });
    $app.newMailClient().send(message);
  } catch (err) {
    $app.logger().error("sponsorship notification failed", "to", email, "err", String(err));
  }

  e.next();
}, "sponsorships");
