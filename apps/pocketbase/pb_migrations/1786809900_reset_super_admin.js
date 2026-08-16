/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    const email = "admin@kingdawiepublishing.com";

    let admin;
    try {
      admin = app.findAuthRecordByEmail("users", email);
    } catch (_) {
      admin = new Record(users);
      admin.setEmail(email);
    }

    admin.setPassword("Admin@123");
    admin.set("name", "Platform Administrator");
    admin.set("account_type", "admin");
    admin.set("staff_role", "super_admin");
    admin.set("staff_status", "active");
    admin.set("approval_status", "approved");
    admin.set("must_change_password", false);
    admin.set("verified", true);
    app.save(admin);
  },
  (app) => {
    /* password reset is not reverted */
  },
);
