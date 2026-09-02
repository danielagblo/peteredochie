import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '@/components/Reveal';
import { apiCrud } from '@/lib/api';
import { INTEREST_OPTIONS } from '@/lib/accounts';
import { composeWhatsApp, openWhatsApp } from '@/lib/whatsapp';

const SubscribeSection = () => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [country, setCountry] = useState('');
    const [interests, setInterests] = useState(['General newsletter', 'Event announcements']);
    const [state, setState] = useState('idle');
    const [message, setMessage] = useState('');

    const toggle = (value) =>
        setInterests((prev) => (prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value]));

    const submit = async (e) => {
        e.preventDefault();
        setState('busy');
        setMessage('');
        openWhatsApp(
            composeWhatsApp('Newsletter subscription', {
                Name: name,
                Email: email,
                Country: country,
                Interests: interests.join(', '),
            }),
        );
        try {
            await apiCrud.create('subscribers', { email, name, country, interests });
        } catch (_) {
            /* WhatsApp is the primary channel */
        }
        setState('done');
    };

    const field =
        'w-full border border-border bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[hsl(var(--gold))]';

    return (
        <section id="subscribe" className="scroll-mt-24 border-y border-border bg-[hsl(var(--surface))] py-24 md:py-32">
            <div className="mx-auto grid w-full max-w-[80rem] gap-14 px-5 md:grid-cols-2 md:px-10">
                <Reveal>
                    <div>
                        <p className="eyebrow">Stay close to the legacy</p>
                        <h2 className="mt-4 font-display text-4xl leading-tight md:text-5xl">Subscribe for updates</h2>
                        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                            No account required. Receive event announcements, Meet & Greet news, book launch news,
                            mentorship programme calls and future country launches across Africa — first, and directly.
                        </p>
                        <p className="mt-6 text-sm text-muted-foreground">
                            Want tickets, orders and a dashboard?{' '}
                            <Link to="/join" className="text-[hsl(var(--gold))]">Create a full account</Link>.
                        </p>
                    </div>
                </Reveal>
                <Reveal delay={0.08}>
                    {state === 'done' ? (
                        <div className="border border-[hsl(var(--gold))]/40 p-9">
                            <p className="font-display text-3xl">You are on the list.</p>
                            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                                WhatsApp should have opened with your details. Updates will also be noted for {email}.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={submit} className="space-y-5 border border-border p-8">
                            <div className="grid gap-2">
                                <label htmlFor="sub-name" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Name</label>
                                <input id="sub-name" value={name} onChange={(e) => setName(e.target.value)} className={field} />
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="sub-email" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Email</label>
                                <input id="sub-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="sub-country" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Country</label>
                                <input id="sub-country" value={country} onChange={(e) => setCountry(e.target.value)} className={field} />
                            </div>
                            <fieldset className="grid gap-2">
                                <legend className="mb-2 text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Send me</legend>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {INTEREST_OPTIONS.map((opt) => (
                                        <label key={opt} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                                            <input
                                                type="checkbox"
                                                checked={interests.includes(opt)}
                                                onChange={() => toggle(opt)}
                                                className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]"
                                            />
                                            {opt}
                                        </label>
                                    ))}
                                </div>
                            </fieldset>
                            {state === 'error' ? <p className="text-sm text-[hsl(var(--destructive))]">{message}</p> : null}
                            <button
                                type="submit"
                                disabled={state === 'busy'}
                                className="w-full bg-[hsl(var(--primary))] py-4 text-[0.7rem] uppercase tracking-[0.24em] text-white disabled:opacity-60"
                            >
                                {state === 'busy' ? 'Opening WhatsApp…' : 'Subscribe via WhatsApp'}
                            </button>
                        </form>
                    )}
                </Reveal>
            </div>
        </section>
    );
};

export default SubscribeSection;
