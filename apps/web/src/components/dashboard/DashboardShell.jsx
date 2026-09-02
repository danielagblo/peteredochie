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
        <div className="min-h-screen pt-14">
            <PageHead title={title} description={description} />
            <div className="flex flex-col md:flex-row">
                {/* Fixed sidebar stuck to the left side and directly under the header */}
                <aside className="fixed left-0 top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-64 flex-col border-r border-border bg-card/85 backdrop-blur-md md:flex">
                    <div className="flex-1 overflow-y-auto overscroll-contain p-4 pb-8 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-[hsl(var(--gold))] [&::-webkit-scrollbar-track]:bg-transparent">
                        <div className="border border-border p-4 bg-background/50">
                            <p className="text-[0.58rem] uppercase tracking-[0.22em] text-muted-foreground">Signed in as</p>
                            <p className="mt-1 font-display text-xl truncate">{greeting}</p>
                            <p className="mt-0.5 text-xs text-[hsl(var(--gold))]">{ACCOUNT_LABEL[accountType]}</p>
                            {status && status !== 'not_required' ? (
                                <p className="mt-2 inline-block border border-border px-2.5 py-0.5 text-[0.55rem] uppercase tracking-[0.18em] text-muted-foreground">
                                    {status === 'approved' ? 'Approved' : status === 'rejected' ? 'Not approved' : 'Awaiting approval'}
                                </p>
                            ) : null}
                            <div className="mt-3 border-t border-border pt-3">
                                <p className="text-[0.55rem] uppercase tracking-[0.2em] text-muted-foreground">Platform operator</p>
                                <p className="mt-0.5 font-display text-sm text-[hsl(var(--gold))]">{PUBLISHER.name}</p>
                            </div>
                        </div>

                        <nav className="mt-4 border border-border bg-background/50">
                            {nav.map(({ key, label, icon: Icon }) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setTab(key)}
                                    className={`flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left text-[0.65rem] uppercase tracking-[0.18em] transition-colors last:border-b-0 ${
                                        tab === key ? 'bg-[hsl(var(--primary))]/15 text-[hsl(var(--gold))] font-semibold' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/30'
                                    }`}
                                >
                                    <Icon size={15} strokeWidth={1.4} className="shrink-0" /> <span className="truncate">{label}</span>
                                </button>
                            ))}
                        </nav>

                        <div className="mt-4 flex items-center justify-between gap-3 border border-border bg-background/50 px-4 py-2.5">
                            <span className="text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">Appearance</span>
                            <ThemeToggle compact />
                        </div>

                        <button
                            type="button"
                            onClick={signOut}
                            className="mt-4 flex w-full items-center gap-3 border border-border bg-background/50 px-4 py-3 text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-[hsl(var(--primary))] hover:border-[hsl(var(--primary))]"
                        >
                            <LogOut size={15} strokeWidth={1.4} /> Sign out
                        </button>
                    </div>
                </aside>

                {/* Mobile Tab Selector (for screens < md) */}
                <div className="w-full border-b border-border bg-card p-4 md:hidden">
                    <label className="text-[0.65rem] uppercase tracking-wider text-muted-foreground block mb-1.5 font-semibold">
                        Navigate Dashboard
                    </label>
                    <select
                        value={tab}
                        onChange={(e) => setTab(e.target.value)}
                        className="w-full border border-border bg-card text-foreground px-3 py-2.5 text-xs outline-none focus:border-[hsl(var(--gold))] cursor-pointer font-medium"
                    >
                        {nav.map(({ key, label }) => (
                            <option key={key} value={key} className="bg-card text-foreground py-1">
                                {label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Main Content Area */}
                <main className="min-w-0 flex-1 px-5 py-8 md:ml-64 md:px-10 lg:px-12">
                    <div className="mx-auto max-w-[88rem] space-y-6">
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
                </main>
            </div>
        </div>
    );
};

export default DashboardShell;
