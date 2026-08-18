import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHead } from '@/components/Section';
import { IMG } from '@/lib/content';
import { useAuth } from '@/contexts/AuthContext';

const ForgotPasswordPage = () => {
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [state, setState] = useState('idle');

    const submit = async (e) => {
        e.preventDefault();
        setState('busy');
        try {
            await resetPassword(email);
            setState('sent');
        } catch (_) {
            setState('sent');
        }
    };

    return (
        <div className="grid min-h-screen md:grid-cols-2">
            <PageHead
                title="Reset your password | The Pete Edochie Legacy"
                description="Request a secure password reset link for your Pete Edochie Legacy platform account."
            />
            <div className="flex items-center justify-center px-5 py-32 md:px-16">
                <div className="w-full max-w-md">
                    <Link to="/" className="group mb-8 inline-flex items-center gap-2 text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={13} strokeWidth={1.6} className="transition-transform group-hover:-translate-x-1" />
                        Back to Home
                    </Link>
                    <p className="eyebrow">Account recovery</p>
                    <h1 className="mt-4 font-display text-5xl">Reset password</h1>
                    {state === 'sent' ? (
                        <p className="mt-8 text-sm leading-relaxed text-muted-foreground">
                            If an account exists for {email}, a reset link is on its way. Check your inbox and spam folder.
                        </p>
                    ) : (
                        <form onSubmit={submit} className="mt-10 space-y-5">
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
