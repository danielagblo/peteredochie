import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock, X } from 'lucide-react';
import Reveal from '@/components/Reveal';
import { PageHead, PageHero, Section, SectionTitle } from '@/components/Section';
import { IMG } from '@/lib/content';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { composeWhatsApp, openWhatsApp } from '@/lib/whatsapp';
import { REGISTRATION_TYPES } from '@/lib/mentorship';
import pb from '@/lib/pocketbaseClient';

const PILLARS = [
    ['Craft', 'Voice, stillness, text and the discipline of preparation, taught through live critique.'],
    ['Memory', 'Proverb, oral tradition and research methods for grounding new work in real culture.'],
    ['Practice', 'Contracts, rights, budgets and the unglamorous business of a sustainable creative life.'],
    ['Community', 'A continental cohort that keeps meeting long after the programme closes.'],
];

const STATUS_META = {
    pending: { label: 'Under review', icon: Clock, tone: 'text-[hsl(var(--gold))]' },
    accepted: { label: 'Accepted', icon: Check, tone: 'text-[hsl(var(--gold))]' },
    rejected: { label: 'Not accepted', icon: X, tone: 'text-[hsl(var(--primary))]' },
};

const MentorshipPage = () => {
    const { isAuthed, user } = useAuth();
    const { toast } = useToast();
    const [form, setForm] = useState({ name: '', email: '', country: '', discipline: '', statement: '', requested_type: 'standard' });
    const [sending, setSending] = useState(false);
    const [done, setDone] = useState(false);
    const [existing, setExisting] = useState(null);
    const [loadingExisting, setLoadingExisting] = useState(true);

    useEffect(() => {
        if (!isAuthed) {
            setLoadingExisting(false);
            return;
        }
        pb.collection('mentorship_applications')
            .getFullList({ filter: `owner = "${user.id}"`, sort: '-created' })
            .then((items) => setExisting(items[0] || null))
            .catch(() => setExisting(null))
            .finally(() => setLoadingExisting(false));
    }, [isAuthed, user]);

    const submit = async (e) => {
        e.preventDefault();
        setSending(true);
        openWhatsApp(
            composeWhatsApp('Mentorship application — 2027 cohort', {
                Name: form.name,
                Email: form.email,
                Country: form.country,
                Discipline: form.discipline,
                'Registration type': REGISTRATION_TYPES.find((t) => t.value === form.requested_type)?.label || form.requested_type,
                Statement: form.statement,
            }),
        );
        try {
            await pb.collection('mentorship_applications').create({
                ...form,
                owner: user.id,
                status: 'pending',
                cohort: '2027',
            });
            pb.collection('mentorship_applications')
                .getFullList({ filter: `owner = "${user.id}"`, sort: '-created' })
                .then((items) => setExisting(items[0] || null))
                .catch(() => {});
        } catch (_) {
            /* WhatsApp is the primary channel */
        }
        setDone(true);
        setForm({ name: '', email: '', country: '', discipline: '', statement: '', requested_type: 'standard' });
        toast({ title: 'Opening WhatsApp', description: 'Your application is ready to send to the programme team.' });
        setSending(false);
    };

    const field = 'w-full border border-border bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[hsl(var(--gold))]';

    const statusMeta = existing ? STATUS_META[existing.status || 'pending'] : null;

    return (
        <div>
            <PageHead
                title="African Youth Mentorship Initiative — 2027 Cohort | Pete Edochie"
                description="Apply to the African Youth Mentorship Initiative 2027 cohort: craft, cultural memory, creative business and a continental cohort of young storytellers. An application, not a registration."
            />
            <PageHero eyebrow="Mentorship" title="The African Youth Mentorship Initiative" lead="Two hundred places each cohort, across twelve countries. Applications are read personally by the programme team — this is an application, not a registration." image={IMG.youth} />

            <Section className="grid gap-14 py-24 md:grid-cols-2 md:py-32" width="max-w-[80rem]">
                <div>
                    <SectionTitle eyebrow="The programme" title="What we teach, and why" lead="A six-month structure of workshops, recorded masterclasses, assignments and one-to-one sessions with practising professionals." />
                    <div className="mt-10 divide-y divide-border border-y border-border">
                        {PILLARS.map(([t, d]) => (
                            <div key={t} className="py-6">
                                <p className="font-display text-2xl">{t}</p>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
                            </div>
                        ))}
                    </div>
                    <p className="mt-8 text-xs leading-relaxed text-muted-foreground">
                        The mentorship programme runs independently of the Ghana Launch event. Applying to the 2027 cohort
                        does not require an event ticket, and event attendance does not guarantee a mentorship place.
                    </p>
                </div>

                <Reveal delay={0.1}>
                    <div className="border border-border p-8 md:p-10">
                        <p className="eyebrow">Apply</p>
                        <h2 className="mt-4 font-display text-3xl">2027 cohort application</h2>

                        {!isAuthed ? (
                            <div className="mt-8 border border-[hsl(var(--gold))]/40 p-6">
                                <p className="font-display text-2xl text-[hsl(var(--gold))]">Sign in to apply</p>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Applications are tied to your account so you can track their status from your dashboard.
                                </p>
                                <div className="mt-6 flex flex-col gap-3">
                                    <Link to="/login?next=/mentorship" className="bg-[hsl(var(--primary))] py-4 text-center text-[0.7rem] uppercase tracking-[0.24em] text-white">
                                        Sign in
                                    </Link>
                                    <Link to="/join?next=/mentorship" className="border border-border py-4 text-center text-[0.7rem] uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]">
                                        Create an account
                                    </Link>
                                </div>
                            </div>
                        ) : existing && !done ? (
                            <div className="mt-8 border border-[hsl(var(--gold))]/40 p-6">
                                <p className="font-display text-2xl text-[hsl(var(--gold))]">Application submitted</p>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    You have applied to the {existing.cohort || '2027'} cohort. Track your status from the dashboard.
                                </p>
                                <div className="mt-5 flex items-center gap-3">
                                    {statusMeta ? (
                                        <>
                                            <statusMeta.icon size={16} strokeWidth={1.6} className={statusMeta.tone} />
                                            <span className={`text-[0.66rem] uppercase tracking-[0.2em] ${statusMeta.tone}`}>{statusMeta.label}</span>
                                        </>
                                    ) : null}
                                </div>
                                <Link to="/dashboard" className="mt-6 inline-block text-[0.68rem] uppercase tracking-[0.2em] text-[hsl(var(--gold))]">
                                    Go to dashboard
                                </Link>
                            </div>
                        ) : done ? (
                            <div className="mt-8 border border-[hsl(var(--gold))]/40 p-6">
                                <p className="font-display text-2xl text-[hsl(var(--gold))]">Thank you.</p>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Your application is ready on WhatsApp. The programme team will also follow up by email.
                                </p>
                                <Link to="/dashboard" className="mt-6 inline-block text-[0.68rem] uppercase tracking-[0.2em] text-[hsl(var(--gold))]">
                                    Track your application
                                </Link>
                            </div>
                        ) : loadingExisting ? (
                            <p className="mt-8 text-sm text-muted-foreground">Loading…</p>
                        ) : (
                            <form onSubmit={submit} className="mt-8 space-y-5">
                                <div className="grid gap-2">
                                    <label htmlFor="m-name" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Full name</label>
                                    <input id="m-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
                                </div>
                                <div className="grid gap-2">
                                    <label htmlFor="m-email" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Email</label>
                                    <input id="m-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} />
                                </div>
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <label htmlFor="m-country" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Country</label>
                                        <input id="m-country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={field} />
                                    </div>
                                    <div className="grid gap-2">
                                        <label htmlFor="m-disc" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Discipline</label>
                                        <input id="m-disc" placeholder="Acting, writing, directing…" value={form.discipline} onChange={(e) => setForm({ ...form, discipline: e.target.value })} className={field} />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <label htmlFor="m-type" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Registration type</label>
                                    <select id="m-type" value={form.requested_type} onChange={(e) => setForm({ ...form, requested_type: e.target.value })} className={field}>
                                        {REGISTRATION_TYPES.map((t) => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-muted-foreground">
                                        {REGISTRATION_TYPES.find((t) => t.value === form.requested_type)?.hint}
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <label htmlFor="m-stmt" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Why this programme</label>
                                    <textarea id="m-stmt" required rows={5} value={form.statement} onChange={(e) => setForm({ ...form, statement: e.target.value })} className={field} />
                                </div>
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="w-full bg-[hsl(var(--primary))] py-4 text-[0.7rem] uppercase tracking-[0.24em] text-white transition-transform active:scale-[0.99] disabled:opacity-60"
                                >
                                    {sending ? 'Opening WhatsApp…' : 'Submit via WhatsApp'}
                                </button>
                            </form>
                        )}
                    </div>
                </Reveal>
            </Section>
        </div>
    );
};

export default MentorshipPage;
