import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarDays, Camera, Clock, Gift, Lock, Mail, MapPin, Mic, QrCode, Users } from 'lucide-react';
import Reveal from '@/components/Reveal';
import { PageHead, PageHero, Section, SectionTitle } from '@/components/Section';
import { IMG, OFFICIAL_EVENTS } from '@/lib/content';
import { verifyOrder } from '@/lib/commerce';
import { apiCrud } from '@/lib/api';
import EventParticipateDialog from '@/components/EventParticipateDialog';

const fmtDate = (iso) =>
    iso
        ? new Date(iso).toLocaleDateString('en-GB', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
          })
        : 'Date to be confirmed';

const fmtTime = (iso) =>
    iso
        ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : '';

const TYPE_META = {
    ghana_launch: { label: 'Ghana Activation', icon: Gift, badge: 'Open registration' },
    masterclass: { label: 'Session / Briefing', icon: Mic, badge: 'Open registration' },
    meet_and_greet: { label: 'Private Session', icon: Users, badge: 'Ticketed when published' },
};

const EventCard = ({ event, onParticipate }) => {
    const meta = TYPE_META[event.event_type] || TYPE_META.masterclass;
    const Icon = meta.icon;
    const tiers = Array.isArray(event.ticket_tiers) ? event.ticket_tiers : [];
    const badge = event.invitation_only ? 'By invitation only' : meta.badge;

    return (
        <Reveal>
            <article className="grid gap-8 border-t border-border py-12 md:grid-cols-[18rem_1fr]">
                <div className="relative">
                    <img src={event.image} alt="" className="hidden h-48 w-full object-cover md:block" />
                    <div className="mt-5 flex items-center gap-3 text-[hsl(var(--gold))]">
                        <Icon size={18} strokeWidth={1.4} />
                        <span className="text-[0.66rem] uppercase tracking-[0.22em]">{meta.label}</span>
                    </div>
                    <span className="mt-3 inline-block border border-[hsl(var(--gold))]/40 px-3 py-1 text-[0.58rem] uppercase tracking-[0.18em] text-[hsl(var(--gold))]">
                        {badge}
                    </span>
                </div>

                <div>
                    <h2 className="font-display text-3xl md:text-4xl">{event.title}</h2>
                    <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">{event.summary}</p>

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                        <Detail icon={CalendarDays} label="Date" value={fmtDate(event.starts)} />
                        <Detail icon={MapPin} label="Venue" value={`${event.venue} · ${event.city}`} />
                        <Detail
                            icon={Clock}
                            label="Time"
                            value={event.starts ? `${fmtTime(event.starts)}${event.ends ? ` – ${fmtTime(event.ends)}` : ''}` : 'TBC'}
                        />
                    </div>

                    {tiers.length ? (
                        <div className="mt-7 grid gap-px border border-border bg-border sm:grid-cols-2">
                            {tiers
                                .slice()
                                .sort((a, b) => b.price - a.price)
                                .map((t) => {
                                    const key = (t.tier || t.name || '').toLowerCase();
                                    const isVip = key === 'vip';
                                    const currency = (t.currency || '').toUpperCase() || 'USD';
                                    const label = (t.tier || t.name || '').toUpperCase();
                                    return (
                                        <div key={`${t.tier || t.name || t.key}-${t.price}`} className="bg-background p-6">
                                            <div className="flex items-center justify-between">
                                                <p className="font-display text-xl">{isVip ? 'VIP' : label || 'Standard'}</p>
                                                <p className="font-display text-xl text-[hsl(var(--gold))]">{currency} {t.price.toLocaleString()}</p>
                                            </div>
                                            <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                                                {isVip ? (
                                                    <>
                                                        <li className="flex gap-2"><Camera size={12} strokeWidth={1.6} className="mt-0.5 shrink-0 text-[hsl(var(--gold))]" /> One-on-one exclusive access to Peter Edochie</li>
                                                        <li className="flex gap-2"><Camera size={12} strokeWidth={1.6} className="mt-0.5 shrink-0 text-[hsl(var(--gold))]" /> Professional photographer on standby</li>
                                                        <li>Photos included · limited slots</li>
                                                    </>
                                                ) : (
                                                    <>
                                                        <li>General address and conversation by Peter Edochie</li>
                                                        <li>Group setting · more slots available</li>
                                                    </>
                                                )}
                                            </ul>
                                        </div>
                                    );
                                })}
                        </div>
                    ) : null}

                    <div className="mt-8 flex flex-wrap items-center gap-4">
                        {event.invitation_only ? (
                            <span className="flex items-center gap-2 border border-border px-6 py-4 text-[0.66rem] uppercase tracking-[0.22em] text-muted-foreground">
                                <Lock size={14} strokeWidth={1.4} /> Invitation only — no public registration
                            </span>
                        ) : event.event_type === 'meet_and_greet' && tiers.length > 0 ? (
                            <button
                                type="button"
                                onClick={() => onParticipate(event)}
                                className="bg-[hsl(var(--primary))] px-7 py-4 text-[0.66rem] uppercase tracking-[0.22em] text-[hsl(var(--primary-foreground))] transition-transform active:scale-[0.99]"
                            >
                                Buy ticket
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => onParticipate(event)}
                                className="border border-[hsl(var(--gold))]/60 px-7 py-4 text-[0.66rem] uppercase tracking-[0.22em] text-[hsl(var(--gold))] transition-colors hover:bg-[hsl(var(--gold))] hover:text-[hsl(var(--primary-foreground))]"
                            >
                                Register now
                            </button>
                        )}
                        <span className="flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">
                            <QrCode size={14} strokeWidth={1.4} /> QR pass issued
                        </span>
                    </div>
                </div>
            </article>
        </Reveal>
    );
};

