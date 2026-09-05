import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CalendarDays, Users } from 'lucide-react';
import Reveal from '@/components/Reveal';
import { Section, SectionTitle } from '@/components/Section';
import { BRAND, IMG, LAUNCH, MESSAGING_PILLARS } from '@/lib/content';

const LaunchSection = () => (
    <div className="border-y border-border bg-[hsl(var(--primary))] py-24 text-white md:py-32">
        <Section width="max-w-[80rem]">
            <div className="grid gap-14 md:grid-cols-[1.1fr_1fr] md:items-center">
                <Reveal>
                    <div>
                        <p className="eyebrow text-white/70">{LAUNCH.headline}</p>
                        <h2 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
                            {LAUNCH.activationCity}
                            <span className="mt-2 block text-white">{LAUNCH.activationDate}</span>
                        </h2>
                        <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80">{LAUNCH.lead}</p>
                        <p className="mt-4 text-sm text-white/60">{LAUNCH.venue}</p>
                        <p className="mt-6 text-[0.68rem] uppercase tracking-[0.24em] text-white/50">{BRAND.hashtag}</p>
                    </div>
                </Reveal>
                <Reveal delay={0.08}>
                    <div className="grid gap-px border border-white/15 bg-white/10">
                        <Link
                            to="/book"
                            className="group flex items-center gap-4 bg-white/[0.04] p-6 transition-colors hover:bg-white/[0.08]"
                        >
                            <BookOpen size={22} strokeWidth={1.4} className="shrink-0 text-white" />
                            <div className="flex-1">
                                <p className="font-display text-xl">Pre-order the autobiography</p>
                                <p className="mt-1 text-sm text-white/70">Secure your edition with payment before the Ghana launch</p>
                            </div>
                            <ArrowRight size={16} className="text-white/70 transition-transform group-hover:translate-x-1" />
                        </Link>
                        <Link
                            to="/events"
                            className="group flex items-center gap-4 bg-white/[0.04] p-6 transition-colors hover:bg-white/[0.08]"
                        >
                            <CalendarDays size={22} strokeWidth={1.4} className="shrink-0 text-white" />
                            <div className="flex-1">
                                <p className="font-display text-xl">Launch event registration</p>
                                <p className="mt-1 text-sm text-white/70">Accra International Conference Centre</p>
                            </div>
                            <ArrowRight size={16} className="text-white/70 transition-transform group-hover:translate-x-1" />
                        </Link>
                        <Link
                            to="/mentorship"
                            className="group flex items-center gap-4 bg-white/[0.04] p-6 transition-colors hover:bg-white/[0.08]"
                        >
                            <Users size={22} strokeWidth={1.4} className="shrink-0 text-white" />
                            <div className="flex-1">
                                <p className="font-display text-xl">Mentorship applications</p>
                                <p className="mt-1 text-sm text-white/70">Apply to the African Youth Mentorship Initiative</p>
                            </div>
                            <ArrowRight size={16} className="text-white/70 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </Reveal>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {MESSAGING_PILLARS.map((pillar, i) => (
                    <Reveal key={pillar.title} delay={i * 0.05}>
                        <div className="border border-white/15 bg-white/[0.03] p-6">
                            <p className="font-display text-xl text-white">{pillar.title}</p>
                            <p className="mt-3 text-sm leading-relaxed text-white/75">{pillar.text}</p>
                        </div>
                    </Reveal>
                ))}
            </div>

            <Reveal delay={0.12}>
                <img
                    src={IMG.stage}
                    alt="Pete Edochie legacy launch"
                    className="mt-14 w-full object-cover [filter:brightness(0.85)]"
                />
            </Reveal>
        </Section>
    </div>
);

export default LaunchSection;
