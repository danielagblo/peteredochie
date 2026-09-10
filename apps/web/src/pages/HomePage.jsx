import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
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
  IMG,
  LEGACY,
  LEGACY_QUOTES,
  MENTORSHIP_BRIDGE,
  MERCH_PREVIEW,
  ARCHIVE_PREVIEW,
  MILESTONES,
  OFFICIAL_EVENTS,
  PROJECT,
  QUOTE_HANDLE,
  TIERS,
} from '@/lib/content';
import { apiCrud } from '@/lib/api';

const EVENT_IMAGE_FALLBACK = {
  arrival: IMG.cover,
  amc: IMG.portraitArt,
  ghana_launch: IMG.portrait,
  meet_and_greet: IMG.portraitExtra,
  lecture_series: IMG.portraitBw,
};

const eventImage = (e) => {
  if (e.image) return e.image;
  if (EVENT_IMAGE_FALLBACK[e.event_type]) return EVENT_IMAGE_FALLBACK[e.event_type];
  const title = e.title || '';
  if (/^Arrival/i.test(title)) return IMG.cover;
  if (/^AMC/i.test(title)) return IMG.portraitArt;
  if (/^Gala/i.test(title)) return IMG.portrait;
  if (/Meet and Greet/i.test(title)) return IMG.portraitExtra;
  if (/Lecture Series/i.test(title)) return IMG.portraitBw;
  return IMG.cover;
};

const HERO_SLIDES = [
  { src: IMG.cover, position: 'object-[center_28%]' },
  { src: IMG.portrait, position: 'object-[center_18%]' },
  { src: IMG.portraitArt, position: 'object-[center_20%]' },
  { src: IMG.portraitBw, position: 'object-[center_25%]' },
  { src: IMG.portraitExtra, position: 'object-[center_28%]' },
];

