/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    // ---- Add admin-portal fields to users (idempotent) ----
    const addField = (name, field) => {
      if (!users.fields.getByName(name)) {
        users.fields.add(field);
      }
    };

    addField("last_login", new DateField({ name: "last_login" }));
    addField(
      "login_history",
      new JSONField({ name: "login_history", maxSize: 30000 }),
    );
    addField("must_change_password", new BoolField({ name: "must_change_password" }));
    addField(
      "staff_status",
      new SelectField({
        name: "staff_status",
        maxSelect: 1,
        values: ["active", "inactive"],
      }),
    );
    addField("country_assignment", new TextField({ name: "country_assignment", max: 100 }));

    // ---- Tighten access rules so super_admin (via staff_role) can manage users ----
    users.listRule =
      "id = @request.auth.id || @request.auth.account_type = 'admin' || @request.auth.staff_role = 'super_admin'";
    users.viewRule =
      "id = @request.auth.id || @request.auth.account_type = 'admin' || @request.auth.staff_role = 'super_admin'";
    users.updateRule =
      "id = @request.auth.id || @request.auth.account_type = 'admin' || @request.auth.staff_role = 'super_admin'";
    users.deleteRule =
      "id = @request.auth.id || @request.auth.staff_role = 'super_admin'";

    app.save(users);

    // ---- Seed the dummy super admin ----
    let admin;
    try {
      admin = app.findAuthRecordByEmail("users", "admin@kingdawiepublishing.com");
    } catch (_) {
      admin = new Record(users);
      admin.setEmail("admin@kingdawiepublishing.com");
      admin.setPassword("Admin@123");
      admin.set("name", "Platform Administrator");
      admin.set("account_type", "admin");
      admin.set("staff_role", "super_admin");
      admin.set("staff_status", "active");
      admin.set("verified", true);
      admin.set("approval_status", "approved");
      admin.set("must_change_password", false);
      app.save(admin);
    }
  },
  (app) => {
    try {
      const admin = app.findAuthRecordByEmail(
        "users",
        "admin@kingdawiepublishing.com",
      );
      app.delete(admin);
    } catch (_) {
      /* already gone */
    }
  },
);
