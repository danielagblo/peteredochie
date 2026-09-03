import React from 'react';
import Reveal from '@/components/Reveal';
import CountUp from '@/components/CountUp';
import { PageHead, PageHero, Section, SectionTitle } from '@/components/Section';
import { IMG } from '@/lib/content';

const WORKS = [
    { title: 'Things Fall Apart', year: '1987', role: 'Okonkwo', note: 'The adaptation that placed Igbo tragedy on the world stage.' },
    { title: 'Igodo', year: '1999', role: 'Elder of the council', note: 'Epic folklore rendered with ritual seriousness.' },
    { title: 'The Battle of Love', year: '2002', role: 'Chief Obiora', note: 'A study of paternal authority and its cost.' },
    { title: 'Lionheart', year: '2018', role: 'Chief Ernest Obiagu', note: 'A late-career turn for a global streaming audience.' },
    { title: 'Inale', year: '2010', role: 'The King', note: 'Musical folklore, staged with operatic restraint.' },
    { title: 'The Widow', year: '2005', role: 'Nnaemeka', note: 'Grief and inheritance in a changing Anambra.' },
];

const IMPACT = [
    { t: 'Language', d: 'Proverb restored to screen dialogue as argument, not decoration — a grammar later adopted across the industry.' },
    { t: 'Craft', d: 'Stillness over spectacle. A generation of actors learned that the camera moves toward whoever is calm.' },
    { t: 'Standards', d: 'Public refusal of work that caricatured the culture, at a time when refusing was expensive.' },
    { t: 'Continuity', d: 'Direct mentorship of younger performers, producers and writers across Nigeria, Ghana and Kenya.' },
];

const LegacyPage = () => (
    <div>
        <PageHead
            title="Legacy Archive — The Work and Cultural Impact of Pete Edochie"
            description="A curated archive of Pete Edochie's screen work and an account of his cultural impact on African cinema, language and craft."
        />
        <PageHero
            eyebrow="Legacy"
            title="The archive"
            lead="A curated record of the work, and of what the work changed."
            image={IMG.artifact}
        />

        <Section className="py-24 md:py-32" width="max-w-[80rem]">
            <div className="grid gap-10 border-b border-border pb-16 md:grid-cols-4">
                {[
                    { v: 200, s: '+', l: 'Screen appearances' },
                    { v: 40, s: '+', l: 'Years on camera' },
                    { v: 18, s: '', l: 'Major honours' },
                    { v: 12, s: '', l: 'Countries screened' },
                ].map((s) => (
                    <Reveal key={s.l}>
                        <p className="font-display text-5xl text-[hsl(var(--gold))]">
                            <CountUp value={s.v} suffix={s.s} />
                        </p>
                        <p className="mt-3 text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground">{s.l}</p>
                    </Reveal>
                ))}
            </div>

            <SectionTitle className="mt-20" eyebrow="Selected works" title="From the catalogue" />
            <div className="mt-12 divide-y divide-border border-y border-border">
                {WORKS.map((w, i) => (
                    <Reveal key={w.title} delay={i * 0.04}>
                        <div className="grid gap-2 py-7 transition-colors hover:bg-white/[0.02] md:grid-cols-[6rem_1fr_14rem_1fr] md:items-baseline md:gap-8">
                            <span className="text-[hsl(var(--gold))]">{w.year}</span>
                            <span className="font-display text-2xl">{w.title}</span>
                            <span className="text-sm text-muted-foreground">{w.role}</span>
                            <span className="text-sm text-muted-foreground">{w.note}</span>
                        </div>
                    </Reveal>
                ))}
            </div>
        </Section>

        <div className="border-t border-border bg-[hsl(var(--surface))] py-24 md:py-32">
            <Section width="max-w-[80rem]">
                <div className="grid gap-14 md:grid-cols-[1fr_1.1fr] md:items-center">
                    <Reveal>
                        <img src={IMG.set} alt="On a Nollywood film set" className="w-full object-cover" />
                    </Reveal>
                    <div>
                        <SectionTitle eyebrow="Cultural impact" title="What changed, because of the work" />
                        <div className="mt-10 space-y-8">
                            {IMPACT.map((x, i) => (
                                <Reveal key={x.t} delay={i * 0.06}>
                                    <div className="border-l border-[hsl(var(--gold))]/50 pl-6">
                                        <p className="font-display text-2xl">{x.t}</p>
                                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{x.d}</p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </div>
            </Section>
        </div>
    </div>
);

export default LegacyPage;
