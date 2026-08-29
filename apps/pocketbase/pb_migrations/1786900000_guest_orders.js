/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const orders = app.findCollectionByNameOrId("orders");
    const owner = orders.fields.getByName("owner");
    if (owner) {
      owner.required = false;
      // Keep guest orders when a linked account is later deleted.
      owner.cascadeDelete = false;
    }
    app.save(orders);
  },
  (app) => {
    const orders = app.findCollectionByNameOrId("orders");
    const owner = orders.fields.getByName("owner");
    if (owner) {
      owner.required = true;
      owner.cascadeDelete = true;
    }
    app.save(orders);
  },
);
