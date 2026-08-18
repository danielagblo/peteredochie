import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Loader2, Lock, Minus, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { formatUSD, initializeOrder, paystackStatus } from '@/lib/commerce';
import { COUNTRIES, regionsFor, zipRequired } from '@/lib/countries';
import pb from '@/lib/pocketbaseClient';

const input = 'w-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-[hsl(var(--gold))]';

const CheckoutPage = () => {
    const { user, isAuthed } = useAuth();
    const { items, setQty, remove, clear } = useCart();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [configured, setConfigured] = useState(true);
    const [form, setForm] = useState({
        full_name: user?.name || '',
        email: user?.email || '',
        address_line: '',
        city: '',
        country: 'GH',
        region: '',
        postal_code: '',
        phone: user?.phone || '',
    });

    useEffect(() => {
        if (!isAuthed) {
            navigate('/login?next=/checkout');
        }
    }, [isAuthed, navigate]);

    useEffect(() => {
        paystackStatus().then(setConfigured);
    }, []);

    useEffect(() => {
        if (items.length === 0) {
            setLoading(false);
            return;
        }
        const filter = items.map((i) => `id = "${i.product_id}"`).join(' || ');
        pb.collection('products')
            .getFullList({ filter, requestKey: 'checkout-prods' })
            .then(setProducts)
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    }, [items]);

    const lines = useMemo(
        () =>
            items
                .map((i) => {
                    const product = products.find((p) => p.id === i.product_id);
                    return product ? { ...i, product } : null;
                })
                .filter(Boolean),
        [items, products],
    );

    const total = useMemo(
        () => Math.round(lines.reduce((sum, l) => sum + (Number(l.product.price) || 0) * l.quantity, 0) * 100) / 100,
        [lines],
    );

    const countryRegions = useMemo(() => regionsFor(form.country), [form.country]);
    const needsZip = zipRequired(form.country);

    // Reset region when country changes.
    useEffect(() => {
        setForm((prev) => ({ ...prev, region: '' }));
    }, [form.country]);

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const purchase = async (e) => {
        e.preventDefault();
        setError('');
        if (lines.length === 0) {
            setError('Your cart is empty.');
            return;
        }
        if (!form.full_name || !form.email || !form.address_line || !form.city || !form.country || !form.region) {
            setError('Please complete all required fields (name, email, address, city, country and region/state).');
            return;
        }
        if (needsZip && !form.postal_code) {
            setError('A postal / zip code is required for the selected country.');
            return;
        }
        setSubmitting(true);
        try {
            const result = await initializeOrder({
                items: lines.map((l) => ({ product_id: l.product_id, quantity: l.quantity, variant: l.variant || '' })),
                shipping_address: form,
                email: form.email,
                country: form.country,
                return_origin: window.location.origin,
            });
            clear();
            if (result.configured && result.authorization_url) {
                window.location.href = result.authorization_url;
            } else {
                navigate(`/order/${result.reference}`);
            }
        } catch (err) {
            setError(err.message || 'Could not start checkout.');
            setSubmitting(false);
        }
    };

    if (!isAuthed) return null;

    return (
        <div className="pt-28">
            <Helmet>
                <title>Checkout | Pete Edochie Legacy | King Dawie Publishing</title>
                <meta name="description" content="Review your order and complete secure payment for Pete Edochie Legacy books and merchandise." />
            </Helmet>
            <div className="mx-auto max-w-[64rem] px-5 py-12 md:px-10">
                <p className="eyebrow">Checkout</p>
                <h1 className="mt-4 font-display text-4xl md:text-5xl">Review your order</h1>

                {loading ? (
                    <div className="mt-10 flex items-center gap-3 text-sm text-muted-foreground">
                        <Loader2 size={16} className="animate-spin" /> Loading your cart…
                    </div>
                ) : lines.length === 0 ? (
                    <div className="mt-10 border border-dashed border-border px-6 py-16 text-center">
                        <p className="text-sm text-muted-foreground">Your cart is empty.</p>
                        <div className="mt-5 flex flex-wrap justify-center gap-3">
                            <Link to="/shop" className="border border-[hsl(var(--gold))]/60 px-6 py-3 text-[0.66rem] uppercase tracking-[0.22em] text-[hsl(var(--gold))]">Browse the shop</Link>
                            <Link to="/book" className="border border-border px-6 py-3 text-[0.66rem] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground">Browse the book</Link>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={purchase} className="mt-10 grid gap-10 md:grid-cols-[1.4fr_1fr]">
                        <div className="space-y-6">
                            <section className="border border-border bg-card p-6">
                                <h2 className="font-display text-2xl">Your items</h2>
                                <ul className="mt-5 divide-y divide-border">
                                    {lines.map((l) => (
                                        <li key={`${l.product_id}-${l.variant || ''}`} className="flex flex-wrap items-center justify-between gap-4 py-5">
                                            <div className="max-w-xs">
                                                <p className="font-display text-lg">{l.product.name}</p>
                                                {l.variant ? <p className="mt-0.5 text-xs text-muted-foreground">{l.variant}</p> : null}
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {l.product.format === 'hardcopy' ? 'Hardcopy · ships with tracking' : 'Digital'}
                                                </p>
                                                <p className="mt-1 text-sm text-[hsl(var(--gold))]">{formatUSD(l.product.price)}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center border border-border">
                                                    <button type="button" onClick={() => setQty(l.product_id, l.quantity - 1, l.variant)} className="px-3 py-2 text-muted-foreground hover:text-foreground">
                                                        <Minus size={13} strokeWidth={1.6} />
                                                    </button>
                                                    <span className="w-10 text-center text-sm">{l.quantity}</span>
                                                    <button type="button" onClick={() => setQty(l.product_id, l.quantity + 1, l.variant)} className="px-3 py-2 text-muted-foreground hover:text-foreground">
                                                        <Plus size={13} strokeWidth={1.6} />
                                                    </button>
                                                </div>
                                                <button type="button" onClick={() => remove(l.product_id, l.variant)} className="text-muted-foreground hover:text-[hsl(var(--primary))]">
                                                    <Trash2 size={15} strokeWidth={1.4} />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            <section className="border border-border bg-card p-6">
                                <h2 className="font-display text-2xl">Shipping & contact details</h2>
                                <p className="mt-2 text-sm text-muted-foreground">All purchases require a delivery address and contact details, even digital editions, for order records and fulfilment.</p>
                                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2 sm:col-span-2">
                                        <label className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Full name *</label>
                                        <input className={input} required value={form.full_name} onChange={set('full_name')} />
                                    </div>
                                    <div className="grid gap-2 sm:col-span-2">
                                        <label className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Email *</label>
                                        <input className={input} type="email" required value={form.email} onChange={set('email')} />
                                    </div>
                                    <div className="grid gap-2 sm:col-span-2">
                                        <label className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Street address *</label>
                                        <input className={input} required value={form.address_line} onChange={set('address_line')} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">City *</label>
                                        <input className={input} required value={form.city} onChange={set('city')} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Country *</label>
                                        <select className={input} required value={form.country} onChange={set('country')}>
                                            {COUNTRIES.map((c) => (
                                                <option key={c.code} value={c.code}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Region / State *</label>
                                        {countryRegions.length > 0 ? (
                                            <select className={input} required value={form.region} onChange={set('region')}>
                                                <option value="" disabled>Select region</option>
                                                {countryRegions.map((r) => (
                                                    <option key={r} value={r}>{r}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input className={input} required value={form.region} onChange={set('region')} placeholder="Enter region / state" />
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">
                                            Postal / Zip code{needsZip ? ' *' : ' (optional)'}
                                        </label>
                                        <input className={input} required={needsZip} value={form.postal_code} onChange={set('postal_code')} />
                                    </div>
                                    <div className="grid gap-2 sm:col-span-2">
                                        <label className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Phone</label>
                                        <input className={input} value={form.phone} onChange={set('phone')} />
                                    </div>
                                </div>
                            </section>
                        </div>

                        <aside className="space-y-6">
                            <section className="border border-border bg-card p-6 md:sticky md:top-28">
                                <h2 className="font-display text-2xl">Order summary</h2>
                                <ul className="mt-5 space-y-3 text-sm">
                                    {lines.map((l) => (
                                        <li key={`${l.product_id}-${l.variant || ''}`} className="flex items-start justify-between gap-3 text-muted-foreground">
                                            <span>{l.product.name}{l.variant ? ` (${l.variant})` : ''} × {l.quantity}</span>
                                            <span className="shrink-0 text-foreground">{formatUSD((Number(l.product.price) || 0) * l.quantity)}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
                                    <span className="text-[0.66rem] uppercase tracking-[0.22em] text-muted-foreground">Total</span>
                                    <span className="font-display text-3xl text-[hsl(var(--gold))]">{formatUSD(total)}</span>
                                </div>

                                {!configured ? (
                                    <p className="mt-5 border border-[hsl(var(--gold))]/40 bg-[hsl(var(--gold))]/5 px-4 py-3 text-xs text-muted-foreground">
                                        Paystack is being connected. Your order will be recorded as pending and you will be notified when payment opens.
                                    </p>
                                ) : (
                                    <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                                        <Lock size={12} strokeWidth={1.6} className="text-[hsl(var(--gold))]" /> Secure payment via Paystack
                                    </p>
                                )}

                                {error ? <p className="mt-4 text-sm text-[hsl(var(--primary))]">{error}</p> : null}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="mt-6 flex w-full items-center justify-center gap-2 bg-[hsl(var(--primary))] py-4 text-[0.66rem] uppercase tracking-[0.22em] text-white transition-transform active:scale-[0.98] disabled:opacity-60"
                                >
                                    {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
                                    {configured ? 'Make Payment' : 'Place order'}
                                </button>
                                <div className="mt-4 flex justify-center gap-4 text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">
                                    <Link to="/shop" className="hover:text-foreground">Continue shopping</Link>
                                    <Link to="/book" className="hover:text-foreground">The book</Link>
                                </div>
                            </section>
                        </aside>
                    </form>
                )}
            </div>
        </div>
    );
};

export default CheckoutPage;
