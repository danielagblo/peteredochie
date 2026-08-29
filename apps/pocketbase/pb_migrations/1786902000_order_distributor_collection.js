/// <reference path="../pb_data/types.d.ts" />

const FULFILLMENT = ["ship", "distributor_collection"];

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    const countries = app.findCollectionByNameOrId("countries");

    const addUserField = (name, field) => {
      if (!users.fields.getByName(name)) users.fields.add(field);
    };

    addUserField(
      "assigned_country",
      new RelationField({
        name: "assigned_country",
        maxSelect: 1,
        collectionId: countries.id,
        cascadeDelete: false,
      }),
    );
    addUserField(
      "collection_address",
      new TextField({ name: "collection_address", max: 500 }),
    );
    addUserField(
      "collection_hours",
      new TextField({ name: "collection_hours", max: 200 }),
    );
    app.save(users);

    if (!countries.fields.getByName("primary_distributor")) {
      countries.fields.add(
        new RelationField({
          name: "primary_distributor",
          maxSelect: 1,
          collectionId: users.id,
          cascadeDelete: false,
        }),
      );
      app.save(countries);
    }

    const patchCollection = (name) => {
      const col = app.findCollectionByNameOrId(name);
      if (!col.fields.getByName("country")) {
        col.fields.add(new TextField({ name: "country", max: 3 }));
      }
      if (!col.fields.getByName("distributor")) {
        col.fields.add(
          new RelationField({
            name: "distributor",
            maxSelect: 1,
            collectionId: users.id,
            cascadeDelete: false,
          }),
        );
      }
      if (!col.fields.getByName("fulfillment_method")) {
        col.fields.add(
          new SelectField({
            name: "fulfillment_method",
            maxSelect: 1,
            values: FULFILLMENT,
          }),
        );
      }
      app.save(col);
    };

    patchCollection("orders");
    patchCollection("meet_and_greet_tickets");
    patchCollection("event_registrations");
  },
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    ["assigned_country", "collection_address", "collection_hours"].forEach((name) => {
      if (users.fields.getByName(name)) users.fields.removeByName(name);
    });
    app.save(users);

    const countries = app.findCollectionByNameOrId("countries");
    if (countries.fields.getByName("primary_distributor")) {
      countries.fields.removeByName("primary_distributor");
      app.save(countries);
    }

    ["orders", "meet_and_greet_tickets", "event_registrations"].forEach((name) => {
      const col = app.findCollectionByNameOrId(name);
      ["country", "distributor", "fulfillment_method"].forEach((field) => {
        if (col.fields.getByName(field)) col.fields.removeByName(field);
      });
      app.save(col);
    });
  },
);
