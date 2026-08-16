/// <reference path="../pb_data/types.d.ts" />

// Only a Super Admin (staff_role = 'super_admin') may grant or change staff
// roles / account types. Self-signups and non-super-admin profile edits are
// stripped of any privileged fields so the role system cannot be escalated
// from the client.

onRecordCreateRequest((e) => {
  const isSuperAdmin = (auth) =>
    !!auth &&
    (auth.get("staff_role") === "super_admin" ||
      auth.get("account_type") === "admin");

  const info = e.requestInfo();
  if (!isSuperAdmin(info.auth)) {
    if (e.record.get("account_type") === "admin") {
      e.record.set("account_type", "subscriber");
    }
    if (e.record.get("staff_role")) {
      e.record.set("staff_role", "");
    }
    if (e.record.get("staff_status") && e.record.get("staff_status") !== "inactive") {
      e.record.set("staff_status", "inactive");
    }
    e.record.set("must_change_password", false);
  }
  e.next();
}, "users");

// Staff accounts created by a Super Admin are pre-verified. `verified` is a
// system field that cannot be set through an API request payload, so it is
// applied server-side after the record has been created.
onRecordAfterCreateSuccess((e) => {
  try {
    if (e.record.get("staff_role") && !e.record.get("verified")) {
      e.record.set("verified", true);
      $app.save(e.record);
    }
  } catch (err) {
    $app.logger().error("staff verify failed", "err", String(err));
  }
  e.next();
}, "users");

onRecordUpdateRequest((e) => {
  const isSuperAdmin = (auth) =>
    !!auth &&
    (auth.get("staff_role") === "super_admin" ||
      auth.get("account_type") === "admin");

  const info = e.requestInfo();
  if (!isSuperAdmin(info.auth)) {
    // Preserve the existing privileged fields — a non-super-admin cannot
    // escalate themselves or change another employee's role.
    let existing = null;
    try {
      existing = $app.findRecordById("users", e.record.id);
    } catch (_) {
      existing = null;
    }
    if (existing) {
      e.record.set("staff_role", existing.get("staff_role") || "");
      e.record.set("account_type", existing.get("account_type") || "subscriber");
      e.record.set("staff_status", existing.get("staff_status") || "inactive");
    }
  }
  e.next();
}, "users");
