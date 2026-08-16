/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");

    // --- Expand staff roles on users.staff_role + employee_roles.role ---
    const STAFF_ROLES = [
      "super_admin",
      "inventory_manager",
      "sales_manager",
      "fulfillment_officer",
      "country_manager",
      "sponsorship_manager",
    ];
    const staffField = users.fields.getByName("staff_role");
    if (staffField) {
      staffField.values = STAFF_ROLES;
    }
    app.save(users);

    const employeeRoles = app.findCollectionByNameOrId("employee_roles");
    const empRoleField = employeeRoles.fields.getByName("role");
    if (empRoleField) {
      empRoleField.values = STAFF_ROLES;
    }
    app.save(employeeRoles);

    // --- products: add variants (size/color) JSON + category text ---
    const products = app.findCollectionByNameOrId("products");
    if (!products.fields.getByName("variants")) {
      products.fields.add(new JSONField({ name: "variants", maxSize: 20000 }));
    }
    if (!products.fields.getByName("category")) {
      products.fields.add(new TextField({ name: "category", max: 80 }));
    }
    app.save(products);

    // --- orders: add country for analytics/filtering ---
    const orders = app.findCollectionByNameOrId("orders");
    if (!orders.fields.getByName("country")) {
      orders.fields.add(new TextField({ name: "country", max: 100 }));
    }
    app.save(orders);

    // --- sponsorship_packages ---
    let packages;
    try {
      packages = app.findCollectionByNameOrId("sponsorship_packages");
    } catch (_) {
      packages = new Collection({
        type: "base",
        name: "sponsorship_packages",
        listRule: "",
        viewRule: "",
        createRule:
          "@request.auth.account_type = 'admin' || @request.auth.staff_role = 'super_admin' || @request.auth.staff_role = 'sponsorship_manager'",
        updateRule:
          "@request.auth.account_type = 'admin' || @request.auth.staff_role = 'super_admin' || @request.auth.staff_role = 'sponsorship_manager'",
        deleteRule: "@request.auth.account_type = 'admin'",
        fields: [
          { name: "name", type: "text", required: true, max: 120 },
          {
            name: "tier",
            type: "select",
            required: true,
            maxSelect: 1,
            values: ["platinum", "gold", "silver", "bronze"],
          },
          { name: "description", type: "text", max: 2000 },
          { name: "price", type: "number", required: true },
          { name: "currency", type: "text", max: 8 },
          { name: "benefits", type: "json", maxSize: 30000 },
          { name: "deliverables", type: "json", maxSize: 30000 },
          { name: "duration", type: "text", max: 60 },
          { name: "image", type: "text", max: 500 },
          { name: "enabled", type: "bool" },
          { name: "sort", type: "number" },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
          "CREATE INDEX `idx_sponsor_packages_tier` ON `sponsorship_packages` (`tier`)",
        ],
      });
      app.save(packages);
    }

    // --- sponsorships ---
    try {
      app.findCollectionByNameOrId("sponsorships");
    } catch (_) {
      const sponsorships = new Collection({
        type: "base",
        name: "sponsorships",
        listRule:
          "@request.auth.id != '' && (@request.auth.id = owner || @request.auth.account_type = 'admin' || @request.auth.staff_role = 'super_admin' || @request.auth.staff_role = 'sponsorship_manager')",
        viewRule:
          "@request.auth.id != '' && (@request.auth.id = owner || @request.auth.account_type = 'admin' || @request.auth.staff_role = 'super_admin' || @request.auth.staff_role = 'sponsorship_manager')",
        createRule: "@request.auth.id != '' && @request.auth.id = @request.body.owner",
        updateRule:
          "@request.auth.account_type = 'admin' || @request.auth.staff_role = 'super_admin' || @request.auth.staff_role = 'sponsorship_manager'",
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
          { name: "company_name", type: "text", required: true, max: 200 },
          { name: "industry", type: "text", max: 120 },
          { name: "contact_person", type: "text", required: true, max: 120 },
          { name: "email", type: "email", required: true },
          { name: "phone", type: "text", max: 40 },
          { name: "website", type: "url" },
          {
            name: "package_tier",
            type: "select",
            maxSelect: 1,
            values: ["platinum", "gold", "silver", "bronze"],
          },
          {
            name: "package",
            type: "relation",
            maxSelect: 1,
            collectionId: packages.id,
            cascadeDelete: false,
          },
          { name: "investment_amount", type: "number" },
          { name: "currency", type: "text", max: 8 },
          { name: "message", type: "text", max: 3000 },
          {
            name: "status",
            type: "select",
            maxSelect: 1,
            values: ["pending", "approved", "rejected"],
          },
          {
            name: "payment_status",
            type: "select",
            maxSelect: 1,
            values: ["unpaid", "paid", "refunded"],
          },
          { name: "admin_notes", type: "text", max: 2000 },
          { name: "country", type: "text", max: 100 },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
          "CREATE INDEX `idx_sponsorships_owner` ON `sponsorships` (`owner`)",
          "CREATE INDEX `idx_sponsorships_status` ON `sponsorships` (`status`)",
        ],
      });
      app.save(sponsorships);
    }

    // --- countries ---
    let countries;
    try {
      countries = app.findCollectionByNameOrId("countries");
    } catch (_) {
      countries = new Collection({
        type: "base",
        name: "countries",
        listRule: "",
        viewRule: "",
        createRule:
          "@request.auth.account_type = 'admin' || @request.auth.staff_role = 'super_admin' || @request.auth.staff_role = 'country_manager'",
        updateRule:
          "@request.auth.account_type = 'admin' || @request.auth.staff_role = 'super_admin' || @request.auth.staff_role = 'country_manager'",
        deleteRule: "@request.auth.account_type = 'admin'",
        fields: [
          { name: "name", type: "text", required: true, max: 120 },
          { name: "code", type: "text", required: true, max: 3 },
          { name: "currency", type: "text", max: 8 },
          {
            name: "status",
            type: "select",
            maxSelect: 1,
            values: ["active", "inactive", "coming_soon"],
          },
          { name: "launch_date", type: "date" },
          {
            name: "regional_coordinator",
            type: "relation",
            maxSelect: 1,
            collectionId: users.id,
            cascadeDelete: false,
          },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
          "CREATE UNIQUE INDEX `idx_countries_code` ON `countries` (`code`)",
        ],
      });
      app.save(countries);
    }

    // --- regions ---
    try {
      app.findCollectionByNameOrId("regions");
    } catch (_) {
      const regions = new Collection({
        type: "base",
        name: "regions",
        listRule: "",
        viewRule: "",
        createRule:
          "@request.auth.account_type = 'admin' || @request.auth.staff_role = 'super_admin' || @request.auth.staff_role = 'country_manager'",
        updateRule:
          "@request.auth.account_type = 'admin' || @request.auth.staff_role = 'super_admin' || @request.auth.staff_role = 'country_manager'",
        deleteRule: "@request.auth.account_type = 'admin'",
        fields: [
          { name: "name", type: "text", required: true, max: 120 },
          {
            name: "country",
            type: "relation",
            required: true,
            maxSelect: 1,
            collectionId: countries.id,
            cascadeDelete: true,
          },
          {
            name: "status",
            type: "select",
            maxSelect: 1,
            values: ["active", "inactive"],
          },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
        indexes: [
          "CREATE INDEX `idx_regions_country` ON `regions` (`country`)",
        ],
      });
      app.save(regions);
    }

    // --- seed sponsorship packages ---
    const existingPackages = app.findRecordsByFilter(
      "sponsorship_packages",
      "id != ''",
      "",
      100,
      0,
      {},
    );
    if (existingPackages.length === 0) {
      const packageSeeds = [
        {
          name: "Platinum Sponsor",
          tier: "platinum",
          description:
            "The highest tier of partnership — title billing across the Africa tour, the Ghana Launch and the Meet & Greet series, with named support of a mentorship cohort.",
          price: 50000,
          currency: "USD",
          duration: "12 months",
          enabled: true,
          sort: 1,
          image: "https://images.hostinger.com/64c337f2-f627-4055-9d43-d348d976dc63.png",
          benefits: [
            "Title billing on the Africa tour and Ghana Launch",
            "Logo placement on all event key art and signage",
            "Named support of one mentorship cohort (20 scholarships)",
            "On-stage recognition at the Meet & Greet series",
            "20 VIP seats per city across the tour",
            "Quarterly impact and media report",
          ],
          deliverables: [
            "Co-branded event programme",
            "Dedicated press release with sponsor quote",
            "Logo on platform homepage and journal",
            "Post-event impact report",
            "Social media feature series",
          ],
        },
        {
          name: "Gold Sponsor",
          tier: "gold",
          description:
            "Premier visibility across the tour and the autobiography launch, with strong brand presence at headline events.",
          price: 25000,
          currency: "USD",
          duration: "12 months",
          enabled: true,
          sort: 2,
          image: "https://images.hostinger.com/271ce9e7-93a9-4390-b46b-65ec34679e73.png",
          benefits: [
            "Premier logo placement on tour materials",
            "On-stage recognition at the Ghana Launch",
            "10 VIP Meet & Greet seats per city",
            "Acknowledgement in the autobiography",
            "Bi-annual impact report",
          ],
          deliverables: [
            "Logo on event signage and programmes",
            "Acknowledgement in print and digital editions",
            "Social media feature",
            "Event photography rights",
          ],
        },
        {
          name: "Silver Sponsor",
          tier: "silver",
          description:
            "Strong brand presence at headline events and across the digital platform.",
          price: 10000,
          currency: "USD",
          duration: "12 months",
          enabled: true,
          sort: 3,
          image: "https://images.hostinger.com/3fb9501e-28bc-4e82-89a5-3377eb9f780b.png",
          benefits: [
            "Logo on event signage",
            "5 VIP Meet & Greet seats per city",
            "Platform homepage logo placement",
            "Event invitation for two",
          ],
          deliverables: [
            "Logo on event programme",
            "Platform listing as partner",
            "Social media mention",
          ],
        },
        {
          name: "Bronze Sponsor",
          tier: "bronze",
          description:
            "An entry partnership for organisations beginning their relationship with the legacy platform.",
          price: 5000,
          currency: "USD",
          duration: "12 months",
          enabled: true,
          sort: 4,
          image: "https://images.hostinger.com/f9bbc10b-9993-4be6-bb20-0f31a23fd314.png",
          benefits: [
            "Platform partner listing",
            "2 Meet & Greet tickets",
            "Event invitation for one",
            "Social media mention",
          ],
          deliverables: ["Platform partner listing", "Social media mention"],
        },
      ];
      for (const seed of packageSeeds) {
        const r = new Record(packages);
        r.load(seed);
        app.save(r);
      }
    }

    // --- seed countries + regions ---
    const existingCountries = app.findRecordsByFilter(
      "countries",
      "id != ''",
      "",
      100,
      0,
      {},
    );
    let ghana, nigeria;
    if (existingCountries.length === 0) {
      const countrySeeds = [
        { name: "Ghana", code: "GH", currency: "GHS", status: "active" },
        { name: "Nigeria", code: "NG", currency: "NGN", status: "active" },
      ];
      for (const seed of countrySeeds) {
        const r = new Record(countries);
        r.load(seed);
        app.save(r);
        if (seed.code === "GH") ghana = r;
        if (seed.code === "NG") nigeria = r;
      }
    } else {
      for (const c of existingCountries) {
        if (c.get("code") === "GH") ghana = c;
        if (c.get("code") === "NG") nigeria = c;
      }
    }

    const regionsCol = app.findCollectionByNameOrId("regions");
    const existingRegions = app.findRecordsByFilter(
      "regions",
      "id != ''",
      "",
      500,
      0,
      {},
    );
    if (existingRegions.length === 0) {
      const ghanaRegions = [
        "Greater Accra", "Ashanti", "Western", "Eastern", "Central",
        "Northern", "Volta", "Bono", "Ahafo", "Oti", "Western North",
        "North East", "Savannah", "Upper East", "Upper West", "Bono East",
      ];
      const nigeriaRegions = [
        "Lagos", "Federal Capital Territory", "Enugu", "Anambra", "Rivers",
        "Kaduna", "Kano", "Oyo", "Delta", "Edo", "Imo", "Abia", "Cross River",
        "Akwa Ibom", "Ogun", "Ondo", "Ekiti", "Kwara", "Osun", "Bayelsa",
        "Ebonyi", "Nasarawa", "Plateau", "Benue", "Kogi", "Niger", "Sokoto",
        "Kebbi", "Jigawa", "Yobe", "Borno", "Bauchi", "Gombe", "Taraba",
        "Adamawa", "Zamfara", "Katsina",
      ];
      for (const name of ghanaRegions) {
        const r = new Record(regionsCol);
        r.set("name", name);
        r.set("country", ghana.id);
        r.set("status", "active");
        app.save(r);
      }
      for (const name of nigeriaRegions) {
        const r = new Record(regionsCol);
        r.set("name", name);
        r.set("country", nigeria.id);
        r.set("status", "active");
        app.save(r);
      }
    }

    // --- seed merchandise products ---
    const existingMerch = app.findRecordsByFilter(
      "products",
      "product_type = 'merchandise'",
      "",
      100,
      0,
      {},
    );
    if (existingMerch.length === 0) {
      const merchSeeds = [
        {
          name: "Legacy T-Shirt",
          description:
            "Premium heavyweight black cotton T-shirt with a minimalist gold screen-print portrait. Ribbed collar, double-stitched hems, unisex fit.",
          format: "hardcopy",
          price: 35,
          edition: "Legacy Tee",
          product_type: "merchandise",
          status: "main_order",
          inventory_limit: 300,
          current_stock: 300,
          low_stock_threshold: 30,
          enabled: true,
          main_order_enabled: true,
          external_url: "",
          image: "https://images.hostinger.com/3ae11c1c-803c-4021-939e-151bd89ffe16.png",
          category: "Apparel",
          variants: [
            { name: "Size", options: ["S", "M", "L", "XL", "XXL"] },
            { name: "Color", options: ["Black", "White", "Charcoal"] },
          ],
        },
        {
          name: "The Elder — Framed Print",
          description:
            "Museum-quality sepia portrait print, framed in solid black wood. Archival paper, ready to hang. A centrepiece for any collection.",
          format: "hardcopy",
          price: 120,
          edition: "Framed print",
          product_type: "merchandise",
          status: "main_order",
          inventory_limit: 150,
          current_stock: 150,
          low_stock_threshold: 20,
          enabled: true,
          main_order_enabled: true,
          external_url: "",
          image: "https://images.hostinger.com/1a411ea8-babd-45bc-add6-73e265f0453a.png",
          category: "Prints",
          variants: [{ name: "Size", options: ["A3", "A2"] }],
        },
        {
          name: "Okonkwo — Limited Edition Print",
          description:
            "A numbered limited edition art print, deep red and black with gold foil accents. Only 100 will ever be produced, each hand-numbered with a certificate of authenticity.",
          format: "hardcopy",
          price: 80,
          edition: "Limited edition #1–100",
          product_type: "merchandise",
          status: "preorder",
          inventory_limit: 100,
          current_stock: 100,
          low_stock_threshold: 10,
          enabled: true,
          main_order_enabled: false,
          external_url: "",
          image: "https://images.hostinger.com/205049b9-855d-4650-9911-cccbe2bc0f04.png",
          category: "Limited Edition",
          variants: [{ name: "Edition", options: ["Numbered #1–100"] }],
        },
        {
          name: "The Legacy Tote Bag",
          description:
            "Natural canvas tote with a gold-embossed emblem. Heavyweight fabric, reinforced straps — built for everyday carry.",
          format: "hardcopy",
          price: 25,
          edition: "Tote",
          product_type: "merchandise",
          status: "main_order",
          inventory_limit: 200,
          current_stock: 200,
          low_stock_threshold: 25,
          enabled: true,
          main_order_enabled: true,
          external_url: "",
          image: "https://images.hostinger.com/aadb37ee-05d5-40da-8715-c56376d122d1.png",
          category: "Accessories",
          variants: [],
        },
        {
          name: "Legacy Crest Cap",
          description:
            "Premium black baseball cap with a subtle gold embroidered crest. Adjustable strap, structured crown.",
          format: "hardcopy",
          price: 30,
          edition: "Cap",
          product_type: "merchandise",
          status: "main_order",
          inventory_limit: 180,
          current_stock: 180,
          low_stock_threshold: 20,
          enabled: true,
          main_order_enabled: true,
          external_url: "",
          image: "https://images.hostinger.com/c912edf6-dac3-4b78-ad57-6d31bf365b61.png",
          category: "Apparel",
          variants: [{ name: "Size", options: ["One size"] }],
        },
        {
          name: "Proverb Mug",
          description:
            "Matte black ceramic mug with a gold-rimmed edge and an embossed Igbo proverb. Dishwasher safe, 350ml.",
          format: "hardcopy",
          price: 22,
          edition: "Mug",
          product_type: "merchandise",
          status: "main_order",
          inventory_limit: 250,
          current_stock: 250,
          low_stock_threshold: 25,
          enabled: true,
          main_order_enabled: true,
          external_url: "",
          image: "https://images.hostinger.com/110ca3ea-224e-437e-a9df-df4ae11a443a.png",
          category: "Homeware",
          variants: [],
        },
      ];
      for (const seed of merchSeeds) {
        const r = new Record(products, { ...seed, created_by: "" });
        app.save(r);
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
    drop("regions");
    drop("sponsorships");
    drop("sponsorship_packages");
    drop("countries");

    // restore staff role lists
    try {
      const users = app.findCollectionByNameOrId("users");
      const sf = users.fields.getByName("staff_role");
      if (sf) {
        sf.values = [
          "super_admin",
          "inventory_manager",
          "sales_manager",
          "fulfillment_officer",
        ];
      }
      app.save(users);
    } catch (_) {}
    try {
      const er = app.findCollectionByNameOrId("employee_roles");
      const rf = er.fields.getByName("role");
      if (rf) {
        rf.values = [
          "super_admin",
          "inventory_manager",
          "sales_manager",
          "fulfillment_officer",
        ];
      }
      app.save(er);
    } catch (_) {}

    // remove added product/order fields
    try {
      const products = app.findCollectionByNameOrId("products");
      ["variants", "category"].forEach((f) => products.fields.removeByName(f));
      app.save(products);
    } catch (_) {}
    try {
      const orders = app.findCollectionByNameOrId("orders");
      orders.fields.removeByName("country");
      app.save(orders);
    } catch (_) {}

    // remove seeded merchandise
    try {
      const merch = app.findRecordsByFilter(
        "products",
        "product_type = 'merchandise'",
        "",
        500,
        0,
        {},
      );
      for (const r of merch) {
        try {
          app.delete(r);
        } catch (_) {}
      }
    } catch (_) {}
  },
);
