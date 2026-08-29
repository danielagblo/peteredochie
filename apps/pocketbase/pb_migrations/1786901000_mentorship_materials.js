/// <reference path="../pb_data/types.d.ts" />

const REGISTRATION_TYPES = ["scholarship", "standard", "patron", "legacy"];

migrate(
  (app) => {
    const mentorship = app.findCollectionByNameOrId("mentorship_applications");

    if (!mentorship.fields.getByName("requested_type")) {
      mentorship.fields.add(
        new SelectField({
          name: "requested_type",
          maxSelect: 1,
          values: REGISTRATION_TYPES,
        }),
      );
    }
    if (!mentorship.fields.getByName("registration_type")) {
      mentorship.fields.add(
        new SelectField({
          name: "registration_type",
          maxSelect: 1,
          values: REGISTRATION_TYPES,
        }),
      );
    }
    app.save(mentorship);

    let materials;
    try {
      materials = app.findCollectionByNameOrId("mentorship_materials");
    } catch (_) {
      materials = new Collection({
        type: "base",
        name: "mentorship_materials",
      });
    }

    const addField = (name, field) => {
      if (!materials.fields.getByName(name)) {
        materials.fields.add(field);
      }
    };

    addField("title", new TextField({ name: "title", required: true, max: 200 }));
    addField("description", new TextField({ name: "description", max: 2000 }));
    addField("module", new TextField({ name: "module", max: 80 }));
    addField("cohort", new TextField({ name: "cohort", max: 20 }));
    addField(
      "registration_type",
      new SelectField({
        name: "registration_type",
        required: true,
        maxSelect: 1,
        values: REGISTRATION_TYPES,
      }),
    );
    addField("sort", new NumberField({ name: "sort", min: 0 }));
    addField("published", new BoolField({ name: "published" }));
    addField("url", new URLField({ name: "url", max: 500 }));
    addField("video_url", new URLField({ name: "video_url", max: 500 }));
    addField(
      "file",
      new FileField({
        name: "file",
        maxSelect: 1,
        maxSize: 52428800,
        mimeTypes: [
          "application/pdf",
          "application/zip",
          "audio/mpeg",
          "audio/mp4",
          "video/mp4",
          "image/jpeg",
          "image/png",
          "text/plain",
        ],
      }),
    );
    addField(
      "created",
      new AutodateField({ name: "created", onCreate: true, onUpdate: false }),
    );
    addField(
      "updated",
      new AutodateField({ name: "updated", onCreate: true, onUpdate: true }),
    );

    materials.listRule = "@request.auth.id != ''";
    materials.viewRule = "@request.auth.id != ''";
    materials.createRule =
      "@request.auth.account_type = 'admin' || @request.auth.staff_role = 'super_admin'";
    materials.updateRule =
      "@request.auth.account_type = 'admin' || @request.auth.staff_role = 'super_admin'";
    materials.deleteRule =
      "@request.auth.account_type = 'admin' || @request.auth.staff_role = 'super_admin'";

    app.save(materials);

    const seed = [
      {
        title: "Welcome & programme overview",
        description:
          "Orientation guide for the cohort — schedule, expectations and how to use the materials library.",
        module: "Orientation",
        cohort: "2027",
        registration_type: "scholarship",
        sort: 1,
        published: true,
      },
      {
        title: "Workshop 1 — Voice and stillness",
        description:
          "Recorded masterclass on breath, pace and the discipline of silence on stage.",
        module: "Craft",
        cohort: "2027",
        registration_type: "standard",
        sort: 2,
        published: true,
      },
      {
        title: "Patron session — Contracts and rights",
        description:
          "Extended briefing on contracts, rights and building a sustainable creative practice.",
        module: "Practice",
        cohort: "2027",
        registration_type: "patron",
        sort: 3,
        published: true,
      },
      {
        title: "Legacy Circle — Private archive readings",
        description:
          "Curated readings from the Pete Edochie archive, reserved for Legacy Circle registrants.",
        module: "Memory",
        cohort: "2027",
        registration_type: "legacy",
        sort: 4,
        published: true,
      },
    ];

    if (app.countRecords("mentorship_materials") === 0) {
      for (const row of seed) {
        const record = new Record(materials);
        record.load(row);
        app.save(record);
      }
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId("mentorship_materials"));
    } catch (e) {
      if (!e.message.includes("no rows in result set")) throw e;
    }

    const mentorship = app.findCollectionByNameOrId("mentorship_applications");
    ["requested_type", "registration_type"].forEach((name) => {
      if (mentorship.fields.getByName(name)) {
        mentorship.fields.removeByName(name);
      }
    });
    app.save(mentorship);
  },
);
