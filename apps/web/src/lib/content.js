export const PUBLISHER = {
  name: "King Dawie Publishing",
  short: "King Dawie Publishing",
  role: "Official owner, publisher and rights holder of the Peter Edochie Legacy platform",
  email: "rights@kingdawiepublishing.com",
  phoneDisplay: "+233 53 333 30810",
  whatsapp: "2330533330810",
  note: "All works on this platform — the autobiography, the archive, the events and the journal — are published and administered by King Dawie Publishing as the official rights holder.",
};

/** The Legacy Project brand system (see brand guide). */
export const BRAND = {
  projectName: "The Legacy Project",
  hashtag: "#TheLegacyProject",
  tagline: "What will you leave behind?",
  colors: {
    burgundy: "#7A0C19",
    black: "#0A0A0A",
    white: "#FFFFFF",
  },
};

/** The actor this platform celebrates — Peter Edochie, Nigerian screen legend. */
export const LEGACY = {
  name: "Peter Edochie",
  legacyName: "Peter Edochie Legacy",
  title: "Actor",
  descriptor:
    "Nigerian actor, broadcaster and elder statesman of African cinema",
  heroEyebrow: BRAND.projectName,
  bioPath: "/peter-edochie",
};

/** Official platform image assets (Hostinger Horizons export). */
export const ASSET_HOST = "https://images.hostinger.com";

export const assetUrl = (file) => `${ASSET_HOST}/${file}`;

/** Curated Peter Edochie / platform imagery from the original site build. */
export const ASSETS = {
  portrait: "1a411ea8-babd-45bc-add6-73e265f0453a.png",
  launch: "64c337f2-f627-4055-9d43-d348d976dc63.png",
  premiere: "622bf08c-3c84-4e49-a72e-1568f82f7288.png",
  mentorship: "f9bbc10b-9993-4be6-bb20-0f31a23fd314.png",
  tour: "3fb9501e-28bc-4e82-89a5-3377eb9f780b.png",
  book: "3283c1af-6e58-4eca-a80a-6d5dc5464e9d.png",
  honours: "271ce9e7-93a9-4390-b46b-65ec34679e73.png",
  okonkwo: "205049b9-855d-4650-9911-cccbe2bc0f04.png",
  tee: "3ae11c1c-803c-4021-939e-151bd89ffe16.png",
  tote: "aadb37ee-05d5-40da-8715-c56376d122d1.png",
  cap: "c912edf6-dac3-4b78-ad57-6d31bf365b61.png",
  mug: "110ca3ea-224e-437e-a9df-df4ae11a443a.png",
};

export const IMG = {
  portrait: assetUrl(ASSETS.portrait),
  stage: assetUrl(ASSETS.launch),
  set: assetUrl(ASSETS.premiere),
  book: assetUrl(ASSETS.book),
  award: assetUrl(ASSETS.honours),
  youth: assetUrl(ASSETS.mentorship),
  podium: assetUrl(ASSETS.tour),
  family: assetUrl(ASSETS.okonkwo),
  artifact: assetUrl(ASSETS.tee),
  theatre: assetUrl(ASSETS.launch),
};

/** Shop preview tiles on the homepage. */
export const MERCH_PREVIEW = [
  assetUrl(ASSETS.tee),
  assetUrl(ASSETS.portrait),
  assetUrl(ASSETS.okonkwo),
  assetUrl(ASSETS.tote),
];

/** Ghana launch activation — master plan page 5–7. */
export const LAUNCH = {
  activationDate: "20 September 2026",
  activationCity: "Accra, Ghana",
  venue: "Accra International Conference Centre",
  headline: "Ghana activation",
  lead: "The continental launch begins in Accra on 20 September 2026 — pre-order the autobiography, register for the launch event and apply to the mentorship programme.",
};

/** Messaging pillars from the master plan. */
export const MESSAGING_PILLARS = [
  {
    title: "Heritage",
    text: "Six decades of screen work gathered into one living archive — biography, journal and gallery.",
  },
  {
    title: "Handing on",
    text: "The African Youth Mentorship Initiative passes craft, discipline and cultural memory to the next generation of storytellers.",
  },
  {
    title: "Community",
    text: "Join the legacy community for launch news, event dates and early access — no account required to subscribe.",
  },
  {
    title: "The book",
    text: "The official autobiography — hardcover, signed and digital editions — published by King Dawie Publishing.",
  },
];

export const REFERRAL_SOURCES = [
  "WhatsApp",
  "Instagram / Facebook",
  "Friend or family",
  "Launch event",
  "Book QR code",
  "Press or media",
  "Other",
];

