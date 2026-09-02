import React, { useState } from 'react';
import { Mail, CheckCircle2, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { apiCrud } from '@/lib/api';

const FooterNewsletter = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !email.includes('@')) {
            setStatus('error');
            setMessage('Please enter a valid email address.');
            return;
        }

        setStatus('loading');
        setMessage('');

        try {
            const res = await apiCrud.create('subscribers', {
                email: email.trim().toLowerCase(),
                interests: ['General newsletter', 'Official announcements'],
            });
            setStatus('success');
            setMessage(res?.message || 'Thank you for subscribing to The Pete Edochie Legacy dispatches.');
            setEmail('');
        } catch (err) {
            setStatus('error');
            setMessage(err?.message || 'Could not complete subscription. Please try again.');
        }
    };

    return (
        <div className="border-b border-border bg-card/60 px-5 py-12 md:px-10">
            <div className="mx-auto max-w-[90rem]">
                <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
                    <div className="lg:col-span-6 xl:col-span-7">
                        <p className="eyebrow flex items-center gap-2 text-[hsl(var(--gold))]">
                            <Sparkles size={13} /> Stay Close to the Legacy
                        </p>
                        <h3 className="mt-2 font-display text-2xl sm:text-3xl lg:text-4xl text-foreground font-normal leading-tight">
                            Subscribe to Official Dispatches
                        </h3>
                        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                            Receive direct announcements on autobiography releases, Continental Tour dates, mentorship calls, and historic archives. Delivered straight to your inbox.
                        </p>
                    </div>

                    <div className="lg:col-span-6 xl:col-span-5">
                        {status === 'success' ? (
                            <div className="flex items-start gap-3 border border-[hsl(var(--gold))]/40 bg-[hsl(var(--gold))]/10 p-5">
                                <CheckCircle2 size={20} className="text-[hsl(var(--gold))] shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-display text-lg text-foreground font-medium">You are on the list.</p>
                                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                                        {message}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-2">
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="relative flex-1">
                                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                        <input
                                            type="email"
                                            required
                                            placeholder="Enter your email address..."
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                if (status === 'error') setStatus('idle');
                                            }}
                                            disabled={status === 'loading'}
                                            className="w-full border border-border bg-background/80 pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-[hsl(var(--gold))] disabled:opacity-60"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className="inline-flex items-center justify-center gap-2 bg-[hsl(var(--gold))] px-6 py-3 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[hsl(var(--background))] transition-opacity hover:opacity-90 disabled:opacity-60 shrink-0"
                                    >
                                        {status === 'loading' ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" /> Subscribing...
                                            </>
                                        ) : (
                                            <>
                                                Subscribe <ArrowRight size={14} />
                                            </>
                                        )}
                                    </button>
                                </div>
                                {status === 'error' && (
                                    <p className="text-xs text-[hsl(var(--destructive))]">{message}</p>
                                )}
                                <p className="text-[0.62rem] text-muted-foreground">
                                    No spam. Unsubscribe at any time with one click.
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FooterNewsletter;
