import React from 'react';
import { Link } from 'react-router-dom';
import { PageHead, PageHero, Section, SectionTitle } from '@/components/Section';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FAQ_SECTIONS, IMG, PUBLISHER } from '@/lib/content';
import { whatsappHref } from '@/lib/whatsapp';

const FaqPage = () => (
    <div>
        <PageHead
            title="Frequently Asked Questions | The Peter Edochie Legacy | King Dawie Publishing"
            description="Answers about the Peter Edochie Legacy platform — the autobiography, events, mentorship, orders, accounts and publishing enquiries."
        />
        <PageHero
            eyebrow="Help"
            title="Frequently asked questions"
            lead="Quick answers about the archive, the book, events, mentorship, orders and how to reach the publishing office."
            image={IMG.podium}
        />

        <Section className="py-24 md:py-32" width="max-w-[56rem]">
            <SectionTitle
                eyebrow="Common questions"
                title="What visitors ask most"
                lead="If your question is not covered here, contact the office or message us on WhatsApp."
            />

            <div className="mt-14 space-y-16">
                {FAQ_SECTIONS.map((section) => (
                    <div key={section.title}>
                        <h2 className="font-display text-3xl">{section.title}</h2>
                        <Accordion type="single" collapsible className="mt-6 border-t border-border">
                            {section.items.map((item) => (
                                <AccordionItem key={item.q} value={item.q} className="border-border">
                                    <AccordionTrigger className="py-5 font-display text-lg hover:no-underline md:text-xl">
                                        {item.q}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm leading-[1.9] text-muted-foreground">
                                        {item.a}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                ))}
            </div>

            <div className="mt-16 border border-border p-8 md:p-10">
                <p className="eyebrow">Still need help?</p>
                <p className="mt-4 font-display text-2xl">Talk to the publishing office</p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    For media, bookings, rights, partnership or anything not answered above, write to {PUBLISHER.name} or
                    message us on WhatsApp. We aim to respond within three working days.
                </p>
                <div className="mt-6 flex flex-wrap gap-4">
                    <Link
                        to="/contact"
                        className="inline-block border border-[hsl(var(--gold))]/70 px-6 py-3 text-[0.68rem] uppercase tracking-[0.2em] text-[hsl(var(--gold))]"
                    >
                        Contact the office
                    </Link>
                    <a
                        href={whatsappHref(`Hello ${PUBLISHER.name}. I have a question about the Peter Edochie Legacy platform.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-[hsl(var(--primary))] px-6 py-3 text-[0.68rem] uppercase tracking-[0.2em] text-white"
                    >
                        WhatsApp {PUBLISHER.phoneDisplay}
                    </a>
                </div>
            </div>
        </Section>
    </div>
);

export default FaqPage;
