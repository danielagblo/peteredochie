import React, { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHead } from '@/components/Section';
import { IMG } from '@/lib/content';
import { useAuth } from '@/contexts/AuthContext';
import { ACCOUNT_TYPE_MAP, INTEREST_OPTIONS } from '@/lib/accounts';

const field =
    'w-full border border-border bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[hsl(var(--gold))]';

const SignupPage = () => {
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const type = params.get('type');
    const next = params.get('next');
    const emailPrefill = params.get('email') || '';
    const meta = ACCOUNT_TYPE_MAP[type];

    const [form, setForm] = useState({
        name: '',
        email: emailPrefill,
        password: '',
        organisation: '',
        country: '',
        phone: '',
        territory: '',
        newsletter: true,
    });
    const [interests, setInterests] = useState(['General newsletter']);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const roleFor = useMemo(() => ({ subscriber: 'supporter', distributor: 'supporter', sponsor: 'sponsor' }), []);

    if (!meta) return <Navigate to="/join" replace />;

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const toggleInterest = (value) =>
        setInterests((prev) => (prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value]));

    const submit = async (e) => {
        e.preventDefault();
        if (form.password.length < 10) {
            setError('Please use a password of at least 10 characters.');
            return;
        }
        setBusy(true);
        setError('');
        try {
            await signup(form.email, form.password, {
                name: form.name,
                account_type: meta.value,
                role: roleFor[meta.value] || 'supporter',
                organisation: form.organisation,
                country: form.country,
                phone: form.phone,
                territory: form.territory,
                newsletter: form.newsletter,
                interests,
            });
            navigate(next || '/dashboard', { replace: true });
        } catch (err) {
            setError(err?.message || 'We could not create your account. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    const isOrg = meta.value !== 'subscriber';

    return (
        <div className="grid min-h-screen md:grid-cols-2">
            <PageHead
                title={`Create your ${meta.title} account | The Peter Edochie Legacy`}
                description={`Register a ${meta.title} account on the Peter Edochie Legacy platform, operated by King Dawie Publishing.`}
            />
            <div className="flex items-center justify-center px-5 py-32 md:px-16">
                <div className="w-full max-w-md">
                    <Link to="/join" className="group mb-8 inline-flex items-center gap-2 text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={13} strokeWidth={1.6} className="transition-transform group-hover:-translate-x-1" />
                        Back to Join
                    </Link>
                    <p className="eyebrow">{meta.title}</p>
                    <h1 className="mt-4 font-display text-5xl leading-tight">Create your account</h1>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{meta.description}</p>
                    {meta.note ? (
                        <p className="mt-3 text-[0.62rem] uppercase tracking-[0.2em] text-[hsl(var(--primary))]">{meta.note}</p>
                    ) : null}

                    <form onSubmit={submit} className="mt-9 space-y-5">
                        <div className="grid gap-2">
                            <label htmlFor="s-name" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Full name</label>
                            <input id="s-name" required value={form.name} onChange={set('name')} className={field} />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="s-email" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Email</label>
                            <input id="s-email" type="email" required value={form.email} onChange={set('email')} className={field} />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="s-pass" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Password</label>
                            <input id="s-pass" type="password" required value={form.password} onChange={set('password')} className={field} />
                            <p className="text-xs text-muted-foreground">At least 10 characters.</p>
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="s-country" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Country</label>
                            <input id="s-country" value={form.country} onChange={set('country')} className={field} placeholder="Nigeria, Ghana, United Kingdom…" />
                        </div>

                        {isOrg ? (
                            <>
                                <div className="grid gap-2">
                                    <label htmlFor="s-org" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">
                                        {meta.value === 'sponsor' ? 'Company' : 'Business name'}
                                    </label>
                                    <input id="s-org" required value={form.organisation} onChange={set('organisation')} className={field} />
                                </div>
                                <div className="grid gap-2">
                                    <label htmlFor="s-phone" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Phone</label>
                                    <input id="s-phone" value={form.phone} onChange={set('phone')} className={field} />
                                </div>
                            </>
                        ) : null}

                        {meta.value === 'distributor' ? (
                            <div className="grid gap-2">
                                <label htmlFor="s-territory" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Requested territory</label>
                                <input id="s-territory" value={form.territory} onChange={set('territory')} className={field} placeholder="Lagos, Accra, South-East Nigeria…" />
                            </div>
                        ) : null}

                        {meta.value === 'subscriber' ? (
                            <fieldset className="grid gap-3">
                                <legend className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Keep me updated on</legend>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {INTEREST_OPTIONS.map((opt) => (
                                        <label key={opt} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                                            <input
                                                type="checkbox"
                                                checked={interests.includes(opt)}
                                                onChange={() => toggleInterest(opt)}
                                                className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]"
                                            />
                                            {opt}
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                        ) : null}

                        {error ? <p className="text-sm text-[hsl(var(--destructive))]">{error}</p> : null}
                        <button
                            type="submit"
                            disabled={busy}
                            className="w-full bg-[hsl(var(--primary))] py-4 text-[0.7rem] uppercase tracking-[0.24em] text-white disabled:opacity-60"
                        >
                            {busy ? 'Creating…' : 'Create account'}
                        </button>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                            We will email a verification link the moment your account is created. Verify it to unlock ticketing and orders.
                        </p>
                    </form>

                    <p className="mt-8 text-sm text-muted-foreground">
                        Wrong account type? <Link to="/join" className="text-[hsl(var(--gold))]">Choose again</Link> · Already a member?{' '}
                        <Link to="/login" className="text-[hsl(var(--gold))]">Sign in</Link>
                    </p>
                </div>
            </div>
            <div className="relative hidden md:block">
                <img src={IMG.theatre} alt="" className="h-full w-full object-cover" />
                <div className="img-veil absolute inset-0" />
            </div>
        </div>
    );
};

export default SignupPage;
