import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { PageHead } from '@/components/Section';
import { IMG } from '@/lib/content';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

const ForgotPasswordPage = () => {
    const { resetPassword } = useAuth();
    const [params] = useSearchParams();
    const token = params.get('token');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [state, setState] = useState('idle');
    const [error, setError] = useState('');

    const submitRequest = async (e) => {
        e.preventDefault();
        setState('busy');
        try {
            await resetPassword(email);
            setState('sent');
        } catch (_) {
            setState('sent');
        }
    };

    const submitConfirm = async (e) => {
        e.preventDefault();
        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (password !== passwordConfirm) {
            setError('Passwords do not match.');
            return;
        }
        setState('busy');
        setError('');
        try {
            await api.post('/auth/confirm-password-reset', { token, password });
            setState('done');
        } catch (err) {
            setError(err?.message || 'This reset link has expired or is invalid.');
            setState('idle');
        }
    };

    return (
        <div className="grid min-h-screen md:grid-cols-2">
            <PageHead
                title="Reset your password | The Peter Edochie Legacy"
                description="Request a secure password reset link for your Peter Edochie Legacy platform account."
            />
            <div className="flex items-center justify-center px-5 py-32 md:px-16">
                <div className="w-full max-w-md">
                    <Link to="/" className="group mb-8 inline-flex items-center gap-2 text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={13} strokeWidth={1.6} className="transition-transform group-hover:-translate-x-1" />
                        Back to Home
                    </Link>
                    <p className="eyebrow">Account recovery</p>
                    <h1 className="mt-4 font-display text-5xl">Reset password</h1>

                    {token ? (
                        state === 'done' ? (
                            <div className="mt-8 space-y-4">
                                <CheckCircle2 size={36} className="text-[hsl(var(--gold))]" />
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    Your password has been successfully updated. You can now log in with your new password.
                                </p>
                                <div className="pt-2">
                                    <Link
                                        to="/login"
                                        className="inline-block bg-[hsl(var(--primary))] px-8 py-3.5 text-[0.7rem] uppercase tracking-[0.24em] text-white"
                                    >
                                        Sign In Now
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={submitConfirm} className="mt-10 space-y-5">
                                {error ? (
                                    <div className="border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                                        {error}
                                    </div>
                                ) : null}
                                <div className="grid gap-2">
                                    <label htmlFor="f-pass" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">New password</label>
                                    <input
                                        id="f-pass"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[hsl(var(--gold))]"
                                        placeholder="At least 8 characters"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label htmlFor="f-pass-confirm" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Confirm new password</label>
                                    <input
                                        id="f-pass-confirm"
                                        type="password"
                                        required
                                        value={passwordConfirm}
                                        onChange={(e) => setPasswordConfirm(e.target.value)}
                                        className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[hsl(var(--gold))]"
                                        placeholder="Re-enter password"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={state === 'busy'}
                                    className="w-full bg-[hsl(var(--primary))] py-4 text-[0.7rem] uppercase tracking-[0.24em] text-white disabled:opacity-60"
                                >
                                    {state === 'busy' ? 'Updating…' : 'Update password'}
                                </button>
                            </form>
                        )
                    ) : state === 'sent' ? (
                        <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
                            If an account exists for {email}, a reset link is on its way. Check your inbox and spam folder.
                        </p>
                    ) : (
                        <form onSubmit={submitRequest} className="mt-10 space-y-5">
                            <div className="grid gap-2">
                                <label htmlFor="f-email" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Email</label>
                                <input
                                    id="f-email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full border border-border bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[hsl(var(--gold))]"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={state === 'busy'}
                                className="w-full bg-[hsl(var(--primary))] py-4 text-[0.7rem] uppercase tracking-[0.24em] text-white disabled:opacity-60"
                            >
                                {state === 'busy' ? 'Sending…' : 'Send reset link'}
                            </button>
                        </form>
                    )}
                    <p className="mt-8 text-sm text-muted-foreground">
                        <Link to="/login" className="text-[hsl(var(--gold))]">Back to sign in</Link>
                    </p>
                </div>
            </div>
            <div className="relative hidden md:block">
                <img src={IMG.artifact} alt="" className="h-full w-full object-cover" />
                <div className="img-veil absolute inset-0" />
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
