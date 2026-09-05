import React from 'react';
import { Link } from 'react-router-dom';
import { PageHead, PageHero, Section, SectionTitle } from '@/components/Section';
import { IMG, PUBLISHER } from '@/lib/content';

const SECTIONS = [
    {
        h: '1. The data controller',
        p: `The Peter Edochie Legacy platform is owned, published and operated by ${PUBLISHER.name}, which acts as the data controller responsible for your personal information collected through this platform.`,
    },
    {
        h: '2. Information we collect',
        p: 'We collect the information you provide directly: your name, email address, organisation (where given), and the content of enquiries, mentorship applications and event or book reservations. We also collect limited technical data (such as device and browser) needed to operate the platform securely.',
    },
    {
        h: '3. How we use your information',
        p: 'Your information is used to administer your account, process orders and event tickets, respond to enquiries and applications, deliver the screening room and journal, and communicate with you about the legacy platform. Publishing and rights inquiries are routed to the publishing office of King Dawie Publishing.',
    },
    {
        h: '4. Sharing',
        p: 'We do not sell your personal information. We share data only with trusted service providers who help us operate the platform (for example payment and email delivery), and where required by law. Partners such as event venues receive only what is necessary to fulfil a ticket or booking.',
    },
    {
        h: '5. Retention',
        p: 'We retain your information for as long as your account is active and for as long as needed to fulfil orders, respond to inquiries and meet legal obligations. You may request deletion of your account and associated data at any time.',
    },
    {
        h: '6. Your rights',
        p: 'You may access, correct, export or request deletion of your personal information. To exercise any of these rights, contact the publishing office. We will respond within a reasonable period and in accordance with applicable law.',
    },
    {
        h: '7. Security',
        p: 'We apply reasonable technical and organisational measures to protect your information. No method of transmission or storage is fully secure, but we work to safeguard your data using industry-standard practices.',
    },
    {
        h: '8. Changes to this policy',
        p: `We may update this Privacy Policy as the platform evolves. The most current version is always available on this page, administered by ${PUBLISHER.name}.`,
    },
];

const PrivacyPage = () => (
    <div>
        <PageHead
            title="Privacy Policy | The Peter Edochie Legacy | King Dawie Publishing"
            description="Privacy Policy for the Peter Edochie Legacy platform, operated by King Dawie Publishing as the official owner and rights holder."
        />
        <PageHero
            eyebrow="Legal"
            title="Privacy Policy"
            lead={`Your privacy is respected by ${PUBLISHER.name}, the operator of the Peter Edochie Legacy platform.`}
            image={IMG.cover}
        />

        <Section className="py-24 md:py-32" width="max-w-[56rem]">
            <SectionTitle eyebrow="Your data" title="How we handle your information" lead={`Last updated ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}. This policy explains what we collect and why.`} />
            <div className="mt-14 space-y-10">
                {SECTIONS.map((s) => (
                    <div key={s.h}>
                        <h2 className="font-display text-2xl">{s.h}</h2>
                        <p className="mt-4 text-sm leading-[1.9] text-muted-foreground">{s.p}</p>
                    </div>
                ))}
            </div>

            <div className="mt-16 border-t border-border pt-8">
                <p className="eyebrow">Privacy &amp; data requests</p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    To access, correct or delete your personal data, or to ask any question about this policy, contact the publishing office.
                </p>
                <Link to="/contact" className="mt-5 inline-block text-[0.7rem] uppercase tracking-[0.22em] text-[hsl(var(--gold))]">
                    Contact {PUBLISHER.name}
                </Link>
            </div>
        </Section>
    </div>
);

export default PrivacyPage;
