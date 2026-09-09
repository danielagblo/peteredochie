import React from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Building2, Check, Truck, User } from 'lucide-react';
import { PageHead, Section, SectionTitle } from '@/components/Section';
import Reveal from '@/components/Reveal';
import { ACCOUNT_TYPES, ACCOUNT_TYPE_MAP } from '@/lib/accounts';

const ICONS = { user: User, truck: Truck, building: Building2 };

const AccountTypePage = () => {
    const [params] = useSearchParams();
    const type = params.get('type');
    const next = params.get('next');
    const email = params.get('email');
    const suffix = [
        next ? `next=${encodeURIComponent(next)}` : '',
        email ? `email=${encodeURIComponent(email)}` : '',
    ]
        .filter(Boolean)
        .map((p) => `&${p}`)
        .join('');

    if (type && ACCOUNT_TYPE_MAP[type]) {
        return <Navigate to={`/signup?type=${type}${suffix}`} replace />;
    }

    return (
        <div className="pt-32 pb-28">
            <PageHead
                title="Choose your account type | The Pete Edochie Legacy"
                description="Select an account type — General Subscriber, Distributor or Sponsor — before creating your account on the Pete Edochie Legacy platform."
            />
            <Section width="max-w-[84rem]">
                <Link to="/" className="group mb-8 inline-flex items-center gap-2 text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
                    <ArrowLeft size={13} strokeWidth={1.6} className="transition-transform group-hover:-translate-x-1" />
                    Back to Home
                </Link>
                <SectionTitle
                    eyebrow="Create an account"
                    title="Choose how you are joining"
                    lead="Every account type opens a dedicated dashboard built for what you came here to do. You can always contact us later to change it."
                />
                <div className="mt-14 grid gap-6 md:grid-cols-3">
                    {ACCOUNT_TYPES.map((t, i) => {
                        const Icon = ICONS[t.icon] || User;
                        return (
                            <Reveal key={t.value} delay={i * 0.07}>
                                <div className="flex h-full flex-col border border-border bg-card p-8 transition-colors hover:border-[hsl(var(--gold))]/60">
                                    <Icon size={26} strokeWidth={1.2} className="text-[hsl(var(--gold))]" />
                                    <h2 className="mt-6 font-display text-3xl leading-tight">{t.title}</h2>
                                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.description}</p>
                                    <ul className="mt-6 flex-1 space-y-2.5">
                                        {t.can.map((c) => (
                                            <li key={c} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                                                <Check size={15} strokeWidth={1.6} className="mt-1 shrink-0 text-[hsl(var(--gold))]" />
                                                <span>{c}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    {t.note ? (
                                        <p className="mt-6 text-[0.62rem] uppercase tracking-[0.2em] text-[hsl(var(--primary))]">{t.note}</p>
                                    ) : null}
                                    <Link
                                        to={`/signup?type=${t.value}${suffix}`}
                                        className="mt-7 border border-border py-4 text-center text-[0.68rem] uppercase tracking-[0.24em] transition-colors hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]"
                                    >
                                        Continue
                                    </Link>
                                </div>
                            </Reveal>
                        );
                    })}
                </div>
                <p className="mt-12 text-sm text-muted-foreground">
                    Administrator accounts are internal and are issued only by the Super Admin at King Dawie Publishing.
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                    Already have an account? <Link to="/login" className="text-[hsl(var(--gold))]">Sign in</Link>
                </p>
            </Section>
        </div>
    );
};

export default AccountTypePage;
