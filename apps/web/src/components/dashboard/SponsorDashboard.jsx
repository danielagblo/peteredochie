import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, CalendarDays, Gauge, Image, Mail, Receipt, ShieldCheck } from 'lucide-react';
import DashboardShell, { EmptyState, Panel, Stat } from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/contexts/AuthContext';
import { PUBLISHER } from '@/lib/content';
import { formatUSD } from '@/lib/commerce';
import { countryName } from '@/lib/countries';
import { apiCrud } from '@/lib/api';

const NAV = [
    { key: 'overview', label: 'Overview', icon: Gauge },
    { key: 'package', label: 'Package', icon: BadgeCheck },
    { key: 'benefits', label: 'Benefits', icon: ShieldCheck },
    { key: 'invoices', label: 'Invoices', icon: Receipt },
    { key: 'assets', label: 'Brand assets', icon: Image },
    { key: 'invitations', label: 'Invitations', icon: CalendarDays },
    { key: 'contact', label: 'Contact', icon: Mail },
];

const TIER_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };

const SponsorDashboard = () => {
    const { user } = useAuth();
    const [sponsorship, setSponsorship] = useState(null);
    const [pkg, setPkg] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) return;
        apiCrud
            .list('sponsorships', { filter: `owner = "${user.id}"` })
            .then((recs) => {
                const rec = recs[0] || null;
                setSponsorship(rec);
                setPkg(rec?.package || null);
            })
            .catch(() => {
                setSponsorship(null);
                setPkg(null);
            })
            .finally(() => setLoading(false));
    }, [user]);

    const approved = sponsorship?.status === 'approved';
    const benefits = Array.isArray(pkg?.benefits) ? pkg.benefits : Array.isArray(sponsorship?.benefits) ? sponsorship.benefits : [];
    const deliverables = Array.isArray(pkg?.deliverables) ? pkg.deliverables : [];

    const downloadInvoice = () => {
        if (!sponsorship) return;
        const body = `KING DAWIE PUBLISHING\nSponsorship Invoice\n\nSponsor: ${sponsorship.company_name}\nContact: ${sponsorship.contact_person}\nEmail: ${sponsorship.email}\nCountry: ${countryName(sponsorship.country)}\n\nPackage: ${pkg?.name || TIER_LABEL[sponsorship.package_tier] || 'Sponsorship'}\nDuration: ${pkg?.duration || '12 months'}\n\nInvestment: ${formatUSD(sponsorship.investment_amount || pkg?.price)}\nPayment status: ${sponsorship.payment_status || 'unpaid'}\nApplication status: ${sponsorship.status || 'pending'}\n\nIssued: ${new Date().toLocaleDateString('en-GB')}\n`;
        const blob = new Blob([body], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sponsorship-invoice-${sponsorship.company_name.replace(/\s+/g, '-').toLowerCase()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <DashboardShell
            title="Sponsor dashboard | King Dawie Publishing"
            description="Sponsorship package details, benefits and deliverables, invoice history, brand assets and event invitations for corporate partners."
            nav={NAV}
        >
            {(tab) => (
                <>
                    {loading ? (
                        <EmptyState>Loading your sponsorship…</EmptyState>
                    ) : !sponsorship ? (
                        <Panel title="No sponsorship on file" lead="You have not submitted a sponsorship application yet.">
                            <p className="text-sm text-muted-foreground">Choose a package and apply to become a corporate partner.</p>
                            <Link to="/sponsor-apply" className="mt-5 inline-block bg-[hsl(var(--primary))] px-8 py-4 text-[0.66rem] uppercase tracking-[0.22em] text-white">
                                Become a sponsor
                            </Link>
                        </Panel>
                    ) : (
                        <>
                            {!approved ? (
                                <div className="border border-[hsl(var(--primary))]/40 bg-[hsl(var(--primary))]/5 px-6 py-5 text-sm text-muted-foreground">
                                    {PUBLISHER.name} is reviewing your partnership request. A partnership director will be in touch shortly.
                                </div>
                            ) : null}

                            {tab === 'overview' ? (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    <Stat label="Sponsorship status" value={sponsorship.status || 'pending'} hint={sponsorship.company_name} />
                                    <Stat label="Package" value={pkg?.name || TIER_LABEL[sponsorship.package_tier] || '—'} hint={pkg?.duration || '12 months'} />
                                    <Stat label="Investment" value={formatUSD(sponsorship.investment_amount || pkg?.price)} hint={sponsorship.currency || 'USD'} />
                                    <Stat label="Payment" value={sponsorship.payment_status || 'unpaid'} hint={approved ? 'Invoice ready' : 'Pending approval'} />
                                </div>
                            ) : null}

                            {tab === 'package' ? (
                                <Panel title="Your sponsorship package" lead={pkg?.duration || '12 months'}>
                                    <div className="border border-border p-6">
                                        <p className="text-[0.6rem] uppercase tracking-[0.22em] text-muted-foreground">{sponsorship.package_tier}</p>
                                        <p className="mt-2 font-display text-3xl">{pkg?.name || TIER_LABEL[sponsorship.package_tier] || 'Sponsorship'}</p>
                                        <p className="mt-2 text-sm text-[hsl(var(--gold))]">{formatUSD(sponsorship.investment_amount || pkg?.price)} · {pkg?.duration || '12 months'}</p>
                                        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{pkg?.description || 'Package details will be confirmed on approval.'}</p>
                                        <dl className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
                                            <div><dt className="text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">Company</dt><dd className="mt-1 text-sm">{sponsorship.company_name}</dd></div>
                                            <div><dt className="text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">Contact</dt><dd className="mt-1 text-sm">{sponsorship.contact_person}</dd></div>
                                            <div><dt className="text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">Email</dt><dd className="mt-1 text-sm">{sponsorship.email}</dd></div>
                                            <div><dt className="text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">Country</dt><dd className="mt-1 text-sm">{countryName(sponsorship.country)}</dd></div>
                                        </dl>
                                    </div>
                                </Panel>
                            ) : null}

                            {tab === 'benefits' ? (
                                <Panel title="Benefits & deliverables" lead="Tracked commitments for your current partnership term.">
                                    <div className="grid gap-8 md:grid-cols-2">
                                        <div>
                                            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-[hsl(var(--gold))]">Benefits</p>
                                            <ul className="mt-4 space-y-3">
                                                {benefits.length === 0 ? <EmptyState>No benefits listed yet.</EmptyState> : benefits.map((b) => (
                                                    <li key={b} className="flex items-start gap-3 text-sm text-muted-foreground">
                                                        <BadgeCheck size={15} strokeWidth={1.6} className="mt-1 shrink-0 text-[hsl(var(--gold))]" />
                                                        <span>{b}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Deliverables</p>
                                            <ul className="mt-4 space-y-3">
                                                {deliverables.length === 0 ? <EmptyState>No deliverables listed yet.</EmptyState> : deliverables.map((d) => (
                                                    <li key={d} className="flex items-start gap-3 text-sm text-muted-foreground">
                                                        <span className="mt-2 h-px w-4 shrink-0 bg-border" />
                                                        <span>{d}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </Panel>
                            ) : null}

                            {tab === 'invoices' ? (
                                <Panel title="Invoice history" lead="Download invoices and track payment status for your sponsorship.">
                                    <div className="border border-border p-6">
                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                            <div>
                                                <p className="font-display text-2xl">{pkg?.name || TIER_LABEL[sponsorship.package_tier] || 'Sponsorship'}</p>
                                                <p className="mt-1 text-xs text-muted-foreground">{pkg?.duration || '12 months'}</p>
                                                <p className="mt-2 text-sm text-[hsl(var(--gold))]">{formatUSD(sponsorship.investment_amount || pkg?.price)}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`border px-3 py-1.5 text-[0.58rem] uppercase tracking-[0.18em] ${sponsorship.payment_status === 'paid' ? 'border-[hsl(var(--gold))]/50 text-[hsl(var(--gold))]' : 'border-border text-muted-foreground'}`}>
                                                    {sponsorship.payment_status || 'unpaid'}
                                                </span>
                                                <button type="button" onClick={downloadInvoice} className="border border-border px-4 py-2 text-[0.58rem] uppercase tracking-[0.18em] hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]">
                                                    Download invoice
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </Panel>
                            ) : null}

                            {tab === 'assets' ? (
                                <Panel title="Brand assets" lead="Approved logos, lockups and usage guidance for co-branded materials.">
                                    <ul className="divide-y divide-border border border-border">
                                        {['Legacy logo pack', 'Co-branding guidelines', 'Event key art', 'Meet & Greet signage templates'].map((a) => (
                                            <li key={a} className="flex items-center justify-between gap-4 px-6 py-4 text-sm">
                                                <span>{a}</span>
                                                <span className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                                                    {approved ? 'Available on request' : 'Locked until approval'}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </Panel>
                            ) : null}

                            {tab === 'invitations' ? (
                                <Panel title="Event invitations" lead="Premieres, receptions and Meet & Greet allocations included in your package.">
                                    {approved ? (
                                        <EmptyState>Your VIP allocations will appear here once the tour schedule is confirmed.</EmptyState>
                                    ) : (
                                        <EmptyState>Invitations are unlocked once your sponsorship is approved.</EmptyState>
                                    )}
                                </Panel>
                            ) : null}

                            {tab === 'contact' ? (
                                <Panel title="Contact King Dawie Publishing" lead="Reach the partnership team directly.">
                                    <dl className="grid gap-4 sm:grid-cols-2">
                                        <div><dt className="text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">Partnership office</dt><dd className="mt-1 font-display text-lg text-[hsl(var(--gold))]">{PUBLISHER.name}</dd></div>
                                        <div><dt className="text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">Email</dt><dd className="mt-1 text-sm">{PUBLISHER.email}</dd></div>
                                    </dl>
                                    <Link to="/contact" className="mt-6 inline-block border border-[hsl(var(--gold))]/60 px-8 py-4 text-[0.66rem] uppercase tracking-[0.22em] text-[hsl(var(--gold))] transition-colors hover:bg-[hsl(var(--gold))] hover:text-black">
                                        Send a message
                                    </Link>
                                </Panel>
                            ) : null}
                        </>
                    )}
                </>
            )}
        </DashboardShell>
    );
};

export default SponsorDashboard;