export const PRIMARY_NAV = [
  { to: "/peter-edochie", label: "The Man" },
  { to: "/legacy", label: "Legacy" },
  { to: "/book", label: "The Book" },
  { to: "/events", label: "Events" },
  { to: "/shop", label: "Shop" },
  { to: "/mentorship", label: "Mentorship" },
];

export const MORE_NAV = [
  { to: "/gallery", label: "Gallery" },
  { to: "/news", label: "Journal" },
  { to: "/sponsors", label: "Partners" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" },
];

export const NAV = [...PRIMARY_NAV, ...MORE_NAV];

export const MILESTONES = [
  {
    year: "1947",
    title: "Born in Enugu",
    text: "A childhood shaped by Igbo oral tradition, proverb and the discipline of a teaching household.",
  },
  {
    year: "1970s",
    title: "Broadcasting years",
    text: "A career in radio and public broadcasting sharpens a voice that would later define a screen generation.",
  },
  {
    year: "1980s",
    title: "Things Fall Apart",
    text: "The role of Okonkwo in the landmark adaptation of Chinua Achebe\u2019s novel enters the continental canon.",
  },
  {
    year: "1990s",
    title: "The Nollywood era",
    text: "More than two hundred screen appearances help build the vocabulary of a new African film industry.",
  },
  {
    year: "2000s",
    title: "Elder statesman",
    text: "Cultural advocacy, national honours and a public voice on heritage, family and integrity.",
  },
  {
    year: "Today",
    title: "The legacy platform",
    text: "An autobiography, a Meet & Greet series, events and a mentorship initiative for the next generation of African storytellers.",
  },
];

export const AWARDS = [
  {
    name: "Lifetime Achievement in African Cinema",
    body: "Continental Screen Academy",
    year: "2023",
  },
  {
    name: "Member of the Order of the Federal Republic",
    body: "Federal Republic of Nigeria",
    year: "2011",
  },
  {
    name: "Best Actor in a Leading Role",
    body: "African Movie Academy Awards",
    year: "2007",
  },
  {
    name: "Industry Merit Award",
    body: "Nollywood Guild of Practitioners",
    year: "2016",
  },
];

export const TESTIMONIALS = [
  {
    quote:
      "He did not act the elder. He carried the elder inside him, and the camera simply agreed.",
    name: "Adaeze Nwankwo",
    role: "Film scholar, University of Nsukka",
  },
  {
    quote:
      "Every proverb he speaks on screen is a door into a culture that refuses to be footnoted.",
    name: "Kwame Ofori",
    role: "Director, National Theatre of Ghana",
  },
  {
    quote:
      "A week in his mentorship room taught me more about restraint than four years of training.",
    name: "Ifeoma Balogun",
    role: "Mentorship alumna, 2025 cohort",
  },
];

export const TIERS = [
  {
    name: "Supporter",
    price: "From \u20a63,500 / month",
    points: [
      "Monthly journal from the archive",
      "Early access to event dates",
      "Digital membership card",
    ],
  },
  {
    name: "Patron",
    price: "From \u20a612,000 / month",
    points: [
      "Everything in Supporter",
      "Quarterly recorded masterclass",
      "Priority ticket window",
      "Signed edition ballot",
    ],
  },
  {
    name: "Legacy Circle",
    price: "By invitation",
    points: [
      "Everything in Patron",
      "Private mentorship sessions",
      "Priority Meet & Greet allocation",
      "Invitation to the Ghana Launch",
    ],
  },
];

export const SPONSORS = [
  "Zenith Cultural Trust",
  "Anambra Heritage Foundation",
  "Pan-African Broadcast Union",
  "Lagos Film Society",
  "Ubuntu Media Group",
  "Kano Arts Endowment",
];

export const FAQ_SECTIONS = [
  {
    title: "The platform",
    items: [
      {
        q: "What is the Peter Edochie Legacy platform?",
        a: "It is the official digital home of Peter Edochie, the Nigerian actor — his biography, screen archive, autobiography, events, mentorship programme and journal. The platform is owned, published and administered by King Dawie Publishing as the official rights holder.",
      },
      {
        q: "Who operates this website?",
        a: "King Dawie Publishing is the official owner, publisher and rights holder of the Peter Edochie Legacy. All publishing, licensing, event administration and archive content on this platform is managed by the publishing office.",
      },
      {
        q: "Do I need an account to browse the site?",
        a: "No. Most of the archive, journal, events listing and shop can be viewed without signing in. An account is required for your dashboard, mentorship applications, sponsorship applications and to keep order history in one place.",
      },
    ],
  },
  {
    title: "The book & shop",
    items: [
      {
        q: "How do I order the autobiography?",
        a: "Visit The Book or Shop, add your edition to the cart, and proceed to checkout. You can complete your order as a guest or while signed in. After payment your confirmation and tracking details appear on the order page.",
      },
      {
        q: "Can I buy without creating an account?",
        a: "Yes. Guest checkout is available. Keep your order reference safe — you can track your order at any time from the Track an order page. If you later create an account with the same email, previous guest orders can be linked to your dashboard.",
      },
      {
        q: "What is the QR code on a book edition?",
        a: "Each book edition may carry a QR code that opens a direct order page for that title. Scan the code to view the edition details and place an order without searching the shop.",
      },
    ],
  },
  {
    title: "Orders & delivery",
    items: [
      {
        q: "How do I track my order?",
        a: "Go to Track an order and enter your order reference and email address. You can also open the order link sent after checkout. Signed-in members see all orders in their dashboard.",
      },
      {
        q: "Do you ship internationally?",
        a: "Delivery options depend on your country. At checkout you can choose home delivery where available, or collection through an authorised distributor in your country when that option is offered.",
      },
      {
        q: "What is distributor collection?",
        a: "In some countries books and event materials can be collected from a local authorised distributor instead of being shipped to your address. The distributor name and location are shown at checkout before you pay.",
      },
      {
        q: "Which payment methods are accepted?",
        a: "Online orders and event tickets are processed through our secure payment partner. If payment is not yet configured for a product, your order is saved as pending and the office will follow up.",
      },
    ],
  },
  {
    title: "Events & tickets",
    items: [
      {
        q: "How do event tickets work?",
        a: "Browse Events, select a programme and complete registration or ticket purchase. Confirmed tickets appear in your dashboard as QR passes. Present your pass at the venue for entry.",
      },
      {
        q: "Can I choose how to receive event materials?",
        a: "Yes. For some events you can select home delivery or collection through a local distributor, similar to book orders. The available options are shown during registration.",
      },
      {
        q: "Are tickets transferable?",
        a: "Event tickets are issued as single-use QR passes and are generally non-transferable unless stated otherwise on the event page. Check the specific event terms before purchase.",
      },
    ],
  },
  {
    title: "Mentorship",
    items: [
      {
        q: "How do I apply for the mentorship programme?",
        a: "Visit Mentorship, review the pillars and cohort details, then submit your application. You will need a member account. Your application opens in WhatsApp for the programme team and is also recorded on the platform.",
      },
      {
        q: "What are the registration types?",
        a: "Applications may be submitted as Standard, Scholarship, Patron or Legacy Circle depending on your circumstances. Approved participants receive access to materials matched to their registration tier in the dashboard.",
      },
      {
        q: "When will I hear back about my application?",
        a: "Applications are reviewed in cohort order. Status updates appear in your dashboard once the programme team has processed your submission. WhatsApp is the primary channel for follow-up.",
      },
    ],
  },
  {
    title: "Accounts & dashboard",
    items: [
      {
        q: "What can I do in my dashboard?",
        a: "Your dashboard shows orders, event tickets, mentorship status, sponsorship applications and programme materials you have access to. It is the central place to manage your participation on the platform.",
      },
      {
        q: "I checked out as a guest — can I claim my orders later?",
        a: "Yes. Create an account or sign in using the same email address you used at checkout. Guest orders linked to that email are automatically associated with your account.",
      },
      {
        q: "I forgot my password. What should I do?",
        a: "Use the Forgot password link on the sign-in page. If you still cannot access your account, contact the publishing office with the email address on your account.",
      },
    ],
  },
  {
    title: "Publishing, rights & partnership",
    items: [
      {
        q: "How do I request media access or press materials?",
        a: "Go to Contact, select Media & press as your subject, and send your enquiry. Include your outlet, deadline and the material you need. The publishing office handles all official press requests.",
      },
      {
        q: "How do I enquire about publishing or licensing rights?",
        a: "All rights, translation, broadcast and licensing enquiries are administered by King Dawie Publishing. Use Contact and select Publishing & rights, or write directly to the publishing email listed on the Contact page.",
      },
      {
        q: "How do I become a partner or sponsor?",
        a: "Visit Partners to learn about sponsorship tiers, then create a sponsor account and submit an application. Applications are reviewed by the partnership office and tracked in your sponsor dashboard.",
      },
    ],
  },
];
