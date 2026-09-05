import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { PageHead } from '@/components/Section';
import { IMG } from '@/lib/content';
import { useAuth } from '@/contexts/AuthContext';

const field =
    'w-full border border-border bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[hsl(var(--gold))]';

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const next = params.get('next') || '/dashboard';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(true);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            await login(email, password, remember);
            navigate(next, { replace: true });
        } catch (err) {
            setError(err?.status === 400 ? 'Those details do not match an account.' : 'We could not sign you in. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="grid min-h-screen md:grid-cols-2">
            <PageHead
                title="Sign in | The Peter Edochie Legacy"
                description="Sign in to your Peter Edochie Legacy account to access tickets, orders, the screening room and your dashboard."
            />
            <div className="relative hidden md:block">
                <img src={IMG.portrait} alt="" className="h-full w-full object-cover object-[center_18%]" />
                <div className="img-veil absolute inset-0" />
                <div className="absolute bottom-12 left-10 right-10">
                    <p className="font-display text-4xl leading-tight text-white">A legacy is only alive if it is handed on.</p>
                </div>
            </div>
            <div className="flex items-center justify-center px-5 py-32 md:px-16">
                <div className="w-full max-w-md">
                    <Link to="/" className="group mb-8 inline-flex items-center gap-2 text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={13} strokeWidth={1.6} className="transition-transform group-hover:-translate-x-1" />
                        Back to Home
                    </Link>
                    <p className="eyebrow">Members</p>
                    <h1 className="mt-4 font-display text-5xl">Sign in</h1>
                    <form onSubmit={submit} className="mt-10 space-y-5">
                        <div className="grid gap-2">
                            <label htmlFor="l-email" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Email</label>
                            <input id="l-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="l-pass" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Password</label>
                            <input id="l-pass" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
                        </div>
                        <div className="flex items-center justify-between gap-4 text-sm">
                            <label htmlFor="l-remember" className="flex items-center gap-3 text-muted-foreground">
                                <input
                                    id="l-remember"
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    className="h-4 w-4 accent-[hsl(var(--primary))]"
                                />
                                Remember me
                            </label>
                            <Link to="/forgot-password" className="text-[hsl(var(--gold))]">Forgot password?</Link>
                        </div>
                        {error ? <p className="text-sm text-[hsl(var(--destructive))]">{error}</p> : null}
                        <button
                            type="submit"
                            disabled={busy}
                            className="w-full bg-[hsl(var(--primary))] py-4 text-[0.7rem] uppercase tracking-[0.24em] text-white transition-transform active:scale-[0.99] disabled:opacity-60"
                        >
                            {busy ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>

                    <div className="mt-10 space-y-4 border-t border-border pt-8 text-sm text-muted-foreground">
                        <p>
                            No account yet?{' '}
                            <Link to={`/join${next !== '/dashboard' ? `?next=${encodeURIComponent(next)}` : ''}`} className="text-[hsl(var(--gold))]">
                                Create an account
                            </Link>
                        </p>
                        <div className="flex items-start gap-2.5">
                            <Mail size={15} strokeWidth={1.4} className="mt-1 shrink-0 text-[hsl(var(--gold))]" />
                            <div>
                                <Link to="/#subscribe" className="text-[hsl(var(--gold))] hover:underline block">
                                    Continue as a subscriber
                                </Link>
                                <span className="block mt-0.5 text-xs text-muted-foreground">
                                    Newsletter only, no account needed.
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
