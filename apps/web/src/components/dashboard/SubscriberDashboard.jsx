import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Bell, BookOpen, CalendarDays, Camera, Check, Clock, Download, ExternalLink, Gauge, GraduationCap, Mail, QrCode, Settings, Ticket, Users, X } from 'lucide-react';
import DashboardShell, { EmptyState, Panel, Stat } from '@/components/dashboard/DashboardShell';
import { INTEREST_OPTIONS } from '@/lib/accounts';
import { formatUSD } from '@/lib/commerce';
import { useAuth } from '@/contexts/AuthContext';
import { effectiveRegistrationType, registrationTypeLabel } from '@/lib/mentorship';
import { apiCrud } from '@/lib/api';
import { fileUrl } from '@/lib/files';

const NAV = [
    { key: 'overview', label: 'Overview', icon: Gauge },
    { key: 'events', label: 'Events', icon: CalendarDays },
    { key: 'tickets', label: 'Meet & Greet', icon: Ticket },
    { key: 'registrations', label: 'MasterClass', icon: GraduationCap },
    { key: 'mentorship', label: 'Mentorship', icon: Users },
    { key: 'orders', label: 'Book orders', icon: BookOpen },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'profile', label: 'Profile', icon: Settings },
];

const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' }) : 'TBC';
const fmtTime = (iso) => (iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '');

const TYPE_LABEL = {
    ghana_launch: 'Ghana Activation',
    masterclass: 'Session',
    meet_and_greet: 'Private Session',
};

const STATUS_META = {
    pending: { label: 'Under review', icon: Clock, tone: 'text-[hsl(var(--gold))]' },
    accepted: { label: 'Accepted', icon: Check, tone: 'text-[hsl(var(--gold))]' },
    rejected: { label: 'Not accepted', icon: X, tone: 'text-[hsl(var(--primary))]' },
};

const QrPass = ({ data, size = 120 }) => (
    <div className="rounded bg-white p-2.5" style={{ width: size + 20 }}>
        <QRCodeSVG value={data} size={size} />
    </div>
);

