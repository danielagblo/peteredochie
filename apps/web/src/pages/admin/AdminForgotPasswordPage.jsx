import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { api } from '@/lib/api';

const field =
    'w-full border border-border bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[hsl(var(--gold))]';

const AdminForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            await api.post('/auth/request-password-reset', { email });
            setSent(true);
        } catch (_) {
            setError('We could not send a reset link. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-5 py-24">
            <Helmet>
                <title>Reset Admin Password | King Dawie Publishing</title>
                <meta
                    name="description"
                    content="Reset your King Dawie Publishing admin portal password."
                />
            </Helmet>
            <div className="w-full max-w-md">
                <p className="eyebrow">Staff access</p>
                <h1 className="mt-4 font-display text-5xl">Reset password</h1>
                {sent ? (
                    <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                        If an admin account exists for that email, a password reset link is on
                        its way. Check your inbox and follow the link to set a new password.
                    </p>
                ) : (
                    <form onSubmit={submit} className="mt-8 space-y-5">
                        <div className="grid gap-2">
                            <label
                                htmlFor="fp-email"
                                className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground"
                            >
                                Admin email
                            </label>
                            <input
                                id="fp-email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={field}
                            />
                        </div>
                        {error ? (
                            <p className="text-sm text-[hsl(var(--destructive))]">{error}</p>
                        ) : null}
                        <button
                            type="submit"
                            disabled={busy}
                            className="w-full bg-[hsl(var(--primary))] py-4 text-[0.7rem] uppercase tracking-[0.24em] text-white disabled:opacity-60"
                        >
                            {busy ? 'Sending…' : 'Send reset link'}
                        </button>
                    </form>
                )}
                <p className="mt-10 text-sm text-muted-foreground">
                    <Link to="/admin/login" className="text-[hsl(var(--gold))]">
                        Back to admin sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default AdminForgotPasswordPage;
