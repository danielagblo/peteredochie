/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    // Add a staff_role field to users so access rules can enforce employee
    // permissions server-side (the employee_roles collection is the admin UI
    // for managing these; staff_role is the enforced mirror on the auth record).
    if (!users.fields.getByName("staff_role")) {
      users.fields.add(
        new SelectField({
          name: "staff_role",
          maxSelect: 1,
          values: [
            "super_admin",
            "inventory_manager",
            "sales_manager",
            "fulfillment_officer",
          ],
        }),
      );
      app.save(users);
    }

    // ---------- products ----------
    let products;
    try {
      products = app.findCollectionByNameOrId("products");
    } catch (_) {
      products = new Collection({
        type: "base",
        name: "products",
        // Storefront reads are public; the frontend filters by `enabled`.
        listRule: "",
        viewRule: "",
        createRule:
          "@request.auth.account_type = 'admin' || @request.auth.staff_role = 'super_admin' || @request.auth.staff_role = 'inventory_manager'",
        updateRule:
          "@request.auth.account_type = 'admin' || @request.auth.staff_role = 'super_admin' || @request.auth.staff_role = 'inventory_manager'",
        deleteRule:
          "@request.auth.account_type = 'admin' || @request.auth.staff_role = 'super_admin' || @request.auth.staff_role = 'inventory_manager'",
        fields: [
          { name: "name", type: "text", required: true, max: 200 },
          { name: "description", type: "text", max: 2000 },
          {
            name: "format",
            type: "select",
            maxSelect: 1,
            values: ["hardcopy", "digital"],
          },
          { name: "price", type: "number" },
          { name: "edition", type: "text", max: 120 },
          {
            name: "product_type",
            type: "select",
            maxSelect: 1,
            values: ["book", "merchandise", "ticket"],
          },
          {
            name: "status",
            type: "select",
            maxSelect: 1,
            values: ["preorder", "main_order", "unavailable"],
          },
          { name: "inventory_limit", type: "number" },
          { name: "current_stock", type: "number" },
          { name: "low_stock_threshold", type: "number" },
          { name: "enabled", type: "bool" },
          { name: "main_order_enabled", type: "bool" },
          { name: "external_url", type: "url" },
          { name: "image", type: "text", max: 500 },
          {
            name: "created_by",
            type: "relation",
            maxSelect: 1,
            collectionId: users.id,
            cascadeDelete: false,
          },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
          "CREATE INDEX `idx_products_status` ON `products` (`status`)",
          "CREATE INDEX `idx_products_type` ON `products` (`product_type`)",
        ],
      });
      app.save(products);
    }

    // ---------- orders ----------
    let orders;
    try {
      orders = app.findCollectionByNameOrId("orders");
    } catch (_) {
      orders = new Collection({
        type: "base",
        name: "orders",
        listRule:
          "@request.auth.id != '' && (@request.auth.id = owner || @request.auth.account_type = 'admin' || @request.auth.staff_role = 'super_admin' || @request.auth.staff_role = 'sales_manager' || @request.auth.staff_role = 'fulfillment_officer')",
        viewRule:
          "@request.auth.id != '' && (@request.auth.id = owner || @request.auth.account_type = 'admin' || @request.auth.staff_role = 'super_admin' || @request.auth.staff_role = 'sales_manager' || @request.auth.staff_role = 'fulfillment_officer')",
        createRule: "@request.auth.id != '' && @request.auth.id = @request.body.owner",
        updateRule:
          "@request.auth.account_type = 'admin' || @request.auth.staff_role = 'super_admin' || @request.auth.staff_role = 'sales_manager' || @request.auth.staff_role = 'fulfillment_officer'",
        deleteRule: "@request.auth.account_type = 'admin'",
        fields: [
          {
            name: "owner",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: users.id,
            cascadeDelete: true,
          },
          { name: "email", type: "email" },
          { name: "total_price", type: "number" },
          { name: "currency", type: "text", max: 8 },
          { name: "shipping_address", type: "json", maxSize: 20000 },
          {
            name: "payment_status",
            type: "select",
            maxSelect: 1,
            values: ["pending", "paid", "failed", "refunded"],
          },
          { name: "payment_reference", type: "text", max: 120 },
          { name: "paystack_access_code", type: "text", max: 120 },
          {
            name: "order_status",
            type: "select",
            maxSelect: 1,
            values: ["pending", "processing", "shipped", "delivered", "cancelled"],
          },
          { name: "items_summary", type: "text", max: 1000 },
          { name: "estimated_delivery", type: "date" },
          { name: "tracking_number", type: "text", max: 120 },
          { name: "confirmation_sent", type: "bool" },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
          "CREATE INDEX `idx_orders_owner` ON `orders` (`owner`)",
          "CREATE INDEX `idx_orders_status` ON `orders` (`order_status`)",
          "CREATE INDEX `idx_orders_payment` ON `orders` (`payment_status`)",
        ],
      });
      app.save(orders);
    }

    // ---------- order_items ----------
    let orderItems;
    try {
      orderItems = app.findCollectionByNameOrId("order_items");
    } catch (_) {
      orderItems = new Collection({
        type: "base",
        name: "order_items",
        listRule:
          "@request.auth.id != '' && (@request.auth.account_type = 'admin' || @request.auth.id = order.owner)",
        viewRule:
          "@request.auth.id != '' && (@request.auth.account_type = 'admin' || @request.auth.id = order.owner)",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.account_type = 'admin'",
        deleteRule: "@request.auth.account_type = 'admin'",
        fields: [
          {
            name: "order",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: orders.id,
            cascadeDelete: true,
          },
          {
            name: "product",
            type: "relation",
            maxSelect: 1,
            collectionId: products.id,
            cascadeDelete: false,
          },
          { name: "product_name", type: "text", max: 200 },
          { name: "product_format", type: "text", max: 40 },
          { name: "product_edition", type: "text", max: 120 },
          { name: "quantity", type: "number" },
          { name: "unit_price", type: "number" },
          { name: "total_price", type: "number" },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
          "CREATE INDEX `idx_order_items_order` ON `order_items` (`order`)",
          "CREATE INDEX `idx_order_items_product` ON `order_items` (`product`)",
        ],
      });
      app.save(orderItems);
    }

    // ---------- employee_roles ----------
    let employeeRoles;
    try {
      employeeRoles = app.findCollectionByNameOrId("employee_roles");
    } catch (_) {
      employeeRoles = new Collection({
        type: "base",
        name: "employee_roles",
        listRule: "@request.auth.id != '' && (@request.auth.account_type = 'admin' || @request.auth.id = user)",
        viewRule: "@request.auth.id != '' && (@request.auth.account_type = 'admin' || @request.auth.id = user)",
        createRule: "@request.auth.account_type = 'admin'",
        updateRule: "@request.auth.account_type = 'admin'",
        deleteRule: "@request.auth.account_type = 'admin'",
        fields: [
          {
            name: "user",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: users.id,
            cascadeDelete: true,
          },
          {
            name: "role",
            type: "select",
            required: true,
            maxSelect: 1,
            values: [
              "super_admin",
              "inventory_manager",
              "sales_manager",
              "fulfillment_officer",
            ],
          },
          { name: "permissions", type: "json", maxSize: 20000 },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
          "CREATE UNIQUE INDEX `idx_employee_roles_user` ON `employee_roles` (`user`)",
        ],
      });
      app.save(employeeRoles);
    }

    // ---------- stock_movements ----------
    let stockMovements;
    try {
      stockMovements = app.findCollectionByNameOrId("stock_movements");
    } catch (_) {
      stockMovements = new Collection({
        type: "base",
        name: "stock_movements",
        listRule: "@request.auth.account_type = 'admin' || @request.auth.staff_role = 'super_admin' || @request.auth.staff_role = 'inventory_manager'",
        viewRule: "@request.auth.account_type = 'admin' || @request.auth.staff_role = 'super_admin' || @request.auth.staff_role = 'inventory_manager'",
        createRule:
          "@request.auth.account_type = 'admin' || @request.auth.staff_role = 'super_admin' || @request.auth.staff_role = 'inventory_manager'",
        updateRule: null,
        deleteRule: "@request.auth.account_type = 'admin'",
        fields: [
          {
            name: "product",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: products.id,
            cascadeDelete: true,
          },
          { name: "quantity_change", type: "number" },
          { name: "previous_stock", type: "number" },
          { name: "new_stock", type: "number" },
          { name: "reason", type: "text", max: 240 },
          {
            name: "created_by",
            type: "relation",
            maxSelect: 1,
            collectionId: users.id,
            cascadeDelete: false,
          },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
          "CREATE INDEX `idx_stock_mov_product` ON `stock_movements` (`product`)",
          "CREATE INDEX `idx_stock_mov_created` ON `stock_movements` (`created`)",
        ],
      });
      app.save(stockMovements);
    }

    // ---------- seed the four preorder book products ----------
    const existing = app.findRecordsByFilter("products", "product_type = 'book'", "", 100, 0, {});
    if (existing.length === 0) {
      const seeds = [
        {
          name: "The Autobiography — Signed Copy",
          description:
            "A personally signed hardcover of the official Pete Edochie autobiography. Cloth bound, 412 pages, 32 archive photographs. Shipping details captured at checkout.",
          format: "hardcopy",
          price: 100,
          edition: "Signed copy",
          product_type: "book",
          status: "preorder",
          inventory_limit: 500,
          current_stock: 500,
          low_stock_threshold: 50,
          enabled: true,
          main_order_enabled: false,
          external_url: "",
          image: "",
        },
        {
          name: "The Autobiography — Standard Copy",
          description:
            "The standard hardcover edition of the official Pete Edochie autobiography. 412 pages, 32 archive photographs. Shipping details captured at checkout.",
          format: "hardcopy",
          price: 24.99,
          edition: "Standard copy",
          product_type: "book",
          status: "preorder",
          inventory_limit: 2000,
          current_stock: 2000,
          low_stock_threshold: 100,
          enabled: true,
          main_order_enabled: false,
          external_url: "",
          image: "",
        },
        {
          name: "The Autobiography — Audiobook",
          description:
            "The audiobook edition, narrated and produced with extended audio extracts. Preorder is fulfilled through Amazon, the primary retailer.",
          format: "digital",
          price: 19.99,
          edition: "Audiobook",
          product_type: "book",
          status: "preorder",
          inventory_limit: 0,
          current_stock: 0,
          low_stock_threshold: 0,
          enabled: true,
          main_order_enabled: false,
          external_url: "https://www.amazon.com/s?k=Pete+Edochie+autobiography+audiobook",
          image: "",
        },
        {
          name: "The Autobiography — E-book",
          description:
            "The e-book edition. Price to be confirmed. Preorder is fulfilled through Amazon and is not sold directly on this platform.",
          format: "digital",
          price: 0,
          edition: "E-book",
          product_type: "book",
          status: "preorder",
          inventory_limit: 0,
          current_stock: 0,
          low_stock_threshold: 0,
          enabled: true,
          main_order_enabled: false,
          external_url: "https://www.amazon.com/s?k=Pete+Edochie+autobiography+ebook",
          image: "",
        },
      ];

      for (const seed of seeds) {
        const rec = new Record(products, {
          ...seed,
          created_by: "",
        });
        app.save(rec);
      }
    }
  },
  (app) => {
    const drop = (name) => {
      try {
        app.delete(app.findCollectionByNameOrId(name));
      } catch (_) {
        /* already gone */
      }
    };
    // drop dependents first
    drop("stock_movements");
    drop("order_items");
    drop("orders");
    drop("employee_roles");
    drop("products");
  },
);
