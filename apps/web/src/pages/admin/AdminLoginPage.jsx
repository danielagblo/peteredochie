import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ShieldCheck } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { PUBLISHER } from '@/lib/content';

const field =
    'w-full border border-border bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[hsl(var(--gold))]';

const AdminLoginPage = () => {
    const { adminLogin } = useAdminAuth();
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const next = params.get('next') || '/admin/dashboard';
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
            await adminLogin(email, password, remember);
            navigate(next, { replace: true });
        } catch (err) {
            setError(
                err?.message === 'NOT_ADMIN'
                    ? 'This account does not have administrator access.'
                    : err?.status === 400
                      ? 'Those details do not match an admin account.'
                      : 'We could not sign you in. Please try again.',
            );
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="grid min-h-screen bg-background md:grid-cols-[1.1fr_1fr]">
            <Helmet>
                <title>Admin Sign in | King Dawie Publishing</title>
                <meta
                    name="description"
                    content="Secure administrator portal for the Peter Edochie Legacy platform — King Dawie Publishing staff and employee management."
                />
            </Helmet>

            <div className="relative hidden flex-col justify-between bg-[hsl(var(--surface))] p-12 md:flex">
                <div className="flex items-center gap-3">
                    <ShieldCheck size={22} strokeWidth={1.4} className="text-[hsl(var(--gold))]" />
                    <span className="font-display text-2xl">Peter Edochie Legacy</span>
                </div>
                <div>
                    <p className="eyebrow">Administration Portal</p>
                    <p className="mt-5 font-display text-5xl leading-tight">
                        The control room for a continental legacy.
                    </p>
                    <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
                        Inventory, orders, sponsorships, mentorship, country operations and
                        employee access — managed by {PUBLISHER.name} staff.
                    </p>
                    <div className="rule-gold mt-8 w-32" />
                </div>
                <p className="text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground">
                    Authorized personnel only
                </p>
            </div>

            <div className="flex items-center justify-center px-5 py-24 md:px-16">
                <div className="w-full max-w-md">
                    <p className="eyebrow">Staff access</p>
                    <h1 className="mt-4 font-display text-5xl">Admin sign in</h1>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                        This portal is restricted to {PUBLISHER.name} administrators and
                        employees. Use your staff credentials to continue.
                    </p>

                    <form onSubmit={submit} className="mt-10 space-y-5">
                        <div className="grid gap-2">
                            <label
                                htmlFor="a-email"
                                className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground"
                            >
                                Email
                            </label>
                            <input
                                id="a-email"
                                type="email"
                                required
                                autoComplete="username"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={field}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label
                                htmlFor="a-pass"
                                className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground"
                            >
                                Password
                            </label>
                            <input
                                id="a-pass"
                                type="password"
                                required
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={field}
                            />
                        </div>
                        <div className="flex items-center justify-between gap-4 text-sm">
                            <label
                                htmlFor="a-remember"
                                className="flex items-center gap-3 text-muted-foreground"
                            >
                                <input
                                    id="a-remember"
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    className="h-4 w-4 accent-[hsl(var(--primary))]"
                                />
                                Remember me
                            </label>
                            <Link
                                to="/admin/forgot-password"
                                className="text-[hsl(var(--gold))]"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        {error ? (
                            <p className="text-sm text-[hsl(var(--destructive))]">{error}</p>
                        ) : null}
                        <button
                            type="submit"
                            disabled={busy}
                            className="w-full bg-[hsl(var(--primary))] py-4 text-[0.7rem] uppercase tracking-[0.24em] text-[hsl(var(--primary-foreground))] transition-transform active:scale-[0.99] disabled:opacity-60"
                        >
                            {busy ? 'Signing in…' : 'Sign in to admin portal'}
                        </button>
                    </form>

                    <div className="mt-10 border-t border-border pt-8 text-sm text-muted-foreground">
                        <p>
                            Not a staff member?{' '}
                            <Link to="/" className="text-[hsl(var(--gold))]">
                                Return to the public site
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;
