import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { CheckCircle2, Loader2, Package, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { verifyOrder, formatUSD } from '@/lib/commerce';
import { countryName } from '@/lib/countries';
import { distributorDetails, fulfillmentLabel } from '@/lib/distributors';
import { DistributorPanel } from '@/components/CountryCollectionFields';
import { apiCrud } from '@/lib/api';

const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

const OrderPage = () => {
    const { reference } = useParams();
    const { user, isAuthed } = useAuth();
    const [status, setStatus] = useState('verifying'); // verifying | paid | pending | failed
    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);

    useEffect(() => {
        let active = true;
        verifyOrder(reference)
            .then((res) => {
                if (!active) return;
                setStatus(res.payment_status || 'pending');
                if (res.kind === 'order' || res.order_id || res.items_summary || res.email) {
                    setOrder((prev) => ({
                        ...(prev || {}),
                        id: res.order_id || prev?.id,
                        payment_reference: reference,
                        payment_status: res.payment_status || prev?.payment_status,
                        order_status: res.order_status || prev?.order_status,
                        email: res.email || prev?.email,
                        total_price: res.total_price ?? prev?.total_price,
                        currency: res.currency || prev?.currency,
                        items_summary: res.items_summary || prev?.items_summary,
                    }));
                }
            })
            .catch(() => {
                if (active) setStatus('pending');
            });
        return () => {
            active = false;
        };
    }, [reference]);

    useEffect(() => {
        if (!user?.id) return;
        apiCrud
            .list('orders', { filter: `payment_reference = "${reference}"` })
            .then(async (oList) => {
                const o = oList?.[0];
                if (!o) return;
                setOrder(o);
                try {
                    const its = await apiCrud.list('order-items', {
                        filter: `order = "${o.id}"`,
                    });
                    setItems(its);
                } catch (_) {
                    /* ignore */
                }
            })
            .catch(() => {});
    }, [user, reference]);

    const collectionDetails = order?.distributor
        ? distributorDetails(order.distributor)
        : null;

    const meta = {
        paid: { icon: CheckCircle2, tone: 'text-[hsl(var(--gold))]', title: 'Payment confirmed', text: 'Your order is confirmed. A receipt has been sent to your email.' },
        pending: { icon: Package, tone: 'text-[hsl(var(--gold))]', title: 'Order recorded', text: 'Your order is recorded as pending. You will be notified when payment opens or your order ships.' },
        failed: { icon: XCircle, tone: 'text-[hsl(var(--primary))]', title: 'Payment not completed', text: 'Your payment did not complete. You can retry from the shop checkout.' },
        verifying: { icon: Loader2, tone: 'text-muted-foreground', title: 'Verifying payment…', text: 'We are confirming your payment with Paystack.' },
    }[status] || null;

    const Icon = meta?.icon;

    return (
        <div className="pt-28">
            <Helmet>
                <title>Order confirmation | Pete Edochie Legacy | King Dawie Publishing</title>
                <meta name="description" content="Your order confirmation and payment status on the Pete Edochie Legacy platform." />
            </Helmet>
            <div className="mx-auto max-w-[52rem] px-5 py-12 md:px-10">
                {meta ? (
                    <div className="border border-border bg-card p-8 md:p-10">
                        <Icon size={36} strokeWidth={1.4} className={`${meta.tone} ${status === 'verifying' ? 'animate-spin' : ''}`} />
                        <h1 className="mt-5 font-display text-4xl">{meta.title}</h1>
                        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{meta.text}</p>

                        {order ? (
                            <div className="mt-8 border-t border-border pt-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className="text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">Reference</p>
                                        <p className="mt-1 font-mono text-sm">{order.payment_reference || reference}</p>
                                    </div>
                                    {order.created ? (
                                        <div>
                                            <p className="text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">Order date</p>
                                            <p className="mt-1 text-sm">{fmtDate(order.created)}</p>
                                        </div>
                                    ) : null}
                                    {order.email ? (
                                        <div>
                                            <p className="text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">Email</p>
                                            <p className="mt-1 text-sm">{order.email}</p>
                                        </div>
                                    ) : null}
                                    <div>
                                        <p className="text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">Payment status</p>
                                        <p className="mt-1 text-sm capitalize">{order.payment_status || status}</p>
                                    </div>
                                    {order.order_status ? (
                                        <div>
                                            <p className="text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">Order status</p>
                                            <p className="mt-1 text-sm capitalize">{order.order_status}</p>
                                        </div>
                                    ) : null}
                                </div>

                                {items.length > 0 ? (
                                    <ul className="mt-6 divide-y divide-border">
                                        {items.map((it) => (
                                            <li key={it.id} className="flex items-center justify-between py-4 text-sm">
                                                <span className="text-muted-foreground">{it.product_name} × {it.quantity}</span>
                                                <span className="text-foreground">{formatUSD(it.total_price)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : order.items_summary ? (
                                    <p className="mt-6 text-sm text-muted-foreground">{order.items_summary}</p>
                                ) : null}

                                {order.total_price != null ? (
                                    <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
                                        <span className="text-[0.66rem] uppercase tracking-[0.22em] text-muted-foreground">Total</span>
                                        <span className="font-display text-3xl text-[hsl(var(--gold))]">{formatUSD(order.total_price)}</span>
                                    </div>
                                ) : null}

                                {order.fulfillment_method ? (
                                    <div className="mt-4">
                                        <p className="text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">Fulfilment</p>
                                        <p className="mt-1 text-sm capitalize">{fulfillmentLabel(order.fulfillment_method)}</p>
                                    </div>
                                ) : null}

                                {order.fulfillment_method === 'distributor_collection' && collectionDetails ? (
                                    <div className="mt-6 border-t border-border pt-6">
                                        <DistributorPanel
                                            details={collectionDetails}
                                            countryName={countryName(order.country || order.shipping_address?.country)}
                                        />
                                    </div>
                                ) : order.shipping_address && typeof order.shipping_address === 'object' && order.shipping_address.address_line ? (
                                    <div className="mt-6 border-t border-border pt-6">
                                        <p className="text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">Shipping to</p>
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            {order.shipping_address.full_name}<br />
                                            {order.shipping_address.address_line}<br />
                                            {order.shipping_address.city}{order.shipping_address.region ? `, ${order.shipping_address.region}` : ''}<br />
                                            {order.shipping_address.country}{order.shipping_address.postal_code ? ` ${order.shipping_address.postal_code}` : ''}
                                        </p>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}

                        <div className="mt-8 flex flex-wrap gap-4">
                            {isAuthed ? (
                                <Link to="/dashboard" className="border border-[hsl(var(--gold))]/60 px-6 py-3 text-[0.66rem] uppercase tracking-[0.22em] text-[hsl(var(--gold))]">
                                    View in dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        to={`/join?next=${encodeURIComponent('/dashboard')}${order?.email ? `&email=${encodeURIComponent(order.email)}` : ''}`}
                                        className="border border-[hsl(var(--gold))]/60 px-6 py-3 text-[0.66rem] uppercase tracking-[0.22em] text-[hsl(var(--gold))]"
                                    >
                                        Unlock order dashboard
                                    </Link>
                                    <Link
                                        to={`/track-order${order?.email ? `?email=${encodeURIComponent(order.email)}` : ''}${reference ? `&reference=${encodeURIComponent(reference)}` : ''}`}
                                        className="border border-border px-6 py-3 text-[0.66rem] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground"
                                    >
                                        Track without account
                                    </Link>
                                </>
                            )}
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

export default OrderPage;
