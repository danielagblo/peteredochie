import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays } from 'lucide-react';
import Reveal from '@/components/Reveal';
import CountUp from '@/components/CountUp';
import Seo from '@/components/Seo';
import { PageHead, Section, SectionTitle } from '@/components/Section';
import SubscribeSection from '@/components/SubscribeSection';
import { IMG, MILESTONES, SPONSORS, TESTIMONIALS, TIERS } from '@/lib/content';
import pb from '@/lib/pocketbaseClient';
const HomePage = () => {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    pb.collection('events').getList(1, 3, {
      sort: 'starts'
    }).then(res => setEvents(res.items)).catch(() => setEvents([]));
  }, []);
  return <div>
            <PageHead title="Pete Edochie — The Official Legacy Platform | King Dawie Publishing" description="The official digital home of Pete Edochie, published by King Dawie Publishing: biography, legacy archive, autobiography, events, Meet & Greet, and the African Youth Mentorship Initiative." />
            <Seo title="Pete Edochie — The Official Legacy Platform | King Dawie Publishing" description="Archive, autobiography, events and mentorship from one of Africa's most respected storytellers. Published by King Dawie Publishing." image={IMG.stage} siteName="The Pete Edochie Legacy — King Dawie Publishing" />

            {/* HERO */}
            <section className="relative flex min-h-[100dvh] items-end overflow-hidden">
                <motion.img src={IMG.stage} alt="Pete Edochie standing under a single spotlight on an empty theatre stage" initial={{
        scale: 1.08,
        opacity: 0
      }} animate={{
        scale: 1,
        opacity: 1
      }} transition={{
        duration: 2.4,
        ease: [0.22, 1, 0.36, 1]
      }} className="absolute inset-0 h-full w-full object-cover [filter:brightness(0.7)]" />
                <div className="img-veil absolute inset-0" />
                <div className="relative mx-auto w-full max-w-[90rem] px-5 pb-20 md:px-10 md:pb-28">
                    <motion.p initial={{
          opacity: 0,
          y: 12
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.5,
          duration: 0.9
        }} className="eyebrow">CHIEF PETE EDOCHIE LEGACY PROJECT</motion.p>
                    <h1 className="mt-6 max-w-4xl font-display text-6xl leading-[0.9] tracking-tight md:text-[7.5rem] text-white">
                        {['A voice', 'that taught', 'a continent'].map((line, i) => <span key={line} className="block overflow-hidden">
                                <motion.span className="block" initial={{
              y: '110%'
            }} animate={{
              y: 0
            }} transition={{
              delay: 0.65 + i * 0.14,
              duration: 1.1,
              ease: [0.22, 1, 0.36, 1]
            }}>
                                    {i === 2 ? <>
                                            a <span className="italic text-[hsl(var(--gold))]">continent</span>
                                        </> : line}
                                </motion.span>
                            </span>)}
                    </h1>
                    <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 1.3,
          duration: 1
        }} className="mt-9 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <p className="max-w-md text-sm leading-relaxed text-stone-300 md:text-base">
                            Actor. Elder. Custodian of Igbo proverb and African memory. Six decades of work, gathered
                            into one archive — and given forward to the next generation.
                        </p>
                        <div className="flex flex-wrap items-center gap-4">
                            <Link to="/pete-edochie" className="group flex items-center gap-3 bg-[hsl(var(--primary))] px-8 py-4 text-[0.7rem] uppercase tracking-[0.24em] text-white transition-transform active:scale-[0.98]">
                                Enter the story
                                <ArrowRight size={15} strokeWidth={1.6} className="transition-transform group-hover:translate-x-1" />
                            </Link>
                            <Link to="/events" className="flex items-center gap-3 border border-border px-8 py-4 text-[0.7rem] uppercase tracking-[0.24em] text-foreground transition-colors hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]">
                                <CalendarDays size={14} strokeWidth={1.6} /> View events
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* MARQUEE */}
            <div className="overflow-hidden border-y border-border bg-[hsl(var(--surface))] py-5">
                <div className="flex w-max animate-[marquee_38s_linear_infinite] gap-14 whitespace-nowrap">
                    {[0, 1].map(k => <div key={k} className="flex gap-14">
                            {['Things Fall Apart', 'Over 200 screen roles', 'Member of the Order of the Federal Republic', 'The Autobiography — 2026', 'African Youth Mentorship Initiative', 'Meet & Greet with Pete Edochie'].map(t => <span key={t} className="flex items-center gap-14 font-display text-lg text-muted-foreground">
                                        {t}
                                        <span className="text-[hsl(var(--gold))]">◆</span>
                                    </span>)}
                        </div>)}
                </div>
                <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
            </div>

            {/* STORY */}
            <Section className="grid gap-14 py-24 md:grid-cols-[1fr_1.1fr] md:items-center md:py-32" width="max-w-[80rem]">
                <Reveal>
                    <div className="relative">
                        <img src={IMG.portrait} alt="Portrait of Pete Edochie" className="w-full object-cover" />
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
                        <Link to="/pete-edochie" className="mt-9 inline-flex items-center gap-3 border-b border-[hsl(var(--gold))]/60 pb-2 text-[0.72rem] uppercase tracking-[0.24em] text-[hsl(var(--gold))]">
                            Read the full biography <ArrowRight size={14} strokeWidth={1.6} />
                        </Link>
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
                    <SectionTitle eyebrow="The Autobiography" title={<>The life, told in his own cadence</>} lead="Three years of recorded conversation, edited into a single volume: childhood in Enugu, the broadcasting years, the making of Okonkwo, family, faith, and the discipline of a public life." />
                    <Reveal delay={0.1}>
                        <div className="mt-9 flex flex-wrap gap-4">
                            <Link to="/book" className="bg-[hsl(var(--primary))] px-8 py-4 text-[0.7rem] uppercase tracking-[0.24em] text-white active:scale-[0.98]">
                                Reserve your copy
                            </Link>
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
                        {['https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80'].map((src, i) => <Reveal key={src} delay={i * 0.06}>
                                <Link to="/shop" className="group block overflow-hidden">
                                    <img src={src} alt="Official Pete Edochie Legacy merchandise" className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
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
                    <img src={IMG.youth} alt="Young African storytellers in a mentorship workshop" className="w-full object-cover" />
                </Reveal>
                <div>
                    <SectionTitle eyebrow="Mentorship" title="The African Youth Mentorship Initiative" lead="A structured programme for young storytellers across the continent — craft, discipline, cultural memory and the business of a creative life." />
                    <div className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-8">
                        {[{
            v: 1200,
            s: '+',
            l: 'Applicants'
          }, {
            v: 12,
            s: '',
            l: 'Countries'
          }, {
            v: 200,
            s: '',
            l: 'Places per cohort'
          }].map(s => <div key={s.l}>
                                <p className="font-display text-4xl text-[hsl(var(--gold))]">
                                    <CountUp value={s.v} suffix={s.s} />
                                </p>
                                <p className="mt-2 text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">{s.l}</p>
                            </div>)}
                    </div>
                    <Link to="/mentorship" className="mt-9 inline-flex items-center gap-3 border-b border-[hsl(var(--gold))]/60 pb-2 text-[0.72rem] uppercase tracking-[0.24em] text-[hsl(var(--gold))]">
                        Apply to the programme <ArrowRight size={14} strokeWidth={1.6} />
                    </Link>
                </div>
            </Section>

            {/* EVENTS */}
            <div className="border-y border-border bg-[hsl(var(--surface))] py-24 md:py-32">
                <Section width="max-w-[80rem]">
                    <div className="flex flex-wrap items-end justify-between gap-6">
                        <SectionTitle eyebrow="Events" title="Where to meet the legacy" />
                        <Link to="/events" className="text-[0.72rem] uppercase tracking-[0.24em] text-[hsl(var(--gold))]">
                            All dates & tickets
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
                    {[IMG.award, IMG.family, IMG.podium, IMG.artifact].map((src, i) => <Reveal key={src} delay={i * 0.06}>
                            <div className="group overflow-hidden">
                                <img src={src} alt="Archive photograph from the Pete Edochie collection" className="aspect-[3/4] w-full object-cover grayscale transition-all duration-700 group-hover:scale-[1.03] group-hover:grayscale-0" />
                            </div>
                        </Reveal>)}
                </div>
                <Link to="/gallery" className="mt-10 inline-block text-[0.72rem] uppercase tracking-[0.24em] text-[hsl(var(--gold))]">
                    Enter the gallery
                </Link>
            </Section>

            {/* TESTIMONIALS */}
            <div className="border-y border-border bg-[hsl(var(--surface))] py-24 md:py-32">
                <Section width="max-w-[72rem]">
                    <div className="grid gap-12 md:grid-cols-3">
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

            {/* SPONSORS */}
            <div className="border-t border-border py-16">
                <Section width="max-w-[80rem]">
                    <p className="eyebrow">Supported by</p>
                    <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-6">
                        {SPONSORS.map(s => <span key={s} className="font-display text-lg text-muted-foreground">{s}</span>)}
                    </div>
                </Section>
            </div>

            {/* CTA */}
            <SubscribeSection />

            <section className="relative overflow-hidden border-t border-border">
                <img src={IMG.theatre} alt="" className="h-[60vh] w-full object-cover opacity-40" />
                <div className="absolute inset-0 flex items-center justify-center text-center">
                    <Section width="max-w-[56rem]">
                        <Reveal>
                            <h2 className="font-display text-4xl leading-tight md:text-6xl">
                                A legacy is only alive if it is <span className="italic text-[hsl(var(--gold))]">handed on</span>.
                            </h2>
                            <div className="mt-10 flex flex-wrap justify-center gap-4">
                                <Link to="/join" className="bg-[hsl(var(--primary))] px-9 py-4 text-[0.7rem] uppercase tracking-[0.24em] text-white active:scale-[0.98]">
                                    Create your account
                                </Link>
                                <Link to="/contact" className="border border-border px-9 py-4 text-[0.7rem] uppercase tracking-[0.24em] transition-colors hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]">
                                    Partner with us
                                </Link>
                            </div>
                        </Reveal>
                    </Section>
                </div>
            </section>
        </div>;
};
export default HomePage;