const HomePage = () => {
  const [events, setEvents] = useState([]);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    apiCrud.list('events', { sort: 'starts', page: 1, perPage: 5 }).then((items) => {
      const stale =
        /Cumberland|Eko Hotel|Journey Continues|Writing With Purpose|Intimate Evening|Press Conference|Private Legacy Session|Project Launch, Ghana/i;
      const cleaned = (items || []).filter((e) => !stale.test(e.title || ''));
      const lineupTitles = /^(Arrival|AMC|Gala|Meet and Greet|Lecture Series)/i;
      const lineup = cleaned.filter((e) => lineupTitles.test(e.title || ''));
      setEvents((lineup.length >= 3 ? lineup : OFFICIAL_EVENTS).slice(0, 5));
    }).catch(() => setEvents(OFFICIAL_EVENTS.slice(0, 5)));
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlide((i) => (i + 1) % HERO_SLIDES.length);
    }, 6500);
    return () => window.clearInterval(id);
  }, []);

  const goPrev = () => setSlide((i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  const goNext = () => setSlide((i) => (i + 1) % HERO_SLIDES.length);

  return <div>
            <PageHead title="Pete Edochie, Actor | The Official Legacy Platform | King Dawie Publishing" description="The official digital home of Pete Edochie, the Nigerian actor: biography, screen archive, autobiography, events, Meet & Greet, and the African Youth Mentorship Initiative. Published by King Dawie Publishing." />
            <Seo title="Pete Edochie, Actor | The Official Legacy Platform" description="The screen archive, autobiography, events and mentorship of Pete Edochie, Nigerian actor and elder statesman of African cinema. Published by King Dawie Publishing." image={IMG.cover} siteName="The Pete Edochie Legacy | King Dawie Publishing" />

            {/* HERO, Hilces-style full-bleed slideshow + left copy */}
            <section className="relative flex h-[100svh] items-center overflow-hidden bg-[#7A0C19]">
                <div className="absolute inset-0">
                    {HERO_SLIDES.map((item, i) => (
                        <motion.img
                            key={item.src}
                            src={item.src}
                            alt=""
                            aria-hidden={i !== slide}
                            initial={false}
                            animate={{ opacity: i === slide ? 1 : 0, scale: i === slide ? 1 : 1.05 }}
                            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                            className={`absolute inset-0 h-full w-full object-cover ${item.position}`}
                        />
                    ))}
                    <div className="absolute inset-0 hidden bg-gradient-to-r from-[#7A0C19]/55 via-[#7A0C19]/25 to-black/10 md:block" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#7A0C19]/45 via-[#7A0C19]/20 to-[#7A0C19]/50 md:hidden" />
                </div>

                <div className="relative z-10 mx-auto w-full max-w-7xl -translate-y-4 px-4 pt-20 sm:px-6 md:-translate-y-8 md:px-10 md:pt-24 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                        className="max-w-3xl"
                    >
                        <h1 className="mb-3 font-hero text-[2.15rem] font-medium leading-[1.05] tracking-tight text-white sm:mb-4 sm:text-5xl md:mb-5 md:text-7xl lg:text-8xl">
                            A voice that taught
                            <br />
                            <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text pr-2 italic text-transparent">
                                a continent
                            </span>
                        </h1>

                        <p className="mb-4 max-w-xl border-l-[3px] border-white pl-4 text-base font-medium leading-snug text-white/90 sm:mb-5 sm:pl-5 sm:text-lg sm:leading-relaxed md:mb-6 md:border-l-4 md:pl-6 md:text-xl">
                            {PROJECT.whyItMatters}
                        </p>

                        <div className="flex flex-row items-stretch gap-2 sm:gap-3 md:gap-4">
                            <Link
                                to="/book"
                                className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full bg-white px-3 py-3 text-[0.72rem] font-bold leading-none text-[#7A0C19] shadow-[0_0_30px_rgba(255,255,255,0.18)] transition-all hover:scale-[1.02] hover:bg-white/90 sm:flex-none sm:gap-2 sm:px-7 sm:py-3.5 sm:text-sm md:gap-3 md:px-10 md:py-4 md:text-base"
                            >
                                Pre-Order Now
                                <ChevronRight className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" strokeWidth={3} />
                            </Link>
                            <Link
                                to="/peter-edochie"
                                className="inline-flex min-w-0 flex-1 items-center justify-center rounded-full border border-white/20 bg-white/10 px-3 py-3 text-[0.72rem] font-bold leading-none text-white backdrop-blur-md transition-all hover:bg-white/20 sm:flex-none sm:px-7 sm:py-3.5 sm:text-sm md:px-10 md:py-4 md:text-base"
                            >
                                Discover Our Story
                            </Link>
                        </div>
                    </motion.div>
                </div>

                <div className="absolute bottom-5 right-3 z-20 flex flex-row items-center gap-3 md:bottom-10 md:right-10 md:gap-6">
                    <div className="flex gap-2 md:gap-3">
                        {HERO_SLIDES.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                aria-label={`Show portrait ${i + 1}`}
                                onClick={() => setSlide(i)}
                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                    i === slide ? 'w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.45)] md:w-12' : 'w-3 bg-white/40 hover:bg-white/60 md:w-4'
                                }`}
                            />
                        ))}
                    </div>
                    <div className="flex gap-1 rounded-full border border-white/10 bg-black/30 p-1.5 backdrop-blur-md md:gap-2 md:p-2">
                        <button
                            type="button"
                            aria-label="Previous portrait"
                            onClick={goPrev}
                            className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white hover:text-[#7A0C19] md:h-12 md:w-12"
                        >
                            <ChevronLeft size={22} />
                        </button>
                        <button
                            type="button"
                            aria-label="Next portrait"
                            onClick={goNext}
                            className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white hover:text-[#7A0C19] md:h-12 md:w-12"
                        >
                            <ChevronRight size={22} />
                        </button>
                    </div>
                </div>
            </section>

            <LaunchCountdown />

            {/* MARQUEE, rolling catalogue */}
            <div className="overflow-hidden border-y border-border bg-[hsl(var(--surface))] py-5">
                <div className="flex w-max animate-[marquee_38s_linear_infinite] gap-14 whitespace-nowrap">
                    {[0, 1].map(k => <div key={k} className="flex gap-14">
                            {['Things Fall Apart', 'Over 200 screen roles', 'Member of the Order of the Federal Republic of Nigeria'].map(t => <span key={t} className="flex items-center gap-14 font-display text-lg text-muted-foreground">
                                        {t}
                                        <span className="text-[hsl(var(--gold))]">◆</span>
                                    </span>)}
                        </div>)}
                </div>
                <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
            </div>

            {/* SUPPORTERS, after catalogue */}
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
                        <img src={IMG.portrait} alt="Portrait of Pete Edochie in traditional attire" className="aspect-[3/4] w-full object-cover object-[center_18%]" />
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
                            Long before the cameras, there was the voice, trained in broadcasting, tempered by the
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
                        Premium apparel, framed and limited-edition prints, and keepsakes drawn from six decades of storytelling, produced and shipped by King Dawie Publishing.
                    </p>
                </Section>
            </div>

            {/* MENTORSHIP */}
            <Section className="grid gap-14 py-24 md:grid-cols-[1.1fr_1fr] md:items-center md:py-32" width="max-w-[80rem]">
                <Reveal>
                    <img src={IMG.portraitArt} alt="Pete Edochie, mentorship and legacy" className="w-full object-cover object-[center_22%]" />
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
                            lead="Project Launch week in Accra. Lineup: Arrival, AMC, Gala, Meet and Greet, Lecture Series (African Youth Mentorship 2027 Cohort). Book pre-order and event registration are separate actions."
                        />
                        <Link to="/events" className="text-[0.72rem] uppercase tracking-[0.24em] text-[hsl(var(--gold))]">
                            Event registration
                        </Link>
                    </div>
                    <div className="mt-12 space-y-4">
                        {events.length === 0 ? <p className="py-8 text-sm text-muted-foreground">Dates are being confirmed. Please check back shortly.</p> : events.map((e, i) => <Reveal key={e.id} delay={i * 0.06}>
                                    <Link to="/events" className="group grid items-center gap-4 border border-border bg-background p-3 transition-colors hover:border-[hsl(var(--gold))]/50 md:grid-cols-[9rem_1fr_12rem_2rem] md:gap-6 md:p-4">
                                        <img
                                            src={eventImage(e)}
                                            alt=""
                                            className="aspect-[4/3] w-full object-cover object-[center_22%]"
                                        />
                                        <div className="min-w-0 px-1">
                                            <span className="text-[0.65rem] uppercase tracking-[0.2em] text-[hsl(var(--gold))]">
                                                {e.starts ? new Date(e.starts).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                }) : 'TBC'}
                                            </span>
                                            <span className="mt-1 block font-display text-2xl md:text-3xl">{e.title}</span>
                                        </div>
                                        <span className="px-1 text-sm text-muted-foreground">{e.city}</span>
                                        <ArrowRight size={16} strokeWidth={1.4} className="hidden justify-self-end text-muted-foreground transition-transform group-hover:translate-x-0.5 md:block" />
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

            {/* LEGACY QUOTES — gallery-style grid */}
            <Section className="border-y border-border bg-white py-24 md:py-32" width="max-w-[90rem]">
                <SectionTitle eyebrow="Quotes" title="Words that carry forward" />
                <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {LEGACY_QUOTES.map((item, i) => (
                        <Reveal key={item.quote} delay={i * 0.05}>
                            <figure className="flex h-full flex-col border border-border bg-white p-6 md:p-7">
                                <blockquote className="flex-1 text-[1.05rem] font-medium leading-snug text-[#0A0A0A] md:text-lg">
                                    “{item.quote}”
                                </blockquote>
                                <figcaption className="mt-6 text-[0.62rem] uppercase tracking-[0.2em] text-[#7A0C19]">
                                    {QUOTE_HANDLE}
                                </figcaption>
                            </figure>
                        </Reveal>
                    ))}
                </div>
            </Section>

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
                <img src={IMG.portraitBw} alt="Pete Edochie" className="h-[60vh] w-full object-cover object-[center_25%]" />
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