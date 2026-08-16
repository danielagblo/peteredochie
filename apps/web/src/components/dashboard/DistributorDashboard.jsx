import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, FileText, Gauge, Globe2, Mail, Package, Tag } from 'lucide-react';
import DashboardShell, { EmptyState, Panel, Stat } from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/contexts/AuthContext';
import { PUBLISHER } from '@/lib/content';

const NAV = [
    { key: 'overview', label: 'Overview', icon: Gauge },
    { key: 'pricing', label: 'Pricing', icon: Tag },
    { key: 'territories', label: 'Territories', icon: Globe2 },
    { key: 'orders', label: 'Orders', icon: Package },
    { key: 'performance', label: 'Performance', icon: BarChart3 },
    { key: 'resources', label: 'Resources', icon: FileText },
    { key: 'contact', label: 'Contact publisher', icon: Mail },
];

const TIERS = [
    { name: 'Tier 1 — 50 to 249 units', discount: '35% off retail', terms: 'Payment on order' },
    { name: 'Tier 2 — 250 to 999 units', discount: '42% off retail', terms: '30-day terms on approval' },
    { name: 'Tier 3 — 1,000+ units', discount: '50% off retail', terms: 'Negotiated terms and freight support' },
];

const DistributorDashboard = () => {
    const { user } = useAuth();
    const approved = user?.approval_status === 'approved';

    return (
        <DashboardShell
            title="Distributor dashboard | King Dawie Publishing"
            description="Distributor pricing, assigned territories, orders, performance metrics and downloadable trade resources from King Dawie Publishing."
            nav={NAV}
        >
            {(tab) => (
                <>
                    {!approved ? (
                        <div className="border border-[hsl(var(--primary))]/40 bg-[hsl(var(--primary))]/5 px-6 py-5 text-sm text-muted-foreground">
                            Your distributor application is under review by {PUBLISHER.name}. Pricing and ordering unlock once approved.
                        </div>
                    ) : null}

                    {tab === 'overview' ? (
                        <div className="grid gap-4 sm:grid-cols-3">
                            <Stat label="Open orders" value="0" hint="Awaiting fulfilment" />
                            <Stat label="Units shipped" value="0" hint="Lifetime" />
                            <Stat label="Territories" value={user?.territory ? 1 : 0} hint={user?.territory || 'None assigned yet'} />
                        </div>
                    ) : null}

                    {tab === 'pricing' ? (
                        <Panel title="Distributor pricing" lead="Trade pricing applies to the official autobiography and companion editions.">
                            <div className="divide-y divide-border border border-border">
                                {TIERS.map((t) => (
                                    <div key={t.name} className="flex flex-wrap items-center justify-between gap-4 px-6 py-5">
                                        <p className="font-display text-xl">{t.name}</p>
                                        <p className="text-sm text-[hsl(var(--gold))]">{t.discount}</p>
                                        <p className="text-xs text-muted-foreground">{t.terms}</p>
                                    </div>
                                ))}
                            </div>
                        </Panel>
                    ) : null}

                    {tab === 'territories' ? (
                        <Panel title="Assigned markets" lead="Territories are assigned per city or region and reviewed each quarter.">
                            {user?.territory ? (
                                <div className="border border-border px-6 py-5">
                                    <p className="font-display text-2xl">{user.territory}</p>
                                    <p className="mt-2 text-xs text-muted-foreground">{approved ? 'Active' : 'Requested — pending approval'}</p>
                                </div>
                            ) : (
                                <EmptyState>No territory assigned yet. Request one from the publisher.</EmptyState>
                            )}
                        </Panel>
                    ) : null}

                    {tab === 'orders' ? (
                        <Panel title="Distributor orders" lead="Purchase orders, invoices and shipment tracking.">
                            <EmptyState>No orders yet.</EmptyState>
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
                                        <span className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                                            {approved ? 'Available on request' : 'Locked until approval'}
                                        </span>
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
            )}
        </DashboardShell>
    );
};

export default DistributorDashboard;
