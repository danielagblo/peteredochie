import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowRight } from 'lucide-react';
import Reveal from '@/components/Reveal';
import { PageHead, PageHero, Section, SectionTitle } from '@/components/Section';
import { IMG, SPONSORS } from '@/lib/content';
import { useAuth } from '@/contexts/AuthContext';
import { formatUSD } from '@/lib/commerce';
import { apiCrud } from '@/lib/api';

const SponsorsPage = () => {
    const { isAuthed } = useAuth();
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiCrud
            .list('sponsorship-packages', { filter: `enabled = true`, sort: 'sort' })
            .then(setPackages)
            .catch(() => setPackages([]))
            .finally(() => setLoading(false));
    }, []);

    const applyTo = isAuthed ? '/sponsor-apply' : '/join?type=sponsor&next=/sponsor-apply';

    return (
        <div>
            <PageHead
                title="Sponsors & Partners | The Pete Edochie Legacy | King Dawie Publishing"
                description="Partnership opportunities with the Pete Edochie Legacy: Platinum, Gold, Silver and Bronze sponsorship packages with benefits, deliverables and event visibility."
            />
            <PageHero eyebrow="Sponsors & Partners" title="Institutions that carry this forward" lead="The archive, the events and the mentorship cohorts are sustained by partners who think in decades. Choose a package and apply to partner with the legacy." image={IMG.podium} />

            <Section className="py-24 md:py-32" width="max-w-[80rem]">
                <SectionTitle eyebrow="Current partners" title="In good company" />
                <div className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-2 md:grid-cols-3">
                    {SPONSORS.map((s) => (
                        <div key={s} className="flex h-32 items-center justify-center bg-background px-6 text-center">
                            <span className="font-display text-xl text-muted-foreground">{s}</span>
                        </div>
                    ))}
                </div>
            </Section>

            <div className="border-y border-border bg-[hsl(var(--surface))] py-24 md:py-32">
                <Section width="max-w-[90rem]">
                    <div className="flex flex-wrap items-end justify-between gap-6">
                        <SectionTitle eyebrow="Partnership" title="Four sponsorship packages" />
                        <Link to={applyTo} className="flex items-center gap-2 border border-[hsl(var(--gold))]/60 px-6 py-3 text-[0.66rem] uppercase tracking-[0.22em] text-[hsl(var(--gold))] transition-colors hover:bg-[hsl(var(--gold))] hover:text-black">
                            Become a sponsor <ArrowRight size={14} strokeWidth={1.6} />
                        </Link>
                    </div>

                    {loading ? (
                        <div className="mt-14 flex items-center gap-3 text-sm text-muted-foreground">
                            <Loader2 size={16} className="animate-spin" /> Loading packages…
                        </div>
                    ) : (
                        <div className="mt-14 grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
                            {packages.map((p, i) => {
                                const benefits = Array.isArray(p.benefits) ? p.benefits : [];
                                const deliverables = Array.isArray(p.deliverables) ? p.deliverables : [];
                                return (
                                    <Reveal key={p.id} delay={i * 0.05}>
                                        <div className="flex h-full flex-col bg-[hsl(var(--surface))] p-8">
                                            <p className="text-[0.6rem] uppercase tracking-[0.22em] text-muted-foreground">{p.tier}</p>
                                            <p className="mt-2 font-display text-3xl">{p.name}</p>
                                            <p className="mt-2 text-[0.68rem] uppercase tracking-[0.2em] text-[hsl(var(--gold))]">{formatUSD(p.price)}</p>
                                            <p className="mt-1 text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">{p.duration || '12 months'}</p>
                                            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{p.description}</p>

                                            <p className="mt-6 text-[0.58rem] uppercase tracking-[0.2em] text-[hsl(var(--gold))]">Benefits</p>
                                            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                                                {benefits.map((b) => (
                                                    <li key={b} className="flex gap-2">
                                                        <span className="mt-2 h-px w-3 shrink-0 bg-[hsl(var(--gold))]" />
                                                        {b}
                                                    </li>
                                                ))}
                                            </ul>

                                            <p className="mt-5 text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">Deliverables</p>
                                            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                                                {deliverables.map((d) => (
                                                    <li key={d} className="flex gap-2">
                                                        <span className="mt-2 h-px w-3 shrink-0 bg-border" />
                                                        {d}
                                                    </li>
                                                ))}
                                            </ul>

                                            <Link to={applyTo} className="mt-7 border border-border py-3.5 text-center text-[0.64rem] uppercase tracking-[0.22em] transition-colors hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]">
                                                Apply as {p.name}
                                            </Link>
                                        </div>
                                    </Reveal>
                                );
                            })}
                        </div>
                    )}
                </Section>
            </div>

            <Section className="py-24 md:py-32" width="max-w-[64rem]">
                <div className="border border-border bg-card p-10 text-center">
                    <p className="eyebrow">Bespoke partnerships</p>
                    <h2 className="mt-4 font-display text-3xl md:text-4xl">Looking for something tailored?</h2>
                    <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                        For founding-institution and archive-naming partnerships, or multi-country underwriting, our partnership team will design a bespoke package with you.
                    </p>
                    <Link to="/contact" className="mt-7 inline-block border border-[hsl(var(--gold))]/60 px-8 py-4 text-[0.68rem] uppercase tracking-[0.22em] text-[hsl(var(--gold))] transition-colors hover:bg-[hsl(var(--gold))] hover:text-black">
                        Contact the partnership team
                    </Link>
                </div>
            </Section>
        </div>
    );
};

export default SponsorsPage;
