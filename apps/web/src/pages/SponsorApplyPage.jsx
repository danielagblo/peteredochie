import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Check, Send } from 'lucide-react';
import { PageHead, Section, SectionTitle } from '@/components/Section';
import { useAuth } from '@/contexts/AuthContext';
import { formatUSD, initializeSponsorship } from '@/lib/commerce';
import { COUNTRIES } from '@/lib/countries';
import { apiCrud } from '@/lib/api';
import { composeWhatsApp, openWhatsApp } from '@/lib/whatsapp';

const field = 'w-full border border-border bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[hsl(var(--gold))]';

const SponsorApplyPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [existing, setExisting] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        company_name: user?.organisation || '',
        industry: '',
        contact_person: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        website: '',
        country: 'GH',
        package_tier: '',
        message: '',
    });

    useEffect(() => {
        apiCrud
            .list('sponsorship-packages', { filter: `enabled = true`, sort: 'sort' })
            .then(setPackages)
            .catch(() => setPackages([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!user?.id) return;
        apiCrud
            .list('sponsorships', { filter: `owner = "${user.id}"` })
            .then((items) => setExisting(items[0] || null))
            .catch(() => setExisting(null));
    }, [user]);

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.company_name || !form.contact_person || !form.email || !form.package_tier) {
            setError('Please complete company name, contact person, email and chosen package.');
            return;
        }
        const pkg = packages.find((p) => p.tier === form.package_tier);
        setSubmitting(true);
        try {
            const result = await initializeSponsorship({
                company_name: form.company_name,
                industry: form.industry,
                contact_person: form.contact_person,
                email: form.email,
                phone: form.phone,
                website: form.website,
                country: form.country,
                package_id: pkg?.id || '',
                package_tier: form.package_tier,
                message: form.message,
                return_origin: window.location.origin,
            });
            if (result?.authorization_url) {
                window.location.assign(result.authorization_url);
                return;
            }
            // Paystack not configured yet — record kept as pending; also open
            // WhatsApp so the partnership team still receives the enquiry.
            openWhatsApp(
                composeWhatsApp('Sponsorship application', {
                    Company: form.company_name,
                    Industry: form.industry,
                    Contact: form.contact_person,
                    Email: form.email,
                    Phone: form.phone,
                    Website: form.website,
                    Country: form.country,
                    Package: pkg?.name || form.package_tier,
                    Message: form.message,
                }),
            );
            setDone(true);
        } catch (err) {
            setError(err?.message || 'Could not start your sponsorship application. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (done || (existing && existing.payment_status === 'paid')) {
        const rec = existing || {};
        return (
            <div className="pt-32 pb-28">
                <PageHead
                    title="Sponsorship application received | The Pete Edochie Legacy"
                    description="Your sponsorship application has been received and is under review by King Dawie Publishing."
                />
                <Section width="max-w-[48rem]">
                    <div className="border border-border bg-card p-10 text-center">
                        <Check size={40} strokeWidth={1.2} className="mx-auto text-[hsl(var(--gold))]" />
                        <h1 className="mt-6 font-display text-4xl">Application received</h1>
                        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                            {existing ? 'Your sponsorship application is already on file.' : 'Your sponsorship application was recorded. A partnership director at King Dawie Publishing will review and contact you.'} You can also track status from your sponsor dashboard.
                        </p>
                        <p className="mt-4 text-[0.62rem] uppercase tracking-[0.2em] text-[hsl(var(--gold))]">
                            Status: {rec.status || 'pending'} · Payment: {rec.payment_status || 'unpaid'}
                        </p>
                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            <Link to="/dashboard" className="bg-[hsl(var(--primary))] px-8 py-4 text-[0.68rem] uppercase tracking-[0.22em] text-white">Go to dashboard</Link>
                            <Link to="/sponsors" className="border border-border px-8 py-4 text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground">Back to sponsors</Link>
                        </div>
                    </div>
                </Section>
            </div>
        );
    }

    if (existing) {
        const rec = existing;
        const onResume = async () => {
            setError('');
            setSubmitting(true);
            try {
                const result = await initializeSponsorship({
                    sponsorship_id: rec.id,
                    company_name: rec.company_name,
                    contact_person: rec.contact_person,
                    email: rec.email,
                    package_id: typeof rec.package === 'object' ? rec.package?.id : rec.package_id,
                    package_tier: rec.package_tier,
                    return_origin: window.location.origin,
                });
                if (result?.authorization_url) {
                    window.location.assign(result.authorization_url);
                    return;
                }
                setDone(true);
            } catch (err) {
                setError(err?.message || 'Could not start payment. Please try again.');
            } finally {
                setSubmitting(false);
            }
        };
        return (
            <div className="pt-32 pb-28">
                <PageHead
                    title="Resume sponsorship payment | The Pete Edochie Legacy"
                    description="Finish payment for your pending sponsorship application."
                />
                <Section width="max-w-[48rem]">
                    <div className="border border-border bg-card p-10 text-center">
                        <Loader2 size={40} strokeWidth={1.2} className="mx-auto text-[hsl(var(--gold))]" />
                        <h1 className="mt-6 font-display text-4xl">Resume payment</h1>
                        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                            You have a sponsorship application on file for <span className="text-foreground">{rec.company_name}</span> that is not yet paid.
                            Complete payment to confirm your partnership.
                        </p>
                        <p className="mt-4 text-[0.62rem] uppercase tracking-[0.2em] text-[hsl(var(--gold))]">
                            Investment: {formatUSD(rec.investment_amount)} · Status: {rec.payment_status || 'unpaid'}
                        </p>
                        {error ? <p className="mt-4 text-xs text-[hsl(var(--primary))]">{error}</p> : null}
                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            <button type="button" onClick={onResume} disabled={submitting} className="inline-flex items-center gap-2 bg-[hsl(var(--primary))] px-8 py-4 text-[0.68rem] uppercase tracking-[0.22em] text-white disabled:opacity-60">
                                {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
                                {submitting ? 'Starting…' : 'Pay now'}
                            </button>
                            <Link to="/dashboard" className="border border-border px-8 py-4 text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground">Go to dashboard</Link>
                        </div>
                    </div>
                </Section>
            </div>
        );
    }

    return (
        <div className="pt-32 pb-28">
            <PageHead
                title="Become a Sponsor | The Pete Edochie Legacy | King Dawie Publishing"
                description="Apply to become a corporate sponsor or partner of the Pete Edochie Legacy. Choose a package and submit your company details for review by King Dawie Publishing."
            />
            <Section width="max-w-[64rem]">
                <SectionTitle
                    eyebrow="Partnership application"
                    title="Become a sponsor"
                    lead="Choose the package that matches your brand's ambition and tell us about your company. A partnership director at King Dawie Publishing will review and respond."
                />

                {loading ? (
                    <div className="mt-10 flex items-center gap-3 text-sm text-muted-foreground">
                        <Loader2 size={16} className="animate-spin" /> Loading packages…
                    </div>
                ) : (
                    <form onSubmit={submit} className="mt-12 grid gap-8 md:grid-cols-[1fr_1.2fr]">
                        <div className="space-y-3">
                            <p className="eyebrow">Choose a package</p>
                            {packages.map((p) => (
                                <label
                                    key={p.id}
                                    className={`block cursor-pointer border p-5 transition-colors ${form.package_tier === p.tier ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/5' : 'border-border hover:border-[hsl(var(--gold))]/50'}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-display text-2xl">{p.name}</p>
                                            <p className="mt-1 text-sm text-[hsl(var(--gold))]">{formatUSD(p.price)} · {p.duration || '12 months'}</p>
                                        </div>
                                        <input
                                            type="radio"
                                            name="package_tier"
                                            value={p.tier}
                                            checked={form.package_tier === p.tier}
                                            onChange={set('package_tier')}
                                            className="mt-2 h-4 w-4 accent-[hsl(var(--primary))]"
                                        />
                                    </div>
                                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{p.description}</p>
                                </label>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <p className="eyebrow">Company details</p>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2 sm:col-span-2">
                                    <label className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Company name *</label>
                                    <input className={field} required value={form.company_name} onChange={set('company_name')} />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Industry</label>
                                    <input className={field} value={form.industry} onChange={set('industry')} placeholder="Media, Banking, Telecoms…" />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Country</label>
                                    <select className={field} value={form.country} onChange={set('country')}>
                                        {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Contact person *</label>
                                    <input className={field} required value={form.contact_person} onChange={set('contact_person')} />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Email *</label>
                                    <input className={field} type="email" required value={form.email} onChange={set('email')} />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Phone</label>
                                    <input className={field} value={form.phone} onChange={set('phone')} />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Website</label>
                                    <input className={field} type="url" value={form.website} onChange={set('website')} placeholder="https://" />
                                </div>
                                <div className="grid gap-2 sm:col-span-2">
                                    <label className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Message</label>
                                    <textarea className={`${field} min-h-[120px]`} value={form.message} onChange={set('message')} placeholder="Tell us why you would like to partner with the legacy…" />
                                </div>
                            </div>

                            {error ? <p className="text-sm text-[hsl(var(--primary))]">{error}</p> : null}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex items-center justify-center gap-2 bg-[hsl(var(--primary))] px-8 py-4 text-[0.68rem] uppercase tracking-[0.22em] text-white disabled:opacity-60"
                            >
                                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} strokeWidth={1.6} />}
                                Continue to payment
                            </button>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                                You will be redirected to a secure Paystack payment page to confirm your investment. Approval is at the discretion of the partnership team.
                            </p>
                        </div>
                    </form>
                )}
            </Section>
        </div>
    );
};

export default SponsorApplyPage;
