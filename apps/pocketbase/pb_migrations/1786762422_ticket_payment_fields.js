/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("meet_and_greet_tickets");

    // Add a "pending" option to the status select so unpaid tickets can be
    // held until Paystack confirms payment.
    const statusField = collection.fields.getByName("status");
    if (statusField && Array.isArray(statusField.values) && !statusField.values.includes("pending")) {
      statusField.values = [...statusField.values, "pending"];
    }

    // Payment tracking fields.
    if (!collection.fields.getByName("payment_reference")) {
      collection.fields.add(
        new TextField({ name: "payment_reference", max: 120 }),
      );
    }
    if (!collection.fields.getByName("payment_status")) {
      collection.fields.add(
        new SelectField({
          name: "payment_status",
          maxSelect: 1,
          values: ["pending", "paid", "failed"],
        }),
      );
    }
    if (!collection.fields.getByName("paystack_access_code")) {
      collection.fields.add(
        new TextField({ name: "paystack_access_code", max: 120 }),
      );
    }

    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("meet_and_greet_tickets");

    const statusField = collection.fields.getByName("status");
    if (statusField && Array.isArray(statusField.values)) {
      statusField.values = statusField.values.filter((v) => v !== "pending");
    }

    ["payment_reference", "payment_status", "paystack_access_code"].forEach(
      (name) => {
        if (collection.fields.getByName(name)) {
          collection.fields.removeByName(name);
        }
      },
    );

    app.save(collection);
  },
);
