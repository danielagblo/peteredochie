import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Camera, Check, Lock, Users } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { initializeTicket } from '@/lib/commerce';
import { fetchCountryDistributor } from '@/lib/distributors';
import CountryCollectionFields from '@/components/CountryCollectionFields';
import { apiCrud } from '@/lib/api';

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
        ? new Date(iso).toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
          })
        : '';

const code = (prefix) =>
    `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const TIER_META = {
    vip: {
        label: 'VIP',
        price: 1000,
        headline: 'One-on-one exclusive access',
        perks: [
            'Exclusive one-on-one access to Pete Edochie',
            'Professional photographer on standby',
            'All photos included and delivered after the event',
            'Limited slots — intimate setting',
        ],
    },
    standard: {
        label: 'Standard',
        price: 500,
        headline: 'Group address and conversation',
        perks: [
            'General address and conversation by Pete',
            'Group setting with fellow attendees',
            'More slots available',
            'QR pass for check-in',
        ],
    },
};

const EventParticipateDialog = ({ event, open, onClose, paidTicket }) => {
    const { isAuthed, user } = useAuth();
    const isMeetGreet = event?.event_type === 'meet_and_greet';
    const isMasterclass = event?.event_type === 'masterclass';

    const [tier, setTier] = useState('standard');
    const [step, setStep] = useState('select'); // select | pay | done
    const [country, setCountry] = useState('GH');
    const [region, setRegion] = useState('');
    const [fulfillmentMethod, setFulfillmentMethod] = useState('ship');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [ticket, setTicket] = useState(null);

    const tiers = useMemo(() => {
        const raw = Array.isArray(event?.ticket_tiers) ? event.ticket_tiers : [];
        if (raw.length) return raw;
        return isMeetGreet ? [{ tier: 'vip', price: 1000 }, { tier: 'standard', price: 500 }] : [];
    }, [event, isMeetGreet]);

    const reset = () => {
        setStep('select');
        setTier('standard');
        setCountry('GH');
        setRegion('');
        setFulfillmentMethod('ship');
        setError('');
        setTicket(null);
    };

    const close = () => {
        reset();
        onClose();
    };

    const resolveCollection = async () => {
        if (fulfillmentMethod !== 'distributor_collection') {
            return { country, fulfillment_method: 'ship', distributor_id: undefined };
        }
        if (!country || !region) {
            throw new Error('Please select your country and region for collection.');
        }
        const match = await fetchCountryDistributor(country);
        if (!match?.distributor?.id) {
            throw new Error('No distributor is available for collection in that country. Choose shipping instead.');
        }
        return {
            country,
            fulfillment_method: 'distributor_collection',
            distributor_id: match.distributor.id,
        };
    };

    const submitRegistration = async () => {
        setBusy(true);
        setError('');
        try {
            if (!region) {
                setError('Please select your country and region.');
                setBusy(false);
                return;
            }
            const collection = await resolveCollection();
            const confirm = code('MC');
            const rec = await apiCrud.create('event-registrations', {
                owner: user.id,
                event: event.id,
                status: 'registered',
                confirmation_code: confirm,
                ...collection,
            });
            setTicket({ ...rec, kind: 'registration' });
            setStep('done');
        } catch (err) {
            setError(err?.response?.message || 'We could not complete your registration.');
        } finally {
            setBusy(false);
        }
    };

    // Meet & Greet: redirect to Paystack to complete payment. The ticket is
    // created as pending; Paystack redirects back to /events?ticket=REFERENCE,
    // which re-opens this dialog in the confirmation state.
    const makePayment = async () => {
        setBusy(true);
        setError('');
        try {
            const collection = await resolveCollection();
            const result = await initializeTicket({
                event_id: event.id,
                tier,
                email: user.email,
                return_origin: window.location.origin,
                ...collection,
            });
            if (result.configured && result.authorization_url) {
                window.location.href = result.authorization_url;
                return; // page is navigating away
            }
            // Paystack not configured yet — record the pending ticket and
            // surface a pending confirmation.
            setTicket({
                id: result.ticket_id,
                kind: 'ticket',
                tier,
                confirmation_code: result.confirmation_code || '',
                payment_status: 'pending',
                pending: true,
            });
            setStep('done');
        } catch (err) {
            setError(err?.message || 'We could not start your payment. Please try again.');
            setBusy(false);
        }
    };

    if (!event) return null;

    const signInNext = `/events?join=${event.id}`;

    // A paidTicket (passed in after the Paystack redirect) takes precedence
    // and shows the confirmation view directly.
    const resolvedTicket = paidTicket || (step === 'done' ? ticket : null);

    return (
        <Dialog open={open} onOpenChange={(o) => !o && close()}>
            <DialogContent className="max-w-lg border-border bg-card p-0 md:max-w-xl">
                <DialogHeader className="border-b border-border px-7 py-6">
                    <DialogTitle className="font-display text-3xl">{event.title}</DialogTitle>
                    <DialogDescription className="mt-2 text-sm text-muted-foreground">
                        {fmtDate(event.starts)} · {event.venue} · {fmtTime(event.starts)}
                        {event.ends ? `–${fmtTime(event.ends)}` : ''}
                    </DialogDescription>
                </DialogHeader>

                <div className="px-7 py-7">
                    {!isAuthed ? (
                        <div className="text-center">
                            <p className="eyebrow">Sign in required</p>
                            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                                {isMeetGreet
                                    ? 'Purchase a Meet & Greet ticket through Paystack and receive your QR pass in your dashboard.'
                                    : 'Register for the masterclass and receive a QR pass in your dashboard.'}
                            </p>
                            <div className="mt-7 flex flex-col gap-3">
                                <Link
                                    to={`/login?next=${encodeURIComponent(signInNext)}`}
                                    className="bg-[hsl(var(--primary))] py-4 text-center text-[0.7rem] uppercase tracking-[0.24em] text-white"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    to={`/join?next=${encodeURIComponent(signInNext)}`}
                                    className="border border-border py-4 text-center text-[0.7rem] uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]"
                                >
                                    Create an account
                                </Link>
                            </div>
                        </div>
                    ) : resolvedTicket ? (
                        <ConfirmationView event={event} ticket={resolvedTicket} tier={resolvedTicket.tier || tier} onDone={close} />
                    ) : isMasterclass ? (
                        <MasterclassRegister
                            event={event}
                            user={user}
                            country={country}
                            region={region}
                            fulfillmentMethod={fulfillmentMethod}
                            onCountry={setCountry}
                            onRegion={setRegion}
                            onFulfillmentMethod={setFulfillmentMethod}
                            busy={busy}
                            error={error}
                            onConfirm={submitRegistration}
                        />
                    ) : step === 'select' ? (
                        <TierSelect
                            event={event}
                            tiers={tiers}
                            tier={tier}
                            onTier={setTier}
                            onContinue={() => setStep('pay')}
                        />
                    ) : (
                        <PaymentReview
                            event={event}
                            tier={tier}
                            country={country}
                            region={region}
                            fulfillmentMethod={fulfillmentMethod}
                            onCountry={setCountry}
                            onRegion={setRegion}
                            onFulfillmentMethod={setFulfillmentMethod}
                            busy={busy}
                            error={error}
                            onBack={() => setStep('select')}
                            onPay={makePayment}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

const TierCard = ({ active, onClick, label, price, headline, perks, badge }) => (
    <button
        type="button"
        onClick={onClick}
        className={`w-full border p-6 text-left transition-colors ${
            active ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/5' : 'border-border hover:border-[hsl(var(--gold))]/50'
        }`}
    >
        <div className="flex items-center justify-between">
            <span className="font-display text-2xl">{label}</span>
            <span className="font-display text-2xl text-[hsl(var(--gold))]">USD {price.toLocaleString()}</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{headline}</p>
        {badge ? (
            <p className="mt-3 inline-block border border-[hsl(var(--gold))]/40 px-3 py-1 text-[0.58rem] uppercase tracking-[0.18em] text-[hsl(var(--gold))]">
                {badge}
            </p>
        ) : null}
        <ul className="mt-4 space-y-2">
            {perks.map((p) => (
                <li key={p} className="flex gap-2.5 text-xs leading-relaxed text-muted-foreground">
                    <Check size={13} strokeWidth={2} className="mt-0.5 shrink-0 text-[hsl(var(--gold))]" />
                    {p}
                </li>
            ))}
        </ul>
    </button>
);

const TierSelect = ({ event, tiers, tier, onTier, onContinue }) => (
    <div>
        <p className="eyebrow">Choose your tier</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{event.summary}</p>
        <div className="mt-6 grid gap-4">
            {tiers
                .slice()
                .sort((a, b) => b.price - a.price)
                .map((t) => {
                    const meta = TIER_META[t.tier] || TIER_META.standard;
                    return (
                        <TierCard
                            key={t.tier}
                            active={tier === t.tier}
                            onClick={() => onTier(t.tier)}
                            label={meta.label}
                            price={t.price}
                            headline={meta.headline}
                            perks={meta.perks}
                            badge={t.tier === 'vip' ? 'Limited slots' : null}
                        />
                    );
                })}
        </div>
        <button
            type="button"
            onClick={onContinue}
            className="mt-7 w-full bg-[hsl(var(--primary))] py-4 text-[0.7rem] uppercase tracking-[0.24em] text-white"
        >
            Continue to payment
        </button>
    </div>
);

const PaymentReview = ({
    event,
    tier,
    country,
    region,
    fulfillmentMethod,
    onCountry,
    onRegion,
    onFulfillmentMethod,
    busy,
    error,
    onBack,
    onPay,
}) => {
    const meta = TIER_META[tier] || TIER_META.standard;
    return (
        <div>
            <p className="eyebrow">Secure checkout</p>
            <div className="mt-5 flex items-center justify-between border border-border p-5">
                <div>
                    <p className="font-display text-xl">{meta.label} — Meet & Greet</p>
                    <p className="mt-1 text-xs text-muted-foreground">{event.venue} · {event.city}</p>
                </div>
                <p className="font-display text-2xl text-[hsl(var(--gold))]">USD {meta.price.toLocaleString()}</p>
            </div>

            <ul className="mt-5 space-y-2">
                {meta.perks.map((p) => (
                    <li key={p} className="flex gap-2.5 text-xs leading-relaxed text-muted-foreground">
                        <Check size={13} strokeWidth={2} className="mt-0.5 shrink-0 text-[hsl(var(--gold))]" />
                        {p}
                    </li>
                ))}
            </ul>

            <div className="mt-6 border-t border-border pt-6">
                <p className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Country & collection</p>
                <CountryCollectionFields
                    className="mt-4"
                    country={country}
                    region={region}
                    fulfillmentMethod={fulfillmentMethod}
                    onCountry={(code) => { onCountry(code); onRegion(''); }}
                    onRegion={onRegion}
                    onFulfillmentMethod={onFulfillmentMethod}
                />
            </div>

            <p className="mt-5 flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                <Lock size={12} strokeWidth={1.6} /> Secure payment via Paystack
            </p>

            {error ? <p className="mt-4 text-sm text-[hsl(var(--destructive))]">{error}</p> : null}

            <div className="mt-6 flex gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    disabled={busy}
                    className="flex-1 border border-border py-4 text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
                >
                    Back
                </button>
                <button
                    type="button"
                    onClick={onPay}
                    disabled={busy}
                    className="flex-[2] bg-[hsl(var(--primary))] py-4 text-[0.7rem] uppercase tracking-[0.24em] text-white disabled:opacity-60"
                >
                    {busy ? 'Redirecting…' : 'Make Payment'}
                </button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
                You will be redirected to Paystack to complete payment. Your QR pass is issued on confirmation.
            </p>
        </div>
    );
};

const MasterclassRegister = ({
    event,
    user,
    country,
    region,
    fulfillmentMethod,
    onCountry,
    onRegion,
    onFulfillmentMethod,
    busy,
    error,
    onConfirm,
}) => (
    <div>
        <p className="eyebrow">Open registration</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{event.summary}</p>
        <div className="mt-6 border border-border p-5">
            <p className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Registering as</p>
            <p className="mt-2 font-display text-xl">{user?.name || user?.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">{user?.email}</p>
            <p className="mt-4 text-[0.62rem] uppercase tracking-[0.2em] text-[hsl(var(--gold))]">{event.price || 'Free'}</p>
        </div>
        <div className="mt-6 border-t border-border pt-6">
            <p className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Country & pass collection</p>
            <CountryCollectionFields
                className="mt-4"
                country={country}
                region={region}
                fulfillmentMethod={fulfillmentMethod}
                onCountry={(code) => { onCountry(code); onRegion(''); }}
                onRegion={onRegion}
                onFulfillmentMethod={onFulfillmentMethod}
            />
        </div>
        {error ? <p className="mt-4 text-sm text-[hsl(var(--destructive))]">{error}</p> : null}
        <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="mt-6 w-full bg-[hsl(var(--primary))] py-4 text-[0.7rem] uppercase tracking-[0.24em] text-white disabled:opacity-60"
        >
            {busy ? 'Registering…' : 'Confirm registration'}
        </button>
        <p className="mt-4 text-xs text-muted-foreground">
            A QR pass for check-in will be issued to your dashboard immediately.
        </p>
    </div>
);

const ConfirmationView = ({ event, ticket, tier, onDone }) => {
    const isTicket = ticket.kind === 'ticket';
    const meta = TIER_META[tier] || TIER_META.standard;
    const pending = ticket.pending || ticket.payment_status === 'pending';
    const qrData = JSON.stringify({
        code: ticket.confirmation_code,
        event: event.title,
        tier: isTicket ? ticket.tier : 'registration',
        type: isTicket ? 'meet_and_greet' : 'masterclass',
    });
    return (
        <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[hsl(var(--gold))] text-[hsl(var(--gold))]">
                <Check size={22} strokeWidth={1.6} />
            </div>
            <p className="mt-5 font-display text-3xl">
                {pending ? 'Ticket recorded' : isTicket ? 'Ticket confirmed' : 'Registration confirmed'}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
                {pending
                    ? 'Your ticket is recorded as pending. Your QR pass will be issued once payment is confirmed.'
                    : 'Your QR pass is below and saved to your dashboard.'}
            </p>

            <div className="mt-7 flex flex-col items-center border border-border bg-background p-6">
                {pending ? null : (
                    <div className="rounded bg-white p-3">
                        <QRCodeSVG value={qrData} size={160} />
                    </div>
                )}
                <p className="mt-4 font-display text-xl">{event.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                    {fmtDate(event.starts)} · {fmtTime(event.starts)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{event.venue} · {event.city}</p>
                <div className="mt-4 flex items-center gap-3">
                    <span className="border border-[hsl(var(--gold))]/40 px-3 py-1 text-[0.58rem] uppercase tracking-[0.18em] text-[hsl(var(--gold))]">
                        {isTicket ? meta.label : 'Registration'}
                    </span>
                    {ticket.confirmation_code ? (
                        <span className="font-mono text-sm text-muted-foreground">{ticket.confirmation_code}</span>
                    ) : null}
                </div>
                {isTicket && ticket.tier === 'vip' ? (
                    <p className="mt-4 flex items-center gap-2 text-xs text-[hsl(var(--gold))]">
                        <Camera size={13} strokeWidth={1.6} /> Photographer included · photos delivered after the event
                    </p>
                ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-3">
                <Link
                    to="/dashboard"
                    className="bg-[hsl(var(--primary))] py-4 text-[0.7rem] uppercase tracking-[0.24em] text-white"
                >
                    Go to dashboard
                </Link>
                <button
                    type="button"
                    onClick={onDone}
                    className="border border-border py-4 text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default EventParticipateDialog;
