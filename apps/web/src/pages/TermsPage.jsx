import React from 'react';
import { Link } from 'react-router-dom';
import { PageHead, PageHero, Section, SectionTitle } from '@/components/Section';
import { IMG, PUBLISHER } from '@/lib/content';

const SECTIONS = [
    {
        h: '1. The platform operator',
        p: `These Terms of Service govern your use of the Peter Edochie Legacy platform. The platform is owned, published and operated by ${PUBLISHER.name}, the official owner and rights holder of the Peter Edochie Legacy. By accessing or using any part of the platform — the archive, the autobiography, events, the Meet & Greet, the mentorship programme or member dashboard — you agree to be bound by these terms.`,
    },
    {
        h: '2. Ownership & intellectual property',
        p: `All content on this platform, including biographical text, photographs, archive recordings, the autobiography, event materials and all associated artwork, branding and design, is the property of ${PUBLISHER.name} and is protected under applicable copyright and intellectual property laws. No material may be reproduced, distributed, adapted, broadcast, performed, published or commercially exploited in any form without the prior written authorisation of ${PUBLISHER.name}.`,
    },
    {
        h: '3. Member accounts',
        p: 'Certain features require a registered account. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. Accounts are non-transferable. We may suspend or terminate access where activity breaches these terms or is unlawful, abusive or fraudulent.',
    },
    {
        h: '4. Orders, tickets & payments',
        p: `Reservations for the autobiography and tickets for events create an order or pass record in your dashboard. Secure payment, confirmation and delivery tracking are administered by ${PUBLISHER.name}. Event tickets are issued as single-use QR passes and are non-transferable unless stated otherwise. Refund and cancellation terms are communicated at the point of purchase.`,
    },
    {
        h: '5. Acceptable use',
        p: 'You agree not to misuse the platform — including attempting unauthorised access, disrupting service, scraping content, infringing rights, or submitting false, unlawful or abusive enquiries or applications. Mentorship and partnership applications must be accurate and made in good faith.',
    },
    {
        h: '6. Third-party links',
        p: 'The platform may link to third-party services (payment, streaming or partner sites). We are not responsible for the content, practices or availability of those external services.',
    },
    {
        h: '7. Changes to these terms',
        p: `We may update these terms as the platform evolves. Continued use after changes are posted constitutes acceptance of the revised terms. The most current version is always available on this page, administered by ${PUBLISHER.name}.`,
    },
    {
        h: '8. Governing law',
        p: 'These terms are governed by the laws of the Federal Republic of Nigeria. Disputes shall be resolved in the competent courts of Nigeria, without prejudice to any mandatory consumer protections that apply to you.',
    },
];

const TermsPage = () => (
    <div>
        <PageHead
            title="Terms of Service | The Peter Edochie Legacy | King Dawie Publishing"
            description="Terms of Service for the Peter Edochie Legacy platform, operated by King Dawie Publishing as the official owner and rights holder."
        />
        <PageHero
            eyebrow="Legal"
            title="Terms of Service"
            lead={`The Peter Edochie Legacy platform is owned, published and operated by ${PUBLISHER.name}.`}
            image={IMG.cover}
        />

        <Section className="py-24 md:py-32" width="max-w-[56rem]">
            <SectionTitle eyebrow="Agreement" title="The terms that govern your visit" lead={`Last updated ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}. By using this platform you accept the terms below.`} />
            <div className="mt-14 space-y-10">
                {SECTIONS.map((s) => (
                    <div key={s.h}>
                        <h2 className="font-display text-2xl">{s.h}</h2>
                        <p className="mt-4 text-sm leading-[1.9] text-muted-foreground">{s.p}</p>
                    </div>
                ))}
            </div>

            <div className="mt-16 border-t border-border pt-8">
                <p className="eyebrow">Questions about these terms</p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    For any question about these terms, or for rights and licensing inquiries, contact the publishing office.
                </p>
                <Link to="/contact" className="mt-5 inline-block text-[0.7rem] uppercase tracking-[0.22em] text-[hsl(var(--gold))]">
                    Contact {PUBLISHER.name}
                </Link>
            </div>
        </Section>
    </div>
);

export default TermsPage;
