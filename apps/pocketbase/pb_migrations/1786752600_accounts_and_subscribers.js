/// <reference path="../pb_data/types.d.ts" />

migrate(
    (app) => {
        const users = app.findCollectionByNameOrId("users");

        if (!users.fields.getByName("account_type")) {
            users.fields.add(
                new SelectField({
                    name: "account_type",
                    maxSelect: 1,
                    values: ["subscriber", "distributor", "sponsor", "admin"],
                }),
            );
        }
        if (!users.fields.getByName("approval_status")) {
            users.fields.add(
                new SelectField({
                    name: "approval_status",
                    maxSelect: 1,
                    values: ["not_required", "pending", "approved", "rejected"],
                }),
            );
        }
        if (!users.fields.getByName("organisation")) {
            users.fields.add(new TextField({ name: "organisation", max: 160 }));
        }
        if (!users.fields.getByName("country")) {
            users.fields.add(new TextField({ name: "country", max: 100 }));
        }
        if (!users.fields.getByName("phone")) {
            users.fields.add(new TextField({ name: "phone", max: 40 }));
        }
        if (!users.fields.getByName("territory")) {
            users.fields.add(new TextField({ name: "territory", max: 200 }));
        }
        if (!users.fields.getByName("newsletter")) {
            users.fields.add(new BoolField({ name: "newsletter" }));
        }
        if (!users.fields.getByName("interests")) {
            users.fields.add(new JSONField({ name: "interests", maxSize: 20000 }));
        }
        const adminOr = (base) => base + " || @request.auth.account_type = 'admin'";
        users.listRule = adminOr("id = @request.auth.id");
        users.viewRule = adminOr("id = @request.auth.id");
        users.updateRule = adminOr("id = @request.auth.id");
        app.save(users);

        ["events", "news"].forEach((name) => {
            const c = app.findCollectionByNameOrId(name);
            c.createRule = "@request.auth.account_type = 'admin'";
            c.updateRule = "@request.auth.account_type = 'admin'";
            c.deleteRule = "@request.auth.account_type = 'admin'";
            app.save(c);
        });

        ["enquiries", "mentorship_applications"].forEach((name) => {
            const c = app.findCollectionByNameOrId(name);
            c.listRule = "@request.auth.account_type = 'admin'";
            c.viewRule = "@request.auth.account_type = 'admin'";
            app.save(c);
        });

        let subscribers;
        try {
            subscribers = app.findCollectionByNameOrId("subscribers");
        } catch (_) {
            subscribers = new Collection({
                type: "base",
                name: "subscribers",
                listRule: "@request.auth.account_type = 'admin'",
                viewRule: "@request.auth.account_type = 'admin'",
                createRule: "",
                updateRule: null,
                deleteRule: null,
                fields: [
                    { name: "email", type: "email", required: true },
                    { name: "name", type: "text", max: 120 },
                    { name: "country", type: "text", max: 100 },
                    { name: "interests", type: "json", maxSize: 20000 },
                    { name: "created", type: "autodate", onCreate: true, onUpdate: false },
                    { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
                ],
                indexes: [
                    "CREATE UNIQUE INDEX `idx_subscribers_email` ON `subscribers` (`email`)",
                ],
            });
            app.save(subscribers);
        }
    },
    (app) => {
        try {
            const subscribers = app.findCollectionByNameOrId("subscribers");
            app.delete(subscribers);
        } catch (e) {
            if (!String(e.message).includes("no rows in result set")) throw e;
        }
        const users = app.findCollectionByNameOrId("users");
        ["account_type", "approval_status", "organisation", "country", "phone", "territory", "newsletter", "interests"].forEach(
            (f) => users.fields.removeByName(f),
        );
        app.save(users);
    },
);
