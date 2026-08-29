import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Loader2, Package, Search } from 'lucide-react';
import { formatUSD, lookupGuestOrder } from '@/lib/commerce';

const field =
    'w-full border border-border bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[hsl(var(--gold))]';

const TrackOrderPage = () => {
    const [params] = useSearchParams();
    const [reference, setReference] = useState(params.get('reference') || '');
    const [email, setEmail] = useState(params.get('email') || '');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [order, setOrder] = useState(null);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        setOrder(null);
        try {
            const data = await lookupGuestOrder(reference.trim(), email.trim());
            setOrder(data);
        } catch (err) {
            setError(err.message || 'Could not find that order.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="pt-28 pb-24">
            <Helmet>
                <title>Track your order | Pete Edochie Legacy</title>
                <meta name="description" content="Look up a Pete Edochie Legacy shop order with your email and payment reference." />
            </Helmet>
            <div className="mx-auto max-w-[36rem] px-5 md:px-10">
                <p className="eyebrow">Orders</p>
                <h1 className="mt-4 font-display text-4xl md:text-5xl">Track your order</h1>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Bought without an account? Enter the email used at checkout and your order reference
                    (for example <span className="font-mono text-foreground">PEL-…</span>) to see status.
                    Create an account with that same email to unlock the full dashboard.
                </p>

                <form onSubmit={submit} className="mt-10 space-y-5 border border-border p-7">
                    <div className="grid gap-2">
                        <label htmlFor="t-ref" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">
                            Order reference
                        </label>
                        <input
                            id="t-ref"
                            required
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            placeholder="PEL-…"
                            className={field}
                        />
                    </div>
                    <div className="grid gap-2">
                        <label htmlFor="t-email" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">
                            Email used at checkout
                        </label>
                        <input
                            id="t-email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={field}
                        />
                    </div>
                    {error ? <p className="text-sm text-[hsl(var(--primary))]">{error}</p> : null}
                    <button
                        type="submit"
                        disabled={busy}
                        className="flex w-full items-center justify-center gap-2 bg-[hsl(var(--primary))] py-4 text-[0.7rem] uppercase tracking-[0.24em] text-white disabled:opacity-60"
                    >
                        {busy ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} strokeWidth={1.6} />}
                        Look up order
                    </button>
                </form>

                {order ? (
                    <div className="mt-8 border border-border bg-card p-7">
                        <div className="flex items-start gap-3">
                            <Package size={22} strokeWidth={1.4} className="mt-1 text-[hsl(var(--gold))]" />
                            <div>
                                <p className="font-display text-2xl">Order found</p>
                                <p className="mt-1 font-mono text-xs text-muted-foreground">{order.reference}</p>
                            </div>
                        </div>
                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            <div>
                                <p className="text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">Payment</p>
                                <p className="mt-1 capitalize">{order.payment_status}</p>
                            </div>
                            <div>
                                <p className="text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">Fulfilment</p>
                                <p className="mt-1 capitalize">{order.order_status}</p>
                            </div>
                        </div>
                        {Array.isArray(order.items) && order.items.length > 0 ? (
                            <ul className="mt-6 divide-y divide-border border-t border-border">
                                {order.items.map((it, i) => (
                                    <li key={`${it.product_name}-${i}`} className="flex justify-between gap-3 py-3 text-sm">
                                        <span className="text-muted-foreground">{it.product_name} × {it.quantity}</span>
                                        <span>{formatUSD(it.total_price)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : order.items_summary ? (
                            <p className="mt-6 text-sm text-muted-foreground">{order.items_summary}</p>
                        ) : null}
                        <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
                            <span className="text-[0.66rem] uppercase tracking-[0.22em] text-muted-foreground">Total</span>
                            <span className="font-display text-3xl text-[hsl(var(--gold))]">{formatUSD(order.total_price)}</span>
                        </div>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Link
                                to={`/join?next=${encodeURIComponent('/dashboard')}&email=${encodeURIComponent(order.email || email)}`}
                                className="border border-[hsl(var(--gold))]/60 px-6 py-3 text-[0.66rem] uppercase tracking-[0.22em] text-[hsl(var(--gold))]"
                            >
                                Unlock full dashboard
                            </Link>
                            <Link to="/shop" className="border border-border px-6 py-3 text-[0.66rem] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground">
                                Continue shopping
                            </Link>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default TrackOrderPage;
