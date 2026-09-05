import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import CountryCollectionFields, { collectionInput } from '@/components/CountryCollectionFields';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiCrud } from '@/lib/api';
import { formatUSD, initializeOrder, isPurchasable, paystackStatus } from '@/lib/commerce';
import { zipRequired } from '@/lib/countries';
import { fetchCountryDistributor } from '@/lib/distributors';

const field = collectionInput;

const BookPreregistrationForm = ({ product }) => {
    const { user, isAuthed } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        full_name: '',
        email: '',
        phone: '',
        address_line: '',
        city: '',
        country: 'GH',
        region: '',
        postal_code: '',
        quantity: 1,
        notes: '',
    });
    const [fulfillmentMethod, setFulfillmentMethod] = useState('ship');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [configured, setConfigured] = useState(true);

    const isDigital = product?.format === 'digital';
    const unitPrice = Number(product?.price) || 0;
    const qty = Math.max(1, Number(form.quantity) || 1);
    const total = useMemo(() => Math.round(unitPrice * qty * 100) / 100, [unitPrice, qty]);
    const purchasable = isPurchasable(product);
    const collecting = !isDigital && fulfillmentMethod === 'distributor_collection';
    const needsZip = zipRequired(form.country);

    useEffect(() => {
        paystackStatus().then(setConfigured);
    }, []);

    useEffect(() => {
        if (!user) return;
        setForm((prev) => ({
            ...prev,
            full_name: prev.full_name || user.name || '',
            email: prev.email || user.email || '',
            phone: prev.phone || user.phone || '',
            country: prev.country || user.country || 'GH',
        }));
    }, [user]);

    useEffect(() => {
        setForm((prev) => ({ ...prev, region: '' }));
    }, [form.country]);

    const submit = async (e) => {
        e.preventDefault();
        if (!product?.id || !purchasable) return;
        setError('');

        if (!form.full_name || !form.email || !form.phone || !form.country || !form.region) {
            setError('Please complete name, email, phone, country and region.');
            return;
        }
        if (!isDigital && !collecting && (!form.address_line || !form.city)) {
            setError('Please enter your street address and city for delivery.');
            return;
        }
        if (!isDigital && !collecting && needsZip && !form.postal_code) {
            setError('A postal / zip code is required for the selected country.');
            return;
        }
        if (unitPrice <= 0) {
            setError('This edition does not have a price set yet. Contact the publishing office.');
            return;
        }

        setSending(true);
        try {
            let distributorId = '';
            if (collecting) {
                const match = await fetchCountryDistributor(form.country);
                if (!match?.distributor?.id) {
                    setError('No distributor is available for collection in that country. Choose shipping instead.');
                    setSending(false);
                    return;
                }
                distributorId = match.distributor.id;
            }

            const shipping = isDigital
                ? {
                    full_name: form.full_name,
                    email: form.email,
                    phone: form.phone,
                    country: form.country,
                    region: form.region,
                    city: form.city || form.region,
                    address_line: form.notes || 'Digital edition — email delivery',
                    postal_code: form.postal_code || '',
                }
                : collecting
                    ? {
                        ...form,
                        address_line: form.address_line || 'Collect from distributor',
                        city: form.city || form.region,
                    }
                    : form;

            const result = await initializeOrder({
                items: [{ product_id: product.id, quantity: qty }],
                shipping_address: shipping,
                email: form.email,
                country: form.country,
                fulfillment_method: isDigital ? 'ship' : fulfillmentMethod,
                distributor_id: distributorId || undefined,
                return_origin: window.location.origin,
            });

            try {
                await apiCrud.create('book-preregistrations', {
                    product: product.id,
                    full_name: form.full_name,
                    email: form.email,
                    phone: form.phone,
                    country: form.country,
                    city: form.city || form.region,
                    quantity: qty,
                    edition: product.edition || product.name,
                    notes: [
                        form.notes,
                        `Paid preorder · order ${result.reference}`,
                        `Total ${formatUSD(total)}`,
                    ].filter(Boolean).join(' · '),
                    status: 'pending',
                });
            } catch (_) {
                /* order is source of truth for payment */
            }

            toast({
                title: configured && result.authorization_url ? 'Redirecting to payment' : 'Preorder recorded',
                description: configured && result.authorization_url
                    ? 'Complete payment to confirm your book preorder.'
                    : 'Your preorder is pending payment confirmation.',
            });

            if (result.configured && result.authorization_url) {
                window.location.href = result.authorization_url;
                return;
            }
            navigate(`/order/${result.reference}`);
        } catch (err) {
            setError(err.message || 'Could not start payment for this preorder.');
            setSending(false);
        }
    };

    if (!purchasable) {
        return (
            <div className="border border-border bg-[hsl(var(--surface))] p-8 md:p-10">
                <p className="eyebrow">Preorder</p>
                <h2 className="mt-3 font-display text-3xl">Not available yet</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    This edition is not open for purchase right now. Check back soon or browse other editions.
                </p>
                <Link to="/book" className="mt-6 inline-block text-[0.68rem] uppercase tracking-[0.2em] text-[hsl(var(--gold))]">
                    Browse editions
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="border border-border bg-[hsl(var(--surface))] p-8 md:p-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="eyebrow">Secure preorder</p>
                    <h2 className="mt-3 font-display text-3xl">Preorder &amp; pay</h2>
                    <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                        Reserve <span className="text-foreground">{product.edition || product.name}</span> with payment now.
                        You will be redirected to Paystack to complete checkout.
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Total</p>
                    <p className="mt-1 font-display text-3xl text-[hsl(var(--gold))]">{formatUSD(total)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{qty} × {formatUSD(unitPrice)}</p>
                </div>
            </div>

            {!isAuthed ? (
                <p className="mt-5 text-sm text-muted-foreground">
                    Guest checkout is available.{' '}
                    <Link to="/login" className="text-[hsl(var(--gold))]">Sign in</Link>
                    {' '}to save the order to your dashboard.
                </p>
            ) : null}

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2 sm:col-span-2">
                    <label htmlFor="pr-name" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Full name *</label>
                    <input id="pr-name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={field} />
                </div>
                <div className="grid gap-2">
                    <label htmlFor="pr-email" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Email *</label>
                    <input id="pr-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} />
                </div>
                <div className="grid gap-2">
                    <label htmlFor="pr-phone" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Phone / WhatsApp *</label>
                    <input id="pr-phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={field} />
                </div>
                <div className="grid gap-2">
                    <label htmlFor="pr-qty" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Number of copies *</label>
                    <input
                        id="pr-qty"
                        type="number"
                        min={1}
                        max={99}
                        required
                        value={form.quantity}
                        onChange={(e) => setForm({ ...form, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                        className={field}
                    />
                </div>
            </div>

            <div className="mt-6">
                <CountryCollectionFields
                    country={form.country}
                    region={form.region}
                    fulfillmentMethod={fulfillmentMethod}
                    onCountry={(country) => setForm((prev) => ({ ...prev, country }))}
                    onRegion={(region) => setForm((prev) => ({ ...prev, region }))}
                    onFulfillmentMethod={setFulfillmentMethod}
                    showFulfillment={!isDigital}
                />
            </div>

            {!isDigital && !collecting ? (
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <div className="grid gap-2 sm:col-span-2">
                        <label htmlFor="pr-address" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Street address *</label>
                        <input id="pr-address" required value={form.address_line} onChange={(e) => setForm({ ...form, address_line: e.target.value })} className={field} />
                    </div>
                    <div className="grid gap-2">
                        <label htmlFor="pr-city" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">City *</label>
                        <input id="pr-city" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={field} />
                    </div>
                    <div className="grid gap-2">
                        <label htmlFor="pr-zip" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">
                            Postal / zip{needsZip ? ' *' : ''}
                        </label>
                        <input
                            id="pr-zip"
                            required={needsZip}
                            value={form.postal_code}
                            onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                            className={field}
                        />
                    </div>
                </div>
            ) : null}

            <div className="mt-5 grid gap-2">
                <label htmlFor="pr-notes" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Notes (optional)</label>
                <textarea
                    id="pr-notes"
                    rows={3}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className={field}
                    placeholder="Gift message, delivery preference…"
                />
            </div>

            {error ? <p className="mt-5 text-sm text-[hsl(var(--destructive))]">{error}</p> : null}

            {!configured ? (
                <p className="mt-5 text-sm text-muted-foreground">
                    Online payment is being configured. Your preorder will still be recorded and the office will follow up.
                </p>
            ) : null}

            <button
                type="submit"
                disabled={sending}
                className="mt-8 flex w-full items-center justify-center gap-2 bg-[hsl(var(--primary))] py-4 text-[0.7rem] uppercase tracking-[0.24em] text-[hsl(var(--primary-foreground))] transition-transform active:scale-[0.99] disabled:opacity-60"
            >
                {sending ? (
                    <span className="inline-flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Starting payment…</span>
                ) : (
                    <>
                        <Lock size={14} strokeWidth={1.6} />
                        Pay {formatUSD(total)} &amp; preorder
                    </>
                )}
            </button>
            <p className="mt-4 text-center text-xs text-muted-foreground">
                Secure payment via Paystack. After payment you will receive an order confirmation.
            </p>
        </form>
    );
};

export default BookPreregistrationForm;
