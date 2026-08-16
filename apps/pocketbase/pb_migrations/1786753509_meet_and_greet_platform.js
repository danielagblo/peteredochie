/// <reference path="../pb_data/types.d.ts" />

migrate(
    (app) => {
        const users = app.findCollectionByNameOrId("users");

        // --- events: add event_type, invitation_only, ends, price, ticket_tiers ---
        const events = app.findCollectionByNameOrId("events");
        if (!events.fields.getByName("event_type")) {
            events.fields.add(
                new SelectField({
                    name: "event_type",
                    maxSelect: 1,
                    values: ["ghana_launch", "masterclass", "meet_and_greet"],
                }),
            );
        }
        if (!events.fields.getByName("invitation_only")) {
            events.fields.add(new BoolField({ name: "invitation_only" }));
        }
        if (!events.fields.getByName("ends")) {
            events.fields.add(new DateField({ name: "ends" }));
        }
        if (!events.fields.getByName("price")) {
            events.fields.add(new TextField({ name: "price", max: 60 }));
        }
        if (!events.fields.getByName("ticket_tiers")) {
            events.fields.add(new JSONField({ name: "ticket_tiers", maxSize: 20000 }));
        }
        app.save(events);

        // --- replace seeded events with the three core events ---
        const oldEvents = app.findRecordsByFilter("events", "id != ''");
        for (const r of oldEvents) {
            try {
                app.delete(r);
            } catch (_) {
                /* ignore */
            }
        }

        const coreEvents = [
            {
                title: "Ghana Launch — An Evening with Pete Edochie",
                city: "Accra, Ghana",
                venue: "Accra International Conference Centre",
                starts: "2026-11-14 19:00:00.000Z",
                ends: "2026-11-14 22:00:00.000Z",
                summary:
                    "The official Ghana launch of the Pete Edochie Legacy platform. A private evening of conversation, archive readings and cultural reflection. Strictly by invitation — no public registration or ticketing.",
                category: "Launch",
                event_type: "ghana_launch",
                invitation_only: true,
                price: "By invitation",
                image: "https://images.hostinger.com/3fb9501e-28bc-4e82-89a5-3377eb9f780b.png",
            },
            {
                title: "MasterClass & Lecture — The Craft of the African Storyteller",
                city: "Lagos, Nigeria",
                venue: "MUSON Centre, Onikan",
                starts: "2026-12-05 10:00:00.000Z",
                ends: "2026-12-05 13:00:00.000Z",
                summary:
                    "An open masterclass and lecture on voice, discipline and cultural memory, delivered to a hall of registered attendees. Registration is free and open to all members. A confirmation and QR pass are issued to your dashboard.",
                category: "MasterClass",
                event_type: "masterclass",
                invitation_only: false,
                price: "Free",
                image: "https://images.hostinger.com/f9bbc10b-9993-4be6-bb20-0f31a23fd314.png",
            },
            {
                title: "Meet & Greet with Pete Edochie",
                city: "Abuja, Nigeria",
                venue: "Transcorp Hilton, Abuja",
                starts: "2027-01-23 18:00:00.000Z",
                ends: "2027-01-23 21:00:00.000Z",
                summary:
                    "An intimate evening with Pete Edochie. Two ticket tiers: VIP includes one-on-one exclusive access with a professional photographer on standby (photos included); Standard is a group address and conversation. QR passes are issued on confirmation.",
                category: "Meet & Greet",
                event_type: "meet_and_greet",
                invitation_only: false,
                price: "From USD 500",
                ticket_tiers: [
                    { tier: "vip", price: 1000, slot_limit: 50, attendee_count: 0, label: "VIP" },
                    { tier: "standard", price: 500, slot_limit: 200, attendee_count: 0, label: "Standard" },
                ],
                image: "https://images.hostinger.com/64c337f2-f627-4055-9d43-d348d976dc63.png",
            },
        ];
        for (const data of coreEvents) {
            const r = new Record(events);
            r.load(data);
            app.save(r);
        }

        // --- meet_and_greet_tickets: per-attendee ticket (owner-scoped) ---
        try {
            app.findCollectionByNameOrId("meet_and_greet_tickets");
        } catch (_) {
            const tickets = new Collection({
                type: "base",
                name: "meet_and_greet_tickets",
                listRule: "@request.auth.id != '' && @request.auth.id = owner",
                viewRule: "@request.auth.id != '' && @request.auth.id = owner",
                createRule: "@request.auth.id != '' && @request.auth.id = @request.body.owner",
                updateRule: "@request.auth.id != '' && @request.auth.id = owner",
                deleteRule: "@request.auth.id != '' && @request.auth.id = owner",
                fields: [
                    {
                        name: "owner",
                        type: "relation",
                        required: true,
                        maxSelect: 1,
                        collectionId: users.id,
                        cascadeDelete: true,
                    },
                    {
                        name: "event",
                        type: "relation",
                        required: true,
                        maxSelect: 1,
                        collectionId: events.id,
                        cascadeDelete: true,
                    },
                    {
                        name: "tier",
                        type: "select",
                        required: true,
                        maxSelect: 1,
                        values: ["vip", "standard"],
                    },
                    { name: "price", type: "number" },
                    {
                        name: "status",
                        type: "select",
                        maxSelect: 1,
                        values: ["confirmed", "checked_in", "cancelled"],
                    },
                    { name: "confirmation_code", type: "text", max: 40 },
                    { name: "photographer", type: "bool" },
                    { name: "created", type: "autodate", onCreate: true, onUpdate: false },
                    { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
                ],
                indexes: [
                    "CREATE INDEX `idx_mg_tickets_owner` ON `meet_and_greet_tickets` (`owner`)",
                    "CREATE INDEX `idx_mg_tickets_event` ON `meet_and_greet_tickets` (`event`)",
                ],
            });
            app.save(tickets);
        }

        // --- event_registrations: masterclass registration (owner-scoped) ---
        try {
            app.findCollectionByNameOrId("event_registrations");
        } catch (_) {
            const regs = new Collection({
                type: "base",
                name: "event_registrations",
                listRule: "@request.auth.id != '' && @request.auth.id = owner",
                viewRule: "@request.auth.id != '' && @request.auth.id = owner",
                createRule: "@request.auth.id != '' && @request.auth.id = @request.body.owner",
                updateRule: "@request.auth.id != '' && @request.auth.id = owner",
                deleteRule: "@request.auth.id != '' && @request.auth.id = owner",
                fields: [
                    {
                        name: "owner",
                        type: "relation",
                        required: true,
                        maxSelect: 1,
                        collectionId: users.id,
                        cascadeDelete: true,
                    },
                    {
                        name: "event",
                        type: "relation",
                        required: true,
                        maxSelect: 1,
                        collectionId: events.id,
                        cascadeDelete: true,
                    },
                    {
                        name: "status",
                        type: "select",
                        maxSelect: 1,
                        values: ["registered", "checked_in", "cancelled"],
                    },
                    { name: "confirmation_code", type: "text", max: 40 },
                    { name: "created", type: "autodate", onCreate: true, onUpdate: false },
                    { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
                ],
                indexes: [
                    "CREATE INDEX `idx_event_regs_owner` ON `event_registrations` (`owner`)",
                    "CREATE INDEX `idx_event_regs_event` ON `event_registrations` (`event`)",
                ],
            });
            app.save(regs);
        }

        // --- mentorship_applications: add owner + status + cohort, owner-or-admin reads ---
        const mentorship = app.findCollectionByNameOrId("mentorship_applications");
        if (!mentorship.fields.getByName("owner")) {
            mentorship.fields.add(
                new RelationField({
                    name: "owner",
                    maxSelect: 1,
                    collectionId: users.id,
                    cascadeDelete: true,
                }),
            );
        }
        if (!mentorship.fields.getByName("status")) {
            mentorship.fields.add(
                new SelectField({
                    name: "status",
                    maxSelect: 1,
                    values: ["pending", "accepted", "rejected"],
                }),
            );
        }
        if (!mentorship.fields.getByName("cohort")) {
            mentorship.fields.add(new TextField({ name: "cohort", max: 20 }));
        }
        mentorship.listRule = "@request.auth.id != '' && (@request.auth.id = owner || @request.auth.account_type = 'admin')";
        mentorship.viewRule = "@request.auth.id != '' && (@request.auth.id = owner || @request.auth.account_type = 'admin')";
        mentorship.createRule = "@request.auth.id != '' && @request.auth.id = @request.body.owner";
        mentorship.updateRule = "@request.auth.account_type = 'admin'";
        mentorship.deleteRule = "@request.auth.account_type = 'admin'";
        app.save(mentorship);
    },
    (app) => {
        for (const name of ["meet_and_greet_tickets", "event_registrations"]) {
            try {
                app.delete(app.findCollectionByNameOrId(name));
            } catch (e) {
                if (!String(e.message).includes("no rows in result set")) throw e;
            }
        }
        try {
            const mentorship = app.findCollectionByNameOrId("mentorship_applications");
            ["owner", "status", "cohort"].forEach((f) => mentorship.fields.removeByName(f));
            mentorship.listRule = "@request.auth.account_type = 'admin'";
            mentorship.viewRule = "@request.auth.account_type = 'admin'";
            mentorship.createRule = "";
            mentorship.updateRule = null;
            mentorship.deleteRule = null;
            app.save(mentorship);
        } catch (e) {
            if (!String(e.message).includes("no rows in result set")) throw e;
        }
        try {
            const events = app.findCollectionByNameOrId("events");
            ["event_type", "invitation_only", "ends", "price", "ticket_tiers"].forEach((f) =>
                events.fields.removeByName(f),
            );
            app.save(events);
        } catch (e) {
            if (!String(e.message).includes("no rows in result set")) throw e;
        }
    },
);
