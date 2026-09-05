import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { PageHead } from '@/components/Section';
import { api, authStore } from '@/lib/api';

const VerifyEmailPage = () => {
    const [params] = useSearchParams();
    const token = params.get('token');
    const [status, setStatus] = useState('verifying'); // verifying | success | error
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMsg('No verification token provided in this link.');
            return;
        }

        let mounted = true;
        api.post('/auth/verify-email', { token })
            .then((res) => {
                if (!mounted) return;
                if (res?.user) {
                    authStore.updateRecord({ verified: true, ...res.user });
                }
                setStatus('success');
            })
            .catch((err) => {
                if (!mounted) return;
                setStatus('error');
                setErrorMsg(err?.message || 'This verification link is invalid or has expired.');
            });

        return () => {
            mounted = false;
        };
    }, [token]);

    return (
        <div className="flex min-h-screen items-center justify-center px-5 py-24">
            <PageHead
                title="Verify Email | The Peter Edochie Legacy"
                description="Verify your email address on The Peter Edochie Legacy platform."
            />
            <div className="w-full max-w-md border border-border bg-card p-8 md:p-10 text-center">
                {status === 'verifying' ? (
                    <div className="space-y-4">
                        <Loader2 size={36} className="mx-auto animate-spin text-[hsl(var(--gold))]" />
                        <h1 className="font-display text-2xl">Verifying your email</h1>
                        <p className="text-sm text-muted-foreground">Please wait while we confirm your email address…</p>
                    </div>
                ) : null}

                {status === 'success' ? (
                    <div className="space-y-4">
                        <CheckCircle2 size={40} className="mx-auto text-[hsl(var(--gold))]" />
                        <h1 className="font-display text-3xl">Email verified</h1>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            Thank you! Your email address has been successfully verified. You now have full access to ticket passes, orders, and dashboard features.
                        </p>
                        <div className="pt-4">
                            <Link
                                to="/dashboard"
                                className="inline-flex items-center gap-2 bg-[hsl(var(--primary))] px-8 py-3.5 text-[0.7rem] uppercase tracking-[0.2em] text-[hsl(var(--primary-foreground))]"
                            >
                                Continue to Dashboard <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>
                ) : null}

                {status === 'error' ? (
                    <div className="space-y-4">
                        <XCircle size={40} className="mx-auto text-destructive" />
                        <h1 className="font-display text-3xl">Verification failed</h1>
                        <p className="text-sm leading-relaxed text-muted-foreground">{errorMsg}</p>
                        <div className="pt-4 space-y-3">
                            <Link
                                to="/dashboard"
                                className="block border border-border py-3 text-center text-[0.68rem] uppercase tracking-[0.2em] text-foreground hover:border-[hsl(var(--gold))]"
                            >
                                Return to Dashboard
                            </Link>
                            <Link
                                to="/"
                                className="block text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
                            >
                                Back to Home
                            </Link>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default VerifyEmailPage;
