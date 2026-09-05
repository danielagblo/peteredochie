import React from 'react';
import Reveal from '@/components/Reveal';
import { PageHead, PageHero, Section, SectionTitle } from '@/components/Section';
import { AWARDS, IMG, LEGACY, MILESTONES, PUBLISHER } from '@/lib/content';

const PetePage = () => (
    <div>
        <PageHead
            title={`${LEGACY.name} — Actor | Biography, Career and Honours | King Dawie Publishing`}
            description={`The life and screen career of ${LEGACY.name}, the Nigerian actor — childhood in Enugu, the broadcasting years, Things Fall Apart, four decades of Nollywood, and the honours that followed.`}
        />
        <PageHero
            eyebrow="The Man"
            title={<>{LEGACY.name}</>}
            lead={`${LEGACY.title}, broadcaster, elder. The biography of one of Africa's most recognised screen actors — written the way he speaks: slowly, and with weight on every word.`}
            image={IMG.portrait}
        />

        <Section className="grid gap-14 py-24 md:grid-cols-[1.2fr_0.8fr] md:py-32" width="max-w-[80rem]">
            <div className="space-y-6 text-base leading-[1.9] text-muted-foreground">
                <p className="font-display text-3xl leading-snug text-foreground">
                    He was born into a household where language was treated as property: something inherited, cared for,
                    and passed on intact.
                </p>
                <p>
                    Enugu in the years after independence was a city of radio. Voices carried further than pictures, and
                    the young Peter Edochie learned early that a sentence delivered with patience defeats a sentence
                    delivered with volume. That training — first in the classroom, then in broadcasting — became the
                    foundation of everything the cameras would later capture.
                </p>
                <p>
                    When the adaptation of Chinua Achebe&rsquo;s <em>Things Fall Apart</em> went into production, the role of
                    Okonkwo required an actor who could be simultaneously proud and breakable. What he delivered was not
                    an interpretation of an African man for foreign eyes; it was a recognition, offered back to the
                    people who had lived it.
                </p>
                <p>
                    In the decades since, across more than two hundred screen appearances, he has played the father, the
                    chief, the conscience, the warning. He has also refused a great deal — roles that mocked the culture,
                    scripts that mistook noise for drama. That refusal is as much a part of the legacy as the work
                    itself.
                </p>
                <p>
                    Today he speaks at universities, sits with young filmmakers, and gives his time to a mentorship
                    initiative that carries his method to a generation he will never appear on screen with. The archive
                    on this platform exists so that method is not lost.
                </p>
            </div>
            <div className="space-y-10">
                <Reveal>
                    <img src={IMG.podium} alt="Peter Edochie speaking at a university convocation" className="w-full object-cover" />
                </Reveal>
                <Reveal delay={0.1}>
                    <div className="border-t border-border pt-8">
                        <p className="eyebrow">At a glance</p>
                        <dl className="mt-6 space-y-4 text-sm">
                            {[
                                ['Born', 'Enugu, Nigeria'],
                                ['Origin', 'Nteje, Anambra State'],
                                ['First career', 'Broadcasting'],
                                ['Defining role', 'Okonkwo, Things Fall Apart'],
                                ['Screen credits', 'Over 200'],
                                ['National honour', 'MFR'],
                            ].map(([k, v]) => (
                                <div key={k} className="flex justify-between gap-6 border-b border-border/60 pb-3">
                                    <dt className="text-muted-foreground">{k}</dt>
                                    <dd className="text-right">{v}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </Reveal>
            </div>
        </Section>

        <div className="border-y border-border bg-[hsl(var(--surface))] py-24 md:py-32">
            <Section width="max-w-[80rem]">
                <SectionTitle eyebrow="Career" title="The chapters" />
                <div className="mt-14 grid gap-px bg-border md:grid-cols-2">
                    {MILESTONES.map((m, i) => (
                        <Reveal key={m.year} delay={i * 0.05}>
                            <div className="h-full bg-[hsl(var(--surface))] p-9">
                                <p className="font-display text-3xl text-[hsl(var(--gold))]">{m.year}</p>
                                <p className="mt-3 font-display text-2xl">{m.title}</p>
                                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{m.text}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </Section>
        </div>

        <Section className="grid gap-14 py-24 md:grid-cols-[1fr_1fr] md:items-center md:py-32" width="max-w-[80rem]">
            <div>
                <SectionTitle eyebrow="Honours" title="Recognition, quietly received" />
                <ul className="mt-12 divide-y divide-border border-y border-border">
                    {AWARDS.map((a) => (
                        <li key={a.name} className="flex items-start justify-between gap-6 py-6">
                            <div>
                                <p className="font-display text-xl">{a.name}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                            </div>
                            <span className="text-sm text-[hsl(var(--gold))]">{a.year}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <Reveal delay={0.1}>
                <img src={IMG.award} alt="Peter Edochie receiving a lifetime achievement award" className="w-full object-cover" />
            </Reveal>
        </Section>

        <div className="border-t border-border bg-[hsl(var(--surface))] py-20">
            <Section width="max-w-[80rem]">
                <div className="grid gap-8 md:grid-cols-[1fr_1.4fr] md:items-center">
                    <div>
                        <p className="eyebrow">Rights holder &amp; publisher</p>
                        <p className="mt-4 font-display text-3xl text-[hsl(var(--gold))]">{PUBLISHER.name}</p>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        The Peter Edochie Legacy — including this biography, the archive, the autobiography and the
                        events — is owned, published and administered by {PUBLISHER.name} as the official rights
                        holder. All biographical material, photographs and recordings on this platform are protected
                        under copyright held by {PUBLISHER.name}. Reproduction, adaptation or commercial use requires
                        written authorisation from the publishing office.
                    </p>
                </div>
            </Section>
        </div>
    </div>
);

export default PetePage;