const Detail = ({ icon: Icon, label, value }) => (
    <div className="border-t border-border pt-4">
        <p className="flex items-center gap-2 text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">
            <Icon size={12} strokeWidth={1.6} /> {label}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">{value}</p>
    </div>
);

const EventsPage = () => {
    const [events, setEvents] = useState([]);
    const [status, setStatus] = useState('loading');
    const [active, setActive] = useState(null);
    const [paidTicket, setPaidTicket] = useState(null);
    const [params, setParams] = useSearchParams();

    useEffect(() => {
        apiCrud
            .list('events', { sort: 'starts' })
            .then((items) => {
                const stale =
                    /Cumberland|Eko Hotel|Journey Continues|Writing With Purpose|Intimate Evening/i;
                const cleaned = (items || []).filter((e) => !stale.test(e.title || ''));
                const hasLaunch = cleaned.some((e) => e.event_type === 'ghana_launch');
                setEvents(hasLaunch ? cleaned : OFFICIAL_EVENTS);
                setStatus('ready');
            })
            .catch(() => {
                setEvents(OFFICIAL_EVENTS);
                setStatus('ready');
            });
    }, []);

    const ordered = useMemo(() => {
        const rank = { ghana_launch: 0, masterclass: 1, meet_and_greet: 2 };
        return events.slice().sort((a, b) => (rank[a.event_type] ?? 9) - (rank[b.event_type] ?? 9));
    }, [events]);

    useEffect(() => {
        if (status !== 'ready' || !events.length) return;
        const joinId = params.get('join');
        if (!joinId) return;
        const target = events.find((e) => e.id === joinId);
        if (target && !target.invitation_only) setActive(target);
    }, [status, events, params]);

    // Handle the Paystack redirect back after a Meet & Greet ticket payment:
    // /events?ticket=REFERENCE — verify the payment, load the ticket + event,
    // and open the dialog in the confirmation state.
    useEffect(() => {
        const ticketRef = params.get('ticket');
        if (!ticketRef) return;
        let active = true;
        (async () => {
            try {
                await verifyOrder(ticketRef);
            } catch (_) {
                /* still try to load the ticket record */
            }
            try {
                const tickets = await apiCrud.list('meet-and-greet-tickets', {
                    filter: `payment_reference = "${ticketRef}"`,
                });
                const ticket = tickets?.[0];
                if (!ticket) return;
                const ev = await apiCrud.getOne('events', ticket.event_id);
                if (!active) return;
                setPaidTicket({ ...ticket, kind: 'ticket' });
                setActive(ev);
            } catch (_) {
                /* ticket not found — silently ignore */
            }
        })();
        return () => {
            active = false;
        };
    }, [params]);

    const closeDialog = () => {
        setActive(null);
        setPaidTicket(null);
        if (params.get('ticket') || params.get('join')) {
            params.delete('ticket');
            params.delete('join');
            setParams(params, { replace: true });
        }
    };

    return (
        <div>
            <PageHead
                title="Events & Ghana Activation | The Peter Edochie Legacy"
                description="The Legacy Experience — Ghana Activation on 20 September 2026 in Accra, the official reveal media briefing, and the African Youth Mentorship Initiative."
            />
            <PageHero
                eyebrow="Events"
                title="Where to meet the legacy"
                lead="The Legacy Experience peaks in Accra on 20 September 2026. Register for the Ghana activation, note invitation-only media and private sessions, and apply separately to the mentorship programme."
                image={IMG.theatre}
            />

            <Section className="py-20 md:py-28" width="max-w-[84rem]">
                {status === 'loading' ? (
                    <div className="space-y-4">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="h-40 w-full animate-pulse bg-white/[0.04]" />
                        ))}
                    </div>
                ) : status === 'error' ? (
                    <p className="py-16 text-sm text-muted-foreground">We could not load the calendar. Please refresh the page.</p>
                ) : ordered.length === 0 ? (
                    <p className="py-16 text-sm text-muted-foreground">Dates for the next season are being confirmed.</p>
                ) : (
                    <div>{ordered.map((e) => <EventCard key={e.id} event={e} onParticipate={setActive} />)}</div>
                )}
            </Section>

            {/* MENTORSHIP INITIATIVE */}
            <div className="border-y border-border bg-[hsl(var(--surface))] py-24 md:py-32">
                <Section className="grid gap-14 md:grid-cols-[1.1fr_1fr] md:items-center" width="max-w-[84rem]">
                    <Reveal>
                        <img src={IMG.youth} alt="Young African storytellers in a mentorship workshop" className="w-full object-cover" />
                    </Reveal>
                    <div>
                        <SectionTitle
                            eyebrow="Mentorship Initiative"
                            title="African Youth Mentorship — 2027 cohort"
                            lead="A structured six-month programme for young storytellers across the continent. Applications are read personally by the programme team — this is an application, not a registration."
                        />
                        <div className="mt-8 grid gap-4 sm:grid-cols-3">
                            <Detail icon={Users} label="Places" value="200 per cohort" />
                            <Detail icon={MapPin} label="Countries" value="12 across Africa" />
                            <Detail icon={CalendarDays} label="Cohort" value="2027 intake open" />
                        </div>
                        <Link
                            to="/mentorship"
                            className="mt-9 inline-flex items-center gap-3 bg-[hsl(var(--primary))] px-8 py-4 text-[0.7rem] uppercase tracking-[0.24em] text-[hsl(var(--primary-foreground))] active:scale-[0.98]"
                        >
                            Apply to the programme
                        </Link>
                        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail size={13} strokeWidth={1.6} /> Mentorship runs independently of the Ghana Launch event.
                        </p>
                    </div>
                </Section>
            </div>

            {/* HOW IT WORKS */}
            <Section className="py-20 md:py-28" width="max-w-[80rem]">
                <SectionTitle eyebrow="How it works" title="Register or wait for an invitation" lead="The master plan separates book pre-order from event attendance. Every confirmed place carries a QR pass in your dashboard." />
                <div className="mt-12 grid gap-10 md:grid-cols-3">
                    {[
                        ['01', 'Ghana Activation', 'The Legacy Experience on 20 September 2026 is open for registration. Sign in, register, and receive your QR pass.'],
                        ['02', 'Invitation', 'The media briefing and private author sessions are invitation only — confirmed guests receive their pass directly.'],
                        ['03', 'Mentorship', 'The African Youth Mentorship Initiative runs on its own application track — not as an event ticket.'],
                    ].map(([n, t, d]) => (
                        <Reveal key={n}>
                            <div className="border-t border-border pt-6">
                                <p className="font-display text-3xl text-[hsl(var(--gold))]">{n}</p>
                                <p className="mt-3 font-display text-2xl">{t}</p>
                                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{d}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </Section>

            <EventParticipateDialog event={active} open={!!active} onClose={closeDialog} paidTicket={paidTicket} />
        </div>
    );
};

export default EventsPage;
