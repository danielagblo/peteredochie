import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, FileText, Gauge, Globe2, Loader2, Mail, Package, Tag, ShoppingCart } from 'lucide-react';
import DashboardShell, { EmptyState, Panel, Stat } from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/contexts/AuthContext';
import { PUBLISHER } from '@/lib/content';
import { apiCrud } from '@/lib/api';
import { initializeDistributorOrder, formatUSD } from '@/lib/commerce';

const NAV = [
    { key: 'overview', label: 'Overview', icon: Gauge },
    { key: 'pricing', label: 'Pricing', icon: Tag },
    { key: 'territories', label: 'Territories', icon: Globe2 },
    { key: 'orders', label: 'Orders', icon: Package },
    { key: 'performance', label: 'Performance', icon: BarChart3 },
    { key: 'resources', label: 'Resources', icon: FileText },
    { key: 'contact', label: 'Contact publisher', icon: Mail },
];

const DistributorDashboard = () => {
    const { user } = useAuth();
    const approved = user?.approval_status === 'approved';

    const [tiers, setTiers] = useState([]);
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [productId, setProductId] = useState('');
    const [tierId, setTierId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const [tierList, productList] = await Promise.all([
                    apiCrud.list('distributor-tiers', { filter: 'enabled = true', sort: 'sort' }),
                    apiCrud.list('products', { filter: 'enabled = true', sort: 'name' }),
                ]);
                setTiers(tierList);
                setProducts(productList.filter((p) => Number(p.price) > 0));
            } catch (_) {
                /* ignore */
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        if (!user?.id) return;
        apiCrud
            .list('orders', { filter: `owner = "${user.id}"`, sort: '-created' })
            .then(setOrders)
            .catch(() => setOrders([]));
    }, [user]);

    const product = products.find((p) => p.id === productId);
    const tier = tiers.find((t) => t.id === tierId);
    const qty = Math.max(parseInt(quantity, 10) || 0, 0);
    const retail = Number(product?.price) || 0;
    const discount = Number(tier?.discount) || 0;
    const unitPrice = retail > 0 ? Math.round(retail * (1 - discount / 100) * 100) / 100 : 0;
    const totalPrice = Math.round(unitPrice * qty * 100) / 100;

    const placeOrder = async (e) => {
        e.preventDefault();
        setError('');
        if (!productId || !tierId || qty <= 0 || !approved) return;
        if (tier?.min_units && qty < tier.min_units) {
            setError(`This tier requires a minimum of ${tier.min_units} units.`);
            return;
        }
        if (tier?.max_units && qty > tier.max_units) {
            setError(`This tier is limited to a maximum of ${tier.max_units} units.`);
            return;
        }
        setPlacing(true);
        try {
            const result = await initializeDistributorOrder({
                product_id: productId,
                quantity: qty,
                tier_id: tierId,
                email: user?.email,
                country: user?.country || '',
                return_origin: window.location.origin,
            });
            if (result?.authorization_url) {
                window.location.assign(result.authorization_url);
                return;
            }
            // Not configured: order recorded as pending.
            window.location.href = '/dashboard';
        } catch (err) {
            setError(err?.message || 'Could not start your distributor order.');
            setPlacing(false);
        }
    };

    return (
        <DashboardShell
            title="Distributor dashboard | King Dawie Publishing"
            description="Distributor pricing, assigned territories, orders, performance metrics and downloadable trade resources from King Dawie Publishing."
            nav={approved ? NAV : [{ key: 'overview', label: 'Overview', icon: Gauge }]}
        >
            {(tab) => (
                <>
                    {!approved ? (
                        <div className="border border-[hsl(var(--primary))]/40 bg-[hsl(var(--primary))]/5 px-6 py-6 text-sm text-muted-foreground">
                            Your distributor application is under review by {PUBLISHER.name}. Pricing, resources, territories and ordering all unlock once your account is approved. Contact the publisher for updates.
                        </div>
                    ) : null}

                    {approved ? (
                        <>
                    {tab === 'overview' ? (
                        <div className="grid gap-4 sm:grid-cols-3">
                            <Stat label="Open orders" value={String(orders.filter((o) => o.payment_status === 'paid' && o.order_status !== 'delivered').length)} hint="Awaiting fulfilment" />
                            <Stat label="Orders placed" value={String(orders.length)} hint="Lifetime" />
                            <Stat label="Territories" value={user?.territory ? 1 : 0} hint={user?.territory || 'None assigned yet'} />
                        </div>
                    ) : null}

                    {tab === 'pricing' ? (
                        <div className="space-y-8">
                            <Panel title="Distributor pricing" lead="Trade pricing applies to the official autobiography and companion editions.">
                                <div className="divide-y divide-border border border-border">
                                    {tiers.length === 0 && loading ? (
                                        <div className="px-6 py-8 text-sm text-muted-foreground">Loading pricing tiers…</div>
                                    ) : (
                                        tiers.map((t) => (
                                            <div key={t.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
                                                <p className="font-display text-xl">{t.name}</p>
                                                <p className="text-sm text-[hsl(var(--gold))]">{t.discount}% off retail</p>
                                                {t.min_units && t.max_units ? (
                                                    <p className="text-xs text-muted-foreground">{t.min_units}–{t.max_units} units</p>
                                                ) : t.min_units ? (
                                                    <p className="text-xs text-muted-foreground">{t.min_units}+ units</p>
                                                ) : null}
                                                <p className="text-xs text-muted-foreground">{t.terms || ''}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </Panel>

                            <Panel title="Place a bulk order" lead="Select a product, quantity and pricing tier to see your trade price and pay online.">
                                <form onSubmit={placeOrder} className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <label className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Product</label>
                                            <select value={productId} onChange={(e) => setProductId(e.target.value)}
                                                className="border border-border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[hsl(var(--gold))]">
                                                <option value="">Select a title</option>
                                                {products.map((p) => (
                                                    <option key={p.id} value={p.id}>{p.name} — {formatUSD(p.price)}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Pricing tier</label>
                                            <select value={tierId} onChange={(e) => setTierId(e.target.value)}
                                                className="border border-border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[hsl(var(--gold))]">
                                                <option value="">Select a tier</option>
                                                {tiers.map((t) => (
                                                    <option key={t.id} value={t.id}>{t.name} — {t.discount}% off</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Quantity</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={quantity}
                                                onChange={(e) => setQuantity(e.target.value)}
                                                className="border border-border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[hsl(var(--gold))]"
                                                placeholder="e.g. 100"
                                            />
                                        </div>
                                        <div className="grid gap-2 content-center">
                                            {retail > 0 ? (
                                                <p className="text-sm text-muted-foreground">
                                                    Unit price <span className="text-foreground">{formatUSD(unitPrice)}</span>
                                                    {discount > 0 ? <span className="ml-2 line-through">{formatUSD(retail)}</span> : null}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">Select a product to see pricing.</p>
                                            )}
                                        </div>
                                    </div>

                                    {totalPrice > 0 ? (
                                        <div className="flex flex-wrap items-center justify-between gap-4 border border-border bg-[hsl(var(--gold))]/5 px-6 py-4">
                                            <p className="font-display text-2xl">{formatUSD(totalPrice)} <span className="text-xs text-muted-foreground">for {qty} units</span></p>
                                            <button
                                                type="submit"
                                                disabled={placing}
                                                className="flex items-center gap-2 bg-[hsl(var(--primary))] px-8 py-3.5 text-[0.66rem] uppercase tracking-[0.22em] text-[hsl(var(--primary-foreground))] disabled:opacity-60"
                                            >
                                                {placing ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />}
                                                Pay online
                                            </button>
                                        </div>
                                    ) : null}
                                    {error ? <p className="text-sm text-[hsl(var(--primary))]">{error}</p> : null}
                                </form>
                            </Panel>
                        </div>
                    ) : null}

                    {tab === 'territories' ? (
                        <Panel title="Assigned markets" lead="Territories are assigned per city or region and reviewed each quarter.">
                            {user?.territory ? (
                                <div className="border border-border px-6 py-5">
                                    <p className="font-display text-2xl">{user.territory}</p>
                                    <p className="mt-2 text-xs text-muted-foreground">Active</p>
                                </div>
                            ) : (
                                <EmptyState>No territory assigned yet. Request one from the publisher.</EmptyState>
                            )}
                        </Panel>
                    ) : null}

                    {tab === 'orders' ? (
                        <Panel title="Distributor orders" lead="Purchase orders, invoices and shipment tracking.">
                            {orders.length === 0 ? (
                                <EmptyState>No orders yet. Place your first bulk order from the Pricing tab.</EmptyState>
                            ) : (
                                <div className="divide-y divide-border border border-border">
                                    {orders.map((o) => (
                                        <div key={o.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{o.payment_reference || o.id.slice(0, 8)}</p>
                                                <p className="mt-1 text-sm">{o.items_summary || '—'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-display text-lg">{formatUSD(o.total_price)}</p>
                                                <p className="mt-1 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">{o.payment_status || 'pending'} · {o.order_status || 'pending'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Panel>
                    ) : null}

                    {tab === 'performance' ? (
                        <Panel title="Performance" lead="Sell-through, returns and reorder cadence across your markets.">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <Stat label="Sell-through" value="—" />
                                <Stat label="Reorder rate" value="—" />
                                <Stat label="Returns" value="—" />
                            </div>
                        </Panel>
                    ) : null}

                    {tab === 'resources' ? (
                        <Panel title="Trade resources" lead="Sales sheets, cover artwork and retail display guidance.">
                            <ul className="divide-y divide-border border border-border">
                                {['Trade sales sheet (PDF)', 'Cover artwork pack', 'Retail display guide', 'Order form template'].map((r) => (
                                    <li key={r} className="flex items-center justify-between gap-4 px-6 py-4 text-sm">
                                        <span>{r}</span>
                                        <span className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Available on request</span>
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                    ) : null}

                    {tab === 'contact' ? (
                        <Panel title={`Contact ${PUBLISHER.name}`} lead="Trade enquiries, territory changes and credit terms.">
                            <Link to="/contact" className="inline-block border border-border px-8 py-3.5 text-[0.66rem] uppercase tracking-[0.22em] hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]">
                                Open the enquiry form
                            </Link>
                        </Panel>
                    ) : null}
                        </>
                    ) : null}
                </>
            )}
        </DashboardShell>
    );
};

export default DistributorDashboard;
