import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Reveal from '@/components/Reveal';
import CountUp from '@/components/CountUp';
import Seo from '@/components/Seo';
import { PageHead, Section, SectionTitle } from '@/components/Section';
import SubscribeSection from '@/components/SubscribeSection';
import LaunchSection from '@/components/LaunchSection';
import LaunchCountdown from '@/components/LaunchCountdown';
import PreOrderCta from '@/components/PreOrderCta';
import {
  AWARDS,
  BOOK,
  DOCUMENTARY,
  ENDORSEMENTS,
  IMG,
  LEGACY,
  MENTORSHIP_BRIDGE,
  MERCH_PREVIEW,
  ARCHIVE_PREVIEW,
  MILESTONES,
  OFFICIAL_EVENTS,
  PROJECT,
  TESTIMONIALS,
  TIERS,
} from '@/lib/content';
import { apiCrud } from '@/lib/api';
const HomePage = () => {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    apiCrud.list('events', { sort: 'starts', page: 1, perPage: 5 }).then((items) => {
      const stale =
        /Cumberland|Eko Hotel|Journey Continues|Writing With Purpose|Intimate Evening|Press Conference|Private Legacy Session|Project Launch — Ghana/i;
      const cleaned = (items || []).filter((e) => !stale.test(e.title || ''));
      const lineupTitles = /^(Arrival|AMC|Gala|Meet and Greet|Lecture Series)/i;
      const lineup = cleaned.filter((e) => lineupTitles.test(e.title || ''));
      setEvents((lineup.length >= 3 ? lineup : OFFICIAL_EVENTS).slice(0, 5));
    }).catch(() => setEvents(OFFICIAL_EVENTS.slice(0, 5)));
  }, []);
  return <div>
            <PageHead title="Pete Edochie — Actor | The Official Legacy Platform | King Dawie Publishing" description="The official digital home of Pete Edochie, the Nigerian actor — biography, screen archive, autobiography, events, Meet & Greet, and the African Youth Mentorship Initiative. Published by King Dawie Publishing." />
            <Seo title="Pete Edochie — Actor | The Official Legacy Platform" description="The screen archive, autobiography, events and mentorship of Pete Edochie — Nigerian actor and elder statesman of African cinema. Published by King Dawie Publishing." image={IMG.cover} siteName="The Pete Edochie Legacy — King Dawie Publishing" />

            {/* HERO — full-bleed cover, below fixed header */}
            <section className="relative mt-[4.25rem] flex min-h-[52svh] flex-col justify-end overflow-hidden bg-[#07101c] md:mt-[4.5rem] md:min-h-[62svh]">
                <div className="absolute inset-0">
                    <motion.img
                        src={IMG.cover}
                        alt="Pete Edochie — The Legacy Project cover"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-0 h-full w-full object-cover object-[center_18%] md:object-[center_22%]"
                    />
                    <div
                        className="absolute inset-0"
                        style={{
                            background:
                                "linear-gradient(to top, rgba(4,10,18,0.9) 0%, rgba(4,10,18,0.42) 38%, rgba(4,10,18,0.12) 68%, rgba(4,10,18,0.22) 100%)",
                        }}
                    />
                </div>
                <div className="relative z-10 mx-auto w-full max-w-[90rem] px-5 pb-8 pt-10 md:px-10 md:pb-11 md:pt-12">
                    <motion.h1
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        className="font-hero max-w-5xl text-[clamp(2.35rem,5.8vw,4.5rem)] font-medium leading-[1.05] tracking-tight text-white"
                    >
                        <span className="md:hidden">
                            A voice that taught
                            <br />
                            a continent
                        </span>
                        <span className="hidden md:inline">A voice that taught a continent</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.85, duration: 0.8 }}
                        className="mt-5 max-w-2xl text-sm leading-relaxed text-white/80 md:text-[0.95rem]"
                    >
                        {PROJECT.whatItIs}
                    </motion.p>
                </div>
            </section>

            <LaunchCountdown />

            {/* MARQUEE — rolling catalogue */}
            <div className="overflow-hidden border-y border-border bg-[hsl(var(--surface))] py-5">
                <div className="flex w-max animate-[marquee_38s_linear_infinite] gap-14 whitespace-nowrap">
                    {[0, 1].map(k => <div key={k} className="flex gap-14">
                            {['Things Fall Apart', 'Over 200 screen roles', 'Member of the Order of the Federal Republic of Nigeria', 'The Autobiography — 2026'].map(t => <span key={t} className="flex items-center gap-14 font-display text-lg text-muted-foreground">
                                        {t}
                                        <span className="text-[hsl(var(--gold))]">◆</span>
                                    </span>)}
                        </div>)}
                </div>
                <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
            </div>

            {/* SUPPORTERS — after catalogue */}
            <div className="border-b border-border bg-background py-8 md:py-10">
                <div className="mx-auto flex w-full max-w-[90rem] flex-col items-center justify-center gap-5 px-5 text-center md:px-10">
                    <p className="text-[0.62rem] uppercase tracking-[0.28em] text-muted-foreground">
                        Supported by
                    </p>
                    <Link
                        to="/sponsors"
                        className="bg-[hsl(var(--primary))] px-10 py-4 text-[0.75rem] font-bold uppercase tracking-[0.24em] text-[hsl(var(--primary-foreground))] transition-transform active:scale-[0.98]"
                    >
                        Become a partner
                    </Link>
                </div>
            </div>

            <LaunchSection />

            {/* CREDIBILITY */}
            <div className="border-b border-border bg-[hsl(var(--surface))] py-16 md:py-20">
                <Section width="max-w-[80rem]">
                    <div className="grid gap-12 md:grid-cols-[1fr_1.2fr] md:items-end">
                        <div>
                            <SectionTitle eyebrow="Credibility" title="A life recognised" lead="Professional biography, national honours and a public voice on craft and culture." />
                            <Link to={LEGACY.bioPath} className="mt-6 inline-flex items-center gap-3 text-[0.72rem] uppercase tracking-[0.24em] text-[hsl(var(--gold))]">
                                Read the full biography <ArrowRight size={14} strokeWidth={1.6} />
                            </Link>
                        </div>
                        <ul className="space-y-4 border-t border-border pt-6">
                            {AWARDS.slice(0, 3).map((a) => (
                                <li key={a.name} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-4">
                                    <span className="font-display text-lg">{a.name}</span>
                                    <span className="text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">{a.year} · {a.body}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </Section>
            </div>

            {/* STORY */}
            <Section className="grid gap-14 py-24 md:grid-cols-[1fr_1.1fr] md:items-center md:py-32" width="max-w-[80rem]">
                <Reveal>
                    <div className="relative">
                        <img src={IMG.portrait} alt="Portrait of Pete Edochie in traditional attire" className="aspect-[3/4] w-full object-cover object-[center_15%]" />
                        <div className="absolute -bottom-6 -right-4 hidden bg-background px-6 py-5 md:block">
                            <p className="font-display text-4xl text-[hsl(var(--gold))]">
                                <CountUp value={60} suffix="+" />
                            </p>
                            <p className="mt-1 text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground">Years of work</p>
                        </div>
                    </div>
                </Reveal>
                <div>
                    <SectionTitle eyebrow="The Man" title={<>Not a performance.<br />A way of carrying culture.</>} />
                    <Reveal delay={0.1}>
                        <p className="mt-6 text-base leading-[1.85] text-muted-foreground">
                            Long before the cameras, there was the voice — trained in broadcasting, tempered by the
                            proverbs of Anambra, and unwilling to shout when stillness would do. When he became Okonkwo,
                            an entire continent recognised something it already knew about itself.
                        </p>
                        <p className="mt-5 text-base leading-[1.85] text-muted-foreground">
                            What followed was not simply a filmography. It was the slow construction of a moral presence
                            on screen: the father, the elder, the conscience in the room. This platform gathers that
                            work, and the life behind it, with the care of an archive rather than the noise of publicity.
                        </p>
                        <div className="mt-9 flex flex-wrap items-center gap-4">
                            <Link to="/peter-edochie" className="inline-flex items-center gap-3 border-b border-[hsl(var(--gold))]/60 pb-2 text-[0.72rem] uppercase tracking-[0.24em] text-[hsl(var(--gold))]">
                                Read the full biography <ArrowRight size={14} strokeWidth={1.6} />
                            </Link>
                            <PreOrderCta variant="gold" />
                        </div>
                    </Reveal>
                </div>
            </Section>

            {/* LEGACY TIMELINE */}
            <div className="border-y border-border bg-[hsl(var(--surface))] py-24 md:py-32">
                <Section width="max-w-[80rem]">
                    <SectionTitle eyebrow="Legacy" title="Six decades, in movements" />
                    <div className="mt-14 divide-y divide-border border-t border-border">
                        {MILESTONES.map((m, i) => <Reveal key={m.year} delay={i * 0.05}>
                                <div className="group grid gap-3 py-8 transition-colors hover:bg-white/[0.02] md:grid-cols-[8rem_16rem_1fr] md:gap-8">
                                    <span className="font-display text-2xl text-[hsl(var(--gold))]">{m.year}</span>
                                    <span className="font-display text-2xl">{m.title}</span>
                                    <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{m.text}</p>
                                </div>
                            </Reveal>)}
                    </div>
                </Section>
            </div>

            {/* BOOK */}
            <Section className="grid gap-14 py-24 md:grid-cols-2 md:items-center md:py-32" width="max-w-[80rem]">
                <div>
                    <SectionTitle eyebrow="The Autobiography" title={BOOK.title} lead={BOOK.shortDescription} />
                    <p className="mt-4 text-[0.72rem] uppercase tracking-[0.22em] text-[hsl(var(--gold))]">{BOOK.tagline}</p>
                    <Reveal delay={0.1}>
                        <div className="mt-9 flex flex-wrap gap-4">
                            <PreOrderCta />
                            <Link to="/book" className="border border-border px-8 py-4 text-[0.7rem] uppercase tracking-[0.24em] transition-colors hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]">
                                Read an extract
                            </Link>
                        </div>
                    </Reveal>
                </div>
                <Reveal delay={0.15}>
                    <img src={IMG.book} alt="The autobiography, hardcover edition" className="w-full object-cover" />
                </Reveal>
            </Section>

            {/* DOCUMENTARY TEASER */}
            <div className="border-y border-border bg-[hsl(var(--surface))] py-16 md:py-20">
                <Section width="max-w-[80rem]">
                    <Reveal>
                        <p className="eyebrow">{DOCUMENTARY.eyebrow}</p>
                        <h2 className="mt-4 font-display text-3xl md:text-4xl">{DOCUMENTARY.title}</h2>
                        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">{DOCUMENTARY.text}</p>
                    </Reveal>
                </Section>
            </div>

            {/* SHOP */}
            <div className="border-y border-border bg-[hsl(var(--surface))] py-24 md:py-32">
                <Section width="max-w-[90rem]">
                    <div className="flex flex-wrap items-end justify-between gap-6">
                        <SectionTitle eyebrow="The Shop" title="Carry the legacy with you" />
                        <Link to="/shop" className="text-[0.72rem] uppercase tracking-[0.24em] text-[hsl(var(--gold))]">
                            Browse the collection
                        </Link>
                    </div>
                    <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
                        {MERCH_PREVIEW.map((src, i) => <Reveal key={src} delay={i * 0.06}>
                                <Link to="/shop" className="group block overflow-hidden">
                                    <img src={src} alt="Pete Edochie Legacy archive image" className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                                </Link>
                            </Reveal>)}
                    </div>
                    <p className="mt-8 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                        Premium apparel, framed and limited-edition prints, and keepsakes drawn from six decades of storytelling — produced and shipped by King Dawie Publishing.
                    </p>
                </Section>
            </div>

            {/* MENTORSHIP */}
            <Section className="grid gap-14 py-24 md:grid-cols-[1.1fr_1fr] md:items-center md:py-32" width="max-w-[80rem]">
                <Reveal>
                    <img src={IMG.portraitArt} alt="Pete Edochie — mentorship and legacy" className="w-full object-cover object-[center_20%]" />
                </Reveal>
                <div>
                    <SectionTitle eyebrow="Mentorship" title="The African Youth Mentorship Initiative" lead={MENTORSHIP_BRIDGE.text} />
                    <div className="mt-10 grid grid-cols-2 gap-6 border-t border-border pt-8">
                        {[{
            v: 1200,
            s: '+',
            l: 'Applicants'
          }, {
            v: 5000,
            s: '',
            l: 'Places per cohort'
          }].map(s => <div key={s.l}>
                                <p className="font-display text-4xl text-[hsl(var(--gold))]">
                                    <CountUp value={s.v} suffix={s.s} />
                                </p>
                                <p className="mt-2 text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">{s.l}</p>
                            </div>)}
                    </div>
                    <div className="mt-9 flex flex-wrap items-center gap-4">
                        <Link to="/mentorship" className="inline-flex items-center gap-3 border-b border-[hsl(var(--gold))]/60 pb-2 text-[0.72rem] uppercase tracking-[0.24em] text-[hsl(var(--gold))]">
                            Apply to the programme <ArrowRight size={14} strokeWidth={1.6} />
                        </Link>
                        <PreOrderCta variant="gold" label="Pre-Order the book" />
                    </div>
                </div>
            </Section>

            {/* EVENTS */}
            <div className="border-y border-border bg-[hsl(var(--surface))] py-24 md:py-32">
                <Section width="max-w-[80rem]">
                    <div className="flex flex-wrap items-end justify-between gap-6">
                        <SectionTitle
                            eyebrow="Events"
                            title="Where to meet the legacy"
                            lead="Project Launch week — Accra. Lineup: Arrival, AMC, Gala, Meet and Greet, Lecture Series (African Youth Mentorship — 2027 Cohort). Book pre-order and event registration are separate actions."
                        />
                        <Link to="/events" className="text-[0.72rem] uppercase tracking-[0.24em] text-[hsl(var(--gold))]">
                            Event registration
                        </Link>
                    </div>
                    <div className="mt-12 space-y-px">
                        {events.length === 0 ? <p className="py-8 text-sm text-muted-foreground">Dates are being confirmed. Please check back shortly.</p> : events.map((e, i) => <Reveal key={e.id} delay={i * 0.06}>
                                    <Link to="/events" className="grid items-center gap-3 border-t border-border py-7 transition-colors hover:bg-white/[0.02] md:grid-cols-[10rem_1fr_14rem_2rem]">
                                        <span className="text-[0.7rem] uppercase tracking-[0.2em] text-[hsl(var(--gold))]">
                                            {e.starts ? new Date(e.starts).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                }) : 'TBC'}
                                        </span>
                                        <span className="font-display text-2xl md:text-3xl">{e.title}</span>
                                        <span className="text-sm text-muted-foreground">{e.city}</span>
                                        <ArrowRight size={16} strokeWidth={1.4} className="hidden justify-self-end text-muted-foreground md:block" />
                                    </Link>
                                </Reveal>)}
                    </div>
                </Section>
            </div>

            {/* GALLERY STRIP */}
            <Section className="py-24 md:py-32" width="max-w-[90rem]">
                <SectionTitle eyebrow="Gallery" title="From the archive" />
                <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {[...ARCHIVE_PREVIEW].map((src, i) => <Reveal key={src} delay={i * 0.06}>
                            <div className="group overflow-hidden">
                                <img src={src} alt="Archive photograph of Pete Edochie" className="aspect-[3/4] w-full object-cover grayscale transition-all duration-700 group-hover:scale-[1.03] group-hover:grayscale-0" />
                            </div>
                        </Reveal>)}
                </div>
                <Link to="/gallery" className="mt-10 inline-block text-[0.72rem] uppercase tracking-[0.24em] text-[hsl(var(--gold))]">
                    Enter the gallery
                </Link>
            </Section>

            {/* TESTIMONIALS + ENDORSEMENTS */}
            <div className="border-y border-border bg-[hsl(var(--surface))] py-24 md:py-32">
                <Section width="max-w-[80rem]">
                    <SectionTitle eyebrow="Social proof" title="Voices around the legacy" />
                    <div className="mt-12 grid gap-12 md:grid-cols-3">
                        {TESTIMONIALS.map((t, i) => <Reveal key={t.name} delay={i * 0.08}>
                                <figure>
                                    <span className="font-display text-5xl text-[hsl(var(--gold))]">“</span>
                                    <blockquote className="mt-3 font-display text-2xl leading-snug">{t.quote}</blockquote>
                                    <figcaption className="mt-6 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                                        {t.name} · {t.role}
                                    </figcaption>
                                </figure>
                            </Reveal>)}
                    </div>
                    <div className="mt-16 grid gap-8 border-t border-border pt-12 md:grid-cols-2">
                        {ENDORSEMENTS.map((e, i) => (
                            <Reveal key={e.name} delay={i * 0.06}>
                                <figure>
                                    <blockquote className="font-display text-xl leading-snug text-foreground/90">{e.quote}</blockquote>
                                    <figcaption className="mt-4 text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">
                                        {e.name} · {e.role}
                                    </figcaption>
                                </figure>
                            </Reveal>
                        ))}
                    </div>
                </Section>
            </div>

            {/* MEMBERSHIP */}
            <Section className="py-24 md:py-32" width="max-w-[80rem]">
                <SectionTitle eyebrow="Membership" title="Stand with the legacy" lead="Membership sustains the archive, the mentorship cohorts and the events programme. Three ways to participate." />
                <div className="mt-14 grid gap-px border border-border bg-border md:grid-cols-3">
                    {TIERS.map((t, i) => <Reveal key={t.name} delay={i * 0.07}>
                            <div className="flex h-full flex-col bg-background p-9">
                                <p className="font-display text-3xl">{t.name}</p>
                                <p className="mt-2 text-[0.7rem] uppercase tracking-[0.2em] text-[hsl(var(--gold))]">{t.price}</p>
                                <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
                                    {t.points.map(p => <li key={p} className="flex gap-3">
                                            <span className="mt-2 h-px w-4 shrink-0 bg-[hsl(var(--gold))]" />
                                            {p}
                                        </li>)}
                                </ul>
                                <Link to="/join" className="mt-10 border border-border py-4 text-center text-[0.68rem] uppercase tracking-[0.24em] transition-colors hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]">
                                    Join as {t.name}
                                </Link>
                            </div>
                        </Reveal>)}
                </div>
            </Section>

            {/* CTA */}
            <SubscribeSection />

            <section className="relative overflow-hidden border-t border-border">
                <img src={IMG.portraitArt} alt="Pete Edochie" className="h-[60vh] w-full object-cover object-[center_20%]" />
                <div className="img-veil absolute inset-0" />
                <div className="absolute inset-0 flex items-center justify-center text-center text-white">
                    <Section width="max-w-[56rem]">
                        <Reveal>
                            <h2 className="font-display text-4xl leading-tight md:text-6xl">
                                A legacy is only alive if it is <span className="italic text-[hsl(var(--gold))]">handed on</span>.
                            </h2>
                            <div className="mt-10 flex flex-wrap justify-center gap-4">
                                <Link to="/book" className="bg-[hsl(var(--primary))] px-9 py-4 text-[0.7rem] uppercase tracking-[0.24em] text-[hsl(var(--primary-foreground))] active:scale-[0.98]">
                                    Pre-Order Now
                                </Link>
                                <Link to="/events" className="border border-white/40 px-9 py-4 text-[0.7rem] uppercase tracking-[0.24em] text-white transition-colors hover:border-white hover:bg-white/10">
                                    Event Registration
                                </Link>
                                <Link to="/mentorship" className="border border-white/40 px-9 py-4 text-[0.7rem] uppercase tracking-[0.24em] text-white transition-colors hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]">
                                    Mentorship Sign Up
                                </Link>
                            </div>
                        </Reveal>
                    </Section>
                </div>
            </section>
        </div>;
};
export default HomePage;