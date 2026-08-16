/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // --- users: add role ---
    const users = app.findCollectionByNameOrId("users");
    if (!users.fields.getByName("role")) {
      users.fields.add(
        new SelectField({
          name: "role",
          maxSelect: 1,
          values: ["supporter", "patron", "legacy_circle", "sponsor", "media", "admin"],
        }),
      );
    }
    users.createRule = "";
    app.save(users);

    // --- events ---
    let events;
    try {
      events = app.findCollectionByNameOrId("events");
    } catch (_) {
      events = new Collection({
        type: "base",
        name: "events",
        listRule: "",
        viewRule: "",
        fields: [
          { name: "title", type: "text", required: true, max: 200 },
          { name: "city", type: "text", max: 120 },
          { name: "venue", type: "text", max: 200 },
          { name: "starts", type: "date" },
          { name: "summary", type: "text", max: 500 },
          { name: "category", type: "text", max: 60 },
          { name: "image", type: "text", max: 500 },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      });
      app.save(events);

      const seedEvents = [
        {
          title: "Nigeria Launch: An Evening of Legacy",
          city: "Lagos, Nigeria",
          venue: "Eko Convention Centre",
          starts: "2026-11-14 18:00:00.000Z",
          summary:
            "The official unveiling of the autobiography, followed by a moderated conversation on six decades of storytelling.",
          category: "Launch",
          image: "https://images.hostinger.com/64c337f2-f627-4055-9d43-d348d976dc63.png",
        },
        {
          title: "Documentary Premiere Screening",
          city: "Enugu, Nigeria",
          venue: "Nike Lake Amphitheatre",
          starts: "2026-12-05 19:30:00.000Z",
          summary:
            "First public screening of the feature documentary, with the crew present for a post-screening dialogue.",
          category: "Premiere",
          image: "https://images.hostinger.com/622bf08c-3c84-4e49-a72e-1568f82f7288.png",
        },
        {
          title: "African Youth Mentorship Masterclass",
          city: "Abuja, Nigeria",
          venue: "National Arts Theatre Annexe",
          starts: "2027-01-23 10:00:00.000Z",
          summary:
            "A full-day intensive on voice, discipline and cultural memory for 200 selected young storytellers.",
          category: "Mentorship",
          image: "https://images.hostinger.com/f9bbc10b-9993-4be6-bb20-0f31a23fd314.png",
        },
        {
          title: "Africa Tour: Accra Conversations",
          city: "Accra, Ghana",
          venue: "National Theatre of Ghana",
          starts: "2027-03-08 17:00:00.000Z",
          summary:
            "Second stop of the continental tour, in partnership with the Ghanaian film academy.",
          category: "Tour",
          image: "https://images.hostinger.com/3fb9501e-28bc-4e82-89a5-3377eb9f780b.png",
        },
      ];
      for (const data of seedEvents) {
        const r = new Record(events);
        r.load(data);
        app.save(r);
      }
    }

    // --- news ---
    let news;
    try {
      news = app.findCollectionByNameOrId("news");
    } catch (_) {
      news = new Collection({
        type: "base",
        name: "news",
        listRule: "",
        viewRule: "",
        fields: [
          { name: "title", type: "text", required: true, max: 200 },
          { name: "excerpt", type: "text", max: 600 },
          { name: "body", type: "text", max: 5000 },
          { name: "category", type: "text", max: 60 },
          { name: "image", type: "text", max: 500 },
          { name: "published", type: "date" },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      });
      app.save(news);

      const seedNews = [
        {
          title: "The autobiography enters final production",
          excerpt:
            "After three years of recorded conversations across Anambra, Lagos and London, the manuscript has been signed off for print.",
          category: "Book",
          image: "https://images.hostinger.com/3283c1af-6e58-4eca-a80a-6d5dc5464e9d.png",
          published: "2026-07-02 09:00:00.000Z",
        },
        {
          title: "Mentorship programme opens to twelve African nations",
          excerpt:
            "The African Youth Mentorship Initiative expands its 2027 intake, with regional hubs in Accra, Nairobi and Kigali.",
          category: "Mentorship",
          image: "https://images.hostinger.com/f9bbc10b-9993-4be6-bb20-0f31a23fd314.png",
          published: "2026-06-18 09:00:00.000Z",
        },
        {
          title: "A lifetime honour at the continental screen awards",
          excerpt:
            "Recognised for a body of work that shaped the language of African screen performance for over four decades.",
          category: "Honours",
          image: "https://images.hostinger.com/271ce9e7-93a9-4390-b46b-65ec34679e73.png",
          published: "2026-05-30 09:00:00.000Z",
        },
      ];
      for (const data of seedNews) {
        const r = new Record(news);
        r.load(data);
        app.save(r);
      }
    }

    // --- enquiries (public contact form) ---
    try {
      app.findCollectionByNameOrId("enquiries");
    } catch (_) {
      const enquiries = new Collection({
        type: "base",
        name: "enquiries",
        listRule: null,
        viewRule: null,
        createRule: "",
        updateRule: null,
        deleteRule: null,
        fields: [
          { name: "name", type: "text", required: true, max: 120 },
          { name: "email", type: "email", required: true },
          { name: "organisation", type: "text", max: 160 },
          { name: "subject", type: "text", max: 80 },
          { name: "message", type: "text", required: true, max: 3000 },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      });
      app.save(enquiries);
    }

    // --- mentorship applications ---
    try {
      app.findCollectionByNameOrId("mentorship_applications");
    } catch (_) {
      const apps_ = new Collection({
        type: "base",
        name: "mentorship_applications",
        listRule: null,
        viewRule: null,
        createRule: "",
        updateRule: null,
        deleteRule: null,
        fields: [
          { name: "name", type: "text", required: true, max: 120 },
          { name: "email", type: "email", required: true },
          { name: "country", type: "text", max: 100 },
          { name: "discipline", type: "text", max: 100 },
          { name: "statement", type: "text", required: true, max: 2000 },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      });
      app.save(apps_);
    }
  },
  (app) => {
    for (const name of ["mentorship_applications", "enquiries", "news", "events"]) {
      try {
        app.delete(app.findCollectionByNameOrId(name));
      } catch (e) {
        if (!e.message.includes("no rows in result set")) throw e;
      }
    }
  },
);
