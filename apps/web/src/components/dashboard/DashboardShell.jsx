import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, MailCheck } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { PageHead } from '@/components/Section';
import { useAuth } from '@/contexts/AuthContext';
import { ACCOUNT_LABEL } from '@/lib/accounts';
import { PUBLISHER } from '@/lib/content';

export const Panel = ({ title, lead, children, actions }) => (
    <section className="border border-border bg-card p-7 md:p-9">
        <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
                <h2 className="font-display text-2xl md:text-3xl">{title}</h2>
                {lead ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{lead}</p> : null}
            </div>
            {actions}
        </div>
        <div className="mt-6">{children}</div>
    </section>
);

export const Stat = ({ label, value, hint }) => (
    <div className="border border-border p-6">
        <p className="text-[0.6rem] uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
        <p className="mt-3 font-display text-4xl text-[hsl(var(--gold))]">{value}</p>
        {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
);

export const EmptyState = ({ children }) => (
    <p className="border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">{children}</p>
);

const DashboardShell = ({ title, description, nav, children, defaultTab }) => {
    const { user, logout, accountType, isVerified, requestVerification } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState(defaultTab || nav[0]?.key);
    const [verifySent, setVerifySent] = useState(false);

    const signOut = () => {
        logout();
        navigate('/');
    };

    const resend = async () => {
        try {
            await requestVerification(user?.email);
        } catch (_) {
            /* best effort */
        }
        setVerifySent(true);
    };

    const greeting = user?.name || user?.email?.split('@')[0] || 'Member';
    const status = user?.approval_status;

    return (
        <div className="pt-24">
            <PageHead title={title} description={description} />
            <div className="mx-auto grid max-w-[92rem] gap-10 px-5 py-12 md:grid-cols-[16rem_1fr] md:px-10">
                <aside className="md:sticky md:top-28 md:h-fit">
                    <div className="border border-border p-6">
                        <p className="text-[0.6rem] uppercase tracking-[0.22em] text-muted-foreground">Signed in as</p>
                        <p className="mt-2 font-display text-2xl">{greeting}</p>
                        <p className="mt-1 text-xs text-[hsl(var(--gold))]">{ACCOUNT_LABEL[accountType]}</p>
                        {status && status !== 'not_required' ? (
                            <p className="mt-3 inline-block border border-border px-3 py-1 text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">
                                {status === 'approved' ? 'Approved' : status === 'rejected' ? 'Not approved' : 'Awaiting approval'}
                            </p>
                        ) : null}
                        <div className="mt-5 border-t border-border pt-4">
                            <p className="text-[0.58rem] uppercase tracking-[0.2em] text-muted-foreground">Platform operator</p>
                            <p className="mt-1 font-display text-base text-[hsl(var(--gold))]">{PUBLISHER.name}</p>
                        </div>
                    </div>
                    <nav className="mt-4 border border-border">
                        {nav.map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setTab(key)}
                                className={`flex w-full items-center gap-3 border-b border-border px-5 py-4 text-left text-[0.68rem] uppercase tracking-[0.18em] transition-colors last:border-b-0 ${
                                    tab === key ? 'bg-[hsl(var(--primary))]/12 text-[hsl(var(--gold))]' : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Icon size={15} strokeWidth={1.4} /> {label}
                            </button>
                        ))}
                    </nav>
                    <div className="mt-4 flex items-center justify-between gap-3 border border-border px-5 py-3">
                        <span className="text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">Appearance</span>
                        <ThemeToggle compact />
                    </div>
                    <button
                        type="button"
                        onClick={signOut}
                        className="mt-4 flex w-full items-center gap-3 border border-border px-5 py-4 text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-[hsl(var(--primary))]"
                    >
                        <LogOut size={15} strokeWidth={1.4} /> Sign out
                    </button>
                </aside>

                <div className="space-y-6">
                    {!isVerified ? (
                        <div className="flex flex-wrap items-center justify-between gap-4 border border-[hsl(var(--gold))]/40 bg-[hsl(var(--gold))]/5 px-6 py-5">
                            <p className="flex items-center gap-3 text-sm text-muted-foreground">
                                <MailCheck size={16} strokeWidth={1.4} className="text-[hsl(var(--gold))]" />
                                {verifySent
                                    ? 'Verification email sent. Check your inbox to unlock purchases.'
                                    : 'Verify your email address to unlock ticketing, orders and downloads.'}
                            </p>
                            {!verifySent ? (
                                <button
                                    type="button"
                                    onClick={resend}
                                    className="border border-[hsl(var(--gold))]/60 px-5 py-2.5 text-[0.62rem] uppercase tracking-[0.2em] text-[hsl(var(--gold))]"
                                >
                                    Resend link
                                </button>
                            ) : null}
                        </div>
                    ) : null}
                    {children(tab)}
                </div>
            </div>
        </div>
    );
};

export default DashboardShell;
