/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const SUPER_ADMIN_EMAIL = "admin@kingdawiepublishing.com";

    // Find every user record that is NOT the Super Admin and delete it.
    // Related rows (employee_roles, orders, tickets, etc.) cascade-delete
    // because their `owner`/`user` relations have cascadeDelete: true.
    let users;
    try {
      users = app.findRecordsByFilter(
        "users",
        `email != "${SUPER_ADMIN_EMAIL}"`,
      );
    } catch (e) {
      if (e.message && e.message.includes("no rows in result set")) {
        console.log("No non-super-admin users to delete.");
        return;
      }
      throw e;
    }

    let deleted = 0;
    for (const record of users) {
      app.delete(record);
      deleted += 1;
    }
    console.log(`Purged ${deleted} non-super-admin user account(s).`);
  },
  (app) => {
    // Deleted user accounts cannot be restored.
  },
);