const SubscriberDashboard = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [mentorship, setMentorship] = useState(null);
    const [materials, setMaterials] = useState([]);
    const [materialsLoading, setMaterialsLoading] = useState(false);
    const [orders, setOrders] = useState([]);
    const [orderItems, setOrderItems] = useState({});
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState({ name: user?.name || '', country: user?.country || '', phone: user?.phone || '' });
    const [interests, setInterests] = useState(Array.isArray(user?.interests) ? user.interests : []);
    const [saved, setSaved] = useState('');

    useEffect(() => {
        const ownerId = user?.id;
        if (!ownerId) return;
        Promise.all([
            apiCrud.list('events', { sort: 'starts' }),
            apiCrud.list('meet-and-greet-tickets', { filter: `owner = "${ownerId}"`, sort: '-created' }).catch(() => []),
            apiCrud.list('event-registrations', { filter: `owner = "${ownerId}"`, sort: '-created' }).catch(() => []),
            apiCrud.list('mentorship-applications', { filter: `owner = "${ownerId}"`, sort: '-created' }).catch(() => []),
            apiCrud.list('orders', { filter: `owner = "${ownerId}"`, sort: '-created' }).catch(() => []),
        ])
            .then(([e, t, r, m, o]) => {
                setEvents(e);
                setTickets(t);
                setRegistrations(r);
                setMentorship(m[0] || null);
                setOrders(o);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [user]);

    // Load line items for each order.
    useEffect(() => {
        if (orders.length === 0) return;
        let active = true;
        Promise.all(
            orders.map((ord) =>
                apiCrud.list('order-items', { filter: `order = "${ord.id}"` }).then((its) => [ord.id, its]).catch(() => [ord.id, []]),
            ),
        ).then((pairs) => { if (active) setOrderItems(Object.fromEntries(pairs)); });
        return () => { active = false; };
    }, [orders]);

    useEffect(() => {
        if (mentorship?.status !== 'accepted') {
            setMaterials([]);
            return;
        }
        let active = true;
        setMaterialsLoading(true);
        apiCrud
            .list('mentorship-materials', { sort: 'sort,title' })
            .then((items) => { if (active) setMaterials(items); })
            .catch(() => { if (active) setMaterials([]); })
            .finally(() => { if (active) setMaterialsLoading(false); });
        return () => { active = false; };
    }, [mentorship?.status, mentorship?.registration_type, mentorship?.requested_type]);

    const saveProfile = async (e) => {
        e.preventDefault();
        try {
            await apiCrud.update('users', user.id, { ...profile, interests });
            setSaved('Saved.');
        } catch (_) {
            setSaved('We could not save your changes.');
        }
    };

    const toggle = (opt) =>
        setInterests((prev) => (prev.includes(opt) ? prev.filter((i) => i !== opt) : [...prev, opt]));

    const downloadInvoice = (order) => {
        const items = orderItems[order.id] || [];
        const lines = items.map((it) => `${it.product_name} x${it.quantity} — USD ${Number(it.total_price || 0).toFixed(2)}`).join('\n');
        const addr = order.shipping_address || {};
        const body = `KING DAWIE PUBLISHING\nOrder ${order.payment_reference || order.id}\nDate: ${fmtDate(order.created)}\n\n${lines}\n\nTotal: USD ${Number(order.total_price || 0).toFixed(2)}\nPayment: ${order.payment_status}\nStatus: ${order.order_status}\n${addr.address_line ? `\nShip to:\n${addr.full_name || ''}\n${addr.address_line}\n${addr.city} ${addr.region || ''} ${addr.country}` : ''}${order.tracking_number ? `\nTracking: ${order.tracking_number}` : ''}${order.estimated_delivery ? `\nEst. delivery: ${fmtDate(order.estimated_delivery)}` : ''}\n`;
        const blob = new Blob([body], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${order.payment_reference || order.id}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const ghanaLaunch = events.find((e) => e.event_type === 'ghana_launch');
    const masterclassEvents = events.filter((e) => e.event_type === 'masterclass');
    const meetGreetEvents = events.filter((e) => e.event_type === 'meet_and_greet');

    const registeredEventIds = new Set(registrations.map((r) => r.event));
    const ticketEventIds = new Set(tickets.map((t) => t.event));

    const mentorMeta = mentorship ? STATUS_META[mentorship.status || 'pending'] : null;
    const mentorAccessType = effectiveRegistrationType(mentorship);
    const materialUrl = (item) => {
        if (item.file) return fileUrl(item.file);
        return item.url || item.video_url || '';
    };

    const nav = NAV.filter((n) => {
        if (n.key === 'tickets') return tickets.length > 0;
        if (n.key === 'registrations') return registrations.length > 0;
        if (n.key === 'mentorship') return !!mentorship;
        if (n.key === 'orders') return orders.length > 0;
        return true;
    });

    return (
        <DashboardShell
            title="Subscriber dashboard | The Peter Edochie Legacy"
            description="Your Meet & Greet tickets, MasterClass registrations, mentorship application, book orders, notifications and newsletter preferences on the Peter Edochie Legacy platform."
            nav={nav}
        >
            {(tab) => (
                <>
                    {tab === 'overview' ? (
                        <>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <Stat label="Meet & Greet tickets" value={tickets.length} hint="VIP & Standard" />
                                <Stat label="MasterClass registrations" value={registrations.length} hint="Confirmed passes" />
                                <Stat label="Mentorship status" value={mentorship ? STATUS_META[mentorship.status || 'pending'].label : 'None'} hint={mentorship ? `${mentorship.cohort || '2027'} cohort` : 'Not applied'} />
                                <Stat label="Upcoming events" value={events.length} hint="Across the programme" />
                            </div>
                            <div className="mt-6">
                                <Panel title="Upcoming events" lead="Your standing across The Legacy Experience, media briefings and private sessions.">
                                    {loading ? (
                                        <EmptyState>Loading events…</EmptyState>
                                    ) : (
                                        <ul className="divide-y divide-border">
                                            {ghanaLaunch ? (
                                                <li className="flex flex-wrap items-center justify-between gap-4 py-4">
                                                    <div>
                                                        <p className="font-display text-xl">{ghanaLaunch.title}</p>
                                                        <p className="mt-1 text-xs text-muted-foreground">{fmtDate(ghanaLaunch.starts)} · {ghanaLaunch.venue}</p>
                                                    </div>
                                                    <span className="border border-border px-3 py-1.5 text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">
                                                        {e.invitation_only ? 'By invitation' : e.event_type === 'ghana_launch' ? 'Open registration' : 'Open'}
                                                    </span>
                                                </li>
                                            ) : null}
                                            {masterclassEvents.map((e) => {
                                                const registered = registeredEventIds.has(e.id);
                                                return (
                                                    <li key={e.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                                                        <div>
                                                            <p className="font-display text-xl">{e.title}</p>
                                                            <p className="mt-1 text-xs text-muted-foreground">{fmtDate(e.starts)} · {e.venue}</p>
                                                        </div>
                                                        {registered ? (
                                                            <span className="flex items-center gap-2 text-[0.58rem] uppercase tracking-[0.18em] text-[hsl(var(--gold))]">
                                                                <Check size={13} strokeWidth={2} /> Registered
                                                            </span>
                                                        ) : (
                                                            <Link to="/events" className="text-[0.62rem] uppercase tracking-[0.2em] text-[hsl(var(--gold))]">Register</Link>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                            {meetGreetEvents.map((e) => {
                                                const ticket = tickets.find((t) => t.event === e.id);
                                                return (
                                                    <li key={e.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                                                        <div>
                                                            <p className="font-display text-xl">{e.title}</p>
                                                            <p className="mt-1 text-xs text-muted-foreground">{fmtDate(e.starts)} · {e.venue}</p>
                                                        </div>
                                                        {ticket ? (
                                                            <span className="flex items-center gap-2 text-[0.58rem] uppercase tracking-[0.18em] text-[hsl(var(--gold))]">
                                                                <Ticket size={13} strokeWidth={1.6} /> {ticket.tier === 'vip' ? 'VIP' : 'Standard'} ticket
                                                            </span>
                                                        ) : (
                                                            <Link to="/events" className="text-[0.62rem] uppercase tracking-[0.2em] text-[hsl(var(--gold))]">Buy ticket</Link>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                            {events.length === 0 ? <EmptyState>No events are published yet.</EmptyState> : null}
                                        </ul>
                                    )}
                                </Panel>
                            </div>
                        </>
                    ) : null}

                    {tab === 'events' ? (
                        <Panel title="Event registrations" lead="Everything you have registered for or hold a ticket to, and what is next on the programme.">
                            {events.length === 0 ? (
                                <EmptyState>No events published yet.</EmptyState>
                            ) : (
                                <ul className="divide-y divide-border">
                                    {events.map((e) => {
                                        const ticket = tickets.find((t) => t.event === e.id);
                                        const reg = registrations.find((r) => r.event === e.id);
                                        const state = ticket ? `${ticket.tier === 'vip' ? 'VIP' : 'Standard'} ticket` : reg ? 'Registered' : e.invitation_only ? 'By invitation' : 'Not registered';
                                        return (
                                            <li key={e.id} className="py-4">
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <p className="font-display text-xl">{e.title}</p>
                                                    <span className="text-[0.58rem] uppercase tracking-[0.18em] text-[hsl(var(--gold))]">{TYPE_LABEL[e.event_type] || 'Event'} · {state}</span>
                                                </div>
                                                <p className="mt-1 text-xs text-muted-foreground">{fmtDate(e.starts)} · {fmtTime(e.starts)} · {e.venue} · {e.city}</p>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </Panel>
                    ) : null}

                    {tab === 'tickets' ? (
                        <Panel title="Meet & Greet tickets" lead="Every confirmed ticket carries a scannable QR pass. VIP includes one-on-one access and a professional photographer.">
                            {tickets.length === 0 ? (
                                <EmptyState>You have no Meet & Greet tickets yet. Buy one from the events page.</EmptyState>
                            ) : (
                                <ul className="divide-y divide-border">
                                    {tickets.map((t) => {
                                        const ev = t.event;
                                        const isVip = t.tier === 'vip';
                                        const qrData = JSON.stringify({ code: t.confirmation_code, event: ev?.title, tier: t.tier, type: 'meet_and_greet' });
                                        return (
                                            <li key={t.id} className="flex flex-col gap-5 py-6 md:flex-row md:items-center md:justify-between">
                                                <div className="flex items-start gap-5">
                                                    <QrPass data={qrData} />
                                                    <div>
                                                        <p className="font-display text-2xl">{ev?.title || 'Meet & Greet'}</p>
                                                        <p className="mt-1 text-xs text-muted-foreground">{ev ? `${fmtDate(ev.starts)} · ${fmtTime(ev.starts)}` : ''}</p>
                                                        <p className="mt-1 text-xs text-muted-foreground">{ev ? `${ev.venue} · ${ev.city}` : ''}</p>
                                                        <div className="mt-3 flex flex-wrap items-center gap-3">
                                                            <span className={`border px-3 py-1 text-[0.58rem] uppercase tracking-[0.18em] ${isVip ? 'border-[hsl(var(--gold))]/50 text-[hsl(var(--gold))]' : 'border-border text-muted-foreground'}`}>
                                                                {isVip ? 'VIP' : 'Standard'}
                                                            </span>
                                                            <span className="font-mono text-xs text-muted-foreground">{t.confirmation_code}</span>
                                                            <span className="text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">USD {(t.price || 0).toLocaleString()}</span>
                                                        </div>
                                                        {isVip ? (
                                                            <p className="mt-3 flex items-center gap-2 text-xs text-[hsl(var(--gold))]">
                                                                <Camera size={13} strokeWidth={1.6} /> Photographer included · one-on-one access · photos delivered after the event
                                                            </p>
                                                        ) : (
                                                            <p className="mt-3 text-xs text-muted-foreground">Group address and conversation with Pete.</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="flex items-center gap-2 text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">
                                                    <QrCode size={13} strokeWidth={1.4} /> {t.status || 'confirmed'}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </Panel>
                    ) : null}

                    {tab === 'registrations' ? (
                        <Panel title="MasterClass registrations" lead="Your confirmed places and QR passes for the open masterclass and lecture.">
                            {registrations.length === 0 ? (
                                <EmptyState>You have not registered for a masterclass yet.</EmptyState>
                            ) : (
                                <ul className="divide-y divide-border">
                                    {registrations.map((r) => {
                                        const ev = r.event;
                                        const qrData = JSON.stringify({ code: r.confirmation_code, event: ev?.title, type: 'masterclass' });
                                        return (
                                            <li key={r.id} className="flex flex-col gap-5 py-6 md:flex-row md:items-center md:justify-between">
                                                <div className="flex items-start gap-5">
                                                    <QrPass data={qrData} />
                                                    <div>
                                                        <p className="font-display text-2xl">{ev?.title || 'MasterClass'}</p>
                                                        <p className="mt-1 text-xs text-muted-foreground">{ev ? `${fmtDate(ev.starts)} · ${fmtTime(ev.starts)}` : ''}</p>
                                                        <p className="mt-1 text-xs text-muted-foreground">{ev ? `${ev.venue} · ${ev.city}` : ''}</p>
                                                        <p className="mt-3 font-mono text-xs text-muted-foreground">{r.confirmation_code}</p>
                                                    </div>
                                                </div>
                                                <span className="flex items-center gap-2 text-[0.58rem] uppercase tracking-[0.18em] text-[hsl(var(--gold))]">
                                                    <Check size={13} strokeWidth={2} /> {r.status || 'registered'}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </Panel>
                    ) : null}

                    {tab === 'mentorship' ? (
                        <Panel title="Mentorship application" lead="Your application to the African Youth Mentorship Initiative, programme materials and status.">
                            {!mentorship ? (
                                <EmptyState>
                                    You have not applied yet.{' '}
                                    <Link to="/mentorship" className="text-[hsl(var(--gold))]">Apply to the 2027 cohort</Link>
                                </EmptyState>
                            ) : (
                                <>
                                <div className="border border-border p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div>
                                            <p className="font-display text-2xl">{mentorship.cohort || '2027'} cohort</p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {mentorship.discipline || 'Discipline not specified'} · {mentorship.country || 'Country not set'}
                                                {mentorAccessType ? ` · ${registrationTypeLabel(mentorAccessType)}` : ''}
                                            </p>
                                        </div>
                                        {mentorMeta ? (
                                            <span className={`flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.2em] ${mentorMeta.tone}`}>
                                                <mentorMeta.icon size={15} strokeWidth={1.6} /> {mentorMeta.label}
                                            </span>
                                        ) : null}
                                    </div>
                                    <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{mentorship.statement}</p>
                                    {mentorship.status === 'accepted' ? (
                                        <p className="mt-5 border-t border-border pt-4 text-sm text-[hsl(var(--gold))]">
                                            You are enrolled as {registrationTypeLabel(mentorAccessType)}. Programme materials for your registration type are below.
                                        </p>
                                    ) : mentorship.status === 'rejected' ? (
                                        <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
                                            We were unable to offer a place this cohort. You are welcome to apply again for the next intake.
                                        </p>
                                    ) : (
                                        <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
                                            Your application is under review. You will be notified here and by email when a decision is made.
                                            {mentorship.requested_type ? ` Requested registration: ${registrationTypeLabel(mentorship.requested_type)}.` : ''}
                                        </p>
                                    )}
                                </div>

                                {mentorship.status === 'accepted' ? (
                                    <div className="mt-8 border border-border p-6">
                                        <p className="text-[0.6rem] uppercase tracking-[0.22em] text-muted-foreground">Programme materials</p>
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            Resources unlocked for {registrationTypeLabel(mentorAccessType)} registrants and lower tiers included in your plan.
                                        </p>
                                        {materialsLoading ? (
                                            <p className="mt-6 text-sm text-muted-foreground">Loading materials…</p>
                                        ) : materials.length === 0 ? (
                                            <p className="mt-6 text-sm text-muted-foreground">No materials published for your cohort yet. Check back soon.</p>
                                        ) : (
                                            <ul className="mt-6 divide-y divide-border">
                                                {materials.map((item) => {
                                                    const href = materialUrl(item);
                                                    return (
                                                        <li key={item.id} className="flex flex-wrap items-start justify-between gap-4 py-5">
                                                            <div className="max-w-xl">
                                                                <p className="font-display text-xl">{item.title}</p>
                                                                <p className="mt-1 text-xs text-muted-foreground">
                                                                    {item.module || 'General'}{item.cohort ? ` · ${item.cohort} cohort` : ''} · {registrationTypeLabel(item.registration_type)} tier
                                                                </p>
                                                                {item.description ? (
                                                                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                                                                ) : null}
                                                            </div>
                                                            <div className="flex flex-col gap-2">
                                                                {href ? (
                                                                    <a
                                                                        href={href}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-2 border border-border px-4 py-2 text-[0.58rem] uppercase tracking-[0.18em] hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]"
                                                                    >
                                                                        {item.file ? <Download size={13} /> : <ExternalLink size={13} />}
                                                                        {item.file ? 'Download' : 'Open'}
                                                                    </a>
                                                                ) : null}
                                                                {item.video_url ? (
                                                                    <a
                                                                        href={item.video_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="inline-flex items-center gap-2 border border-border px-4 py-2 text-[0.58rem] uppercase tracking-[0.18em] hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]"
                                                                    >
                                                                        <ExternalLink size={13} /> Watch
                                                                    </a>
                                                                ) : null}
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>
                                ) : null}
                                </>
                            )}
                        </Panel>
                    ) : null}

                    {tab === 'orders' ? (
                        <Panel title="Your orders" lead="Preorders, books and tickets — with payment, shipping and delivery status.">
                            {orders.length === 0 ? (
                                <EmptyState>You have no orders yet. Preorder an edition from the book page.</EmptyState>
                            ) : (
                                <ul className="divide-y divide-border">
                                    {orders.map((o) => {
                                        const items = orderItems[o.id] || [];
                                        const addr = o.shipping_address || {};
                                        return (
                                            <li key={o.id} className="py-6">
                                                <div className="flex flex-wrap items-start justify-between gap-4">
                                                    <div className="max-w-xl">
                                                        <p className="font-display text-xl">{o.items_summary || 'Order'}</p>
                                                        <p className="mt-1 font-mono text-xs text-muted-foreground">{o.payment_reference || o.id}</p>
                                                        <p className="mt-1 text-xs text-muted-foreground">{fmtDate(o.created)}</p>
                                                        <p className="mt-2 text-sm text-[hsl(var(--gold))]">{formatUSD(o.total_price)} · payment {o.payment_status}</p>
                                                        {items.length > 0 ? (
                                                            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                                                                {items.map((it) => <li key={it.id}>{it.product_name} × {it.quantity} — {formatUSD(it.total_price)}</li>)}
                                                            </ul>
                                                        ) : null}
                                                        {addr.address_line ? (
                                                            <p className="mt-3 text-xs text-muted-foreground">
                                                                Ship to: {addr.full_name || ''} {addr.address_line}, {addr.city} {addr.region || ''} {addr.country}
                                                            </p>
                                                        ) : null}
                                                        {o.tracking_number ? <p className="mt-2 text-xs text-muted-foreground">Tracking: {o.tracking_number}</p> : null}
                                                        {o.estimated_delivery ? <p className="mt-1 text-xs text-muted-foreground">Estimated delivery: {fmtDate(o.estimated_delivery)}</p> : null}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-3">
                                                        <span className={`border px-3 py-1.5 text-[0.58rem] uppercase tracking-[0.18em] ${o.order_status === 'delivered' ? 'border-[hsl(var(--gold))]/50 text-[hsl(var(--gold))]' : 'border-border text-muted-foreground'}`}>
                                                            {o.order_status || 'pending'}
                                                        </span>
                                                        <button type="button" onClick={() => downloadInvoice(o)} className="border border-border px-4 py-2 text-[0.58rem] uppercase tracking-[0.18em] hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]">
                                                            Download invoice
                                                        </button>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </Panel>
                    ) : null}

                    {tab === 'notifications' ? (
                        <Panel title="Notifications" lead="Platform announcements, event updates and application decisions.">
                            <ul className="divide-y divide-border">
                                {mentorship ? (
                                    <li className="flex items-start gap-3 py-4">
                                        <Mail size={15} strokeWidth={1.6} className="mt-1 shrink-0 text-[hsl(var(--gold))]" />
                                        <div>
                                            <p className="text-sm">Mentorship application — {STATUS_META[mentorship.status || 'pending'].label}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">{mentorship.cohort || '2027'} cohort · updated {fmtDate(mentorship.updated || mentorship.created)}</p>
                                        </div>
                                    </li>
                                ) : null}
                                {tickets.map((t) => (
                                    <li key={t.id} className="flex items-start gap-3 py-4">
                                        <Ticket size={15} strokeWidth={1.6} className="mt-1 shrink-0 text-[hsl(var(--gold))]" />
                                        <div>
                                            <p className="text-sm">Meet & Greet ticket confirmed — {t.tier === 'vip' ? 'VIP' : 'Standard'}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">{t.confirmation_code} · {fmtDate(t.created)}</p>
                                        </div>
                                    </li>
                                ))}
                                {registrations.map((r) => (
                                    <li key={r.id} className="flex items-start gap-3 py-4">
                                        <CalendarDays size={15} strokeWidth={1.6} className="mt-1 shrink-0 text-[hsl(var(--gold))]" />
                                        <div>
                                            <p className="text-sm">MasterClass registration confirmed</p>
                                            <p className="mt-1 text-xs text-muted-foreground">{r.confirmation_code} · {fmtDate(r.created)}</p>
                                        </div>
                                    </li>
                                ))}
                                {!mentorship && tickets.length === 0 && registrations.length === 0 ? (
                                    <EmptyState>You are all caught up.</EmptyState>
                                ) : null}
                            </ul>
                        </Panel>
                    ) : null}

                    {tab === 'profile' ? (
                        <Panel title="Profile & newsletter" lead="Update your details and choose what we send you.">
                            <form onSubmit={saveProfile} className="max-w-lg space-y-5">
                                {[
                                    ['name', 'Full name'],
                                    ['country', 'Country'],
                                    ['phone', 'Phone'],
                                ].map(([key, label]) => (
                                    <div key={key} className="grid gap-2">
                                        <label htmlFor={`p-${key}`} className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">{label}</label>
                                        <input
                                            id={`p-${key}`}
                                            value={profile[key]}
                                            onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
                                            className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-[hsl(var(--gold))]"
                                        />
                                    </div>
                                ))}
                                <fieldset className="grid gap-2">
                                    <legend className="mb-2 text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Newsletter preferences</legend>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {INTEREST_OPTIONS.map((opt) => (
                                            <label key={opt} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                                                <input type="checkbox" checked={interests.includes(opt)} onChange={() => toggle(opt)} className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]" />
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                </fieldset>
                                {saved ? <p className="text-sm text-[hsl(var(--gold))]">{saved}</p> : null}
                                <button type="submit" className="bg-[hsl(var(--primary))] px-8 py-3.5 text-[0.66rem] uppercase tracking-[0.22em] text-white">
                                    Save changes
                                </button>
                            </form>
                        </Panel>
                    ) : null}
                </>
            )}
        </DashboardShell>
    );
};

export default SubscriberDashboard;
