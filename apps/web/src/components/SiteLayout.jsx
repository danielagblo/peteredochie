import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, ShoppingCart, X } from 'lucide-react';
import { NAV, PUBLISHER } from '@/lib/content';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

const SiteLayout = ({ children }) => {
    const [open, setOpen] = useState(false);
    const [solid, setSolid] = useState(false);
    const { isAuthed } = useAuth();
    const { count } = useCart();
    const location = useLocation();

    useEffect(() => {
        const onScroll = () => setSolid(window.scrollY > 40);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => setOpen(false), [location.pathname]);

    return (
        <div className="grain min-h-screen bg-background text-foreground">
            <header
                className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
                    solid ? 'bg-background/92 backdrop-blur-md border-b border-border' : 'bg-transparent'
                }`}
            >
                <div className="mx-auto flex max-w-[90rem] items-center justify-between px-5 py-4 md:px-10">
                    <Link to="/" className="group flex items-baseline gap-3">
                        <span className="font-display text-xl tracking-wide text-foreground md:text-2xl">Pete Edochie</span>
                        <span className="hidden text-[0.6rem] uppercase tracking-[0.3em] text-[hsl(var(--gold))] sm:block">
                            Official Legacy Platform
                        </span>
                    </Link>

                    <nav className="hidden items-center gap-7 lg:flex">
                        {NAV.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `text-[0.78rem] uppercase tracking-[0.16em] transition-colors ${
                                        isActive ? 'text-[hsl(var(--gold))]' : 'text-muted-foreground hover:text-foreground'
                                    }`
                                }
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="hidden items-center gap-4 lg:flex">
                        <ThemeToggle compact />
                        <Link
                            to={isAuthed ? '/dashboard' : '/login'}
                            className="text-[0.78rem] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {isAuthed ? 'Dashboard' : 'Sign in'}
                        </Link>
                        <Link
                            to="/checkout"
                            className="relative flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ShoppingCart size={15} strokeWidth={1.5} />
                            {count > 0 ? (
                                <span className="absolute -right-3 -top-2 flex h-4 min-w-4 items-center justify-center bg-[hsl(var(--primary))] px-1 text-[0.5rem] text-white">{count}</span>
                            ) : null}
                        </Link>
                        <Link
                            to="/book"
                            className="border border-[hsl(var(--gold))]/60 px-5 py-2.5 text-[0.7rem] uppercase tracking-[0.22em] text-[hsl(var(--gold))] transition-colors hover:bg-[hsl(var(--gold))] hover:text-black active:scale-[0.98]"
                        >
                            The Autobiography
                        </Link>
                    </div>

                    <button
                        type="button"
                        aria-label={open ? 'Close menu' : 'Open menu'}
                        onClick={() => setOpen((v) => !v)}
                        className="flex h-11 w-11 items-center justify-center text-foreground lg:hidden"
                    >
                        {open ? <X size={22} strokeWidth={1.4} /> : <Menu size={22} strokeWidth={1.4} />}
                    </button>
                </div>

                {open ? (
                    <div className="border-t border-border bg-background/98 px-5 pb-8 pt-4 lg:hidden">
                        <div className="flex flex-col">
                            {[...NAV, { to: '/sponsors', label: 'Sponsors' }, { to: '/contact', label: 'Contact' }].map((item) => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className="border-b border-border/60 py-4 font-display text-2xl text-foreground"
                                >
                                    {item.label}
                                </Link>
                            ))}
                            <div className="mt-6 flex items-center justify-between gap-4">
                                <ThemeToggle />
                                <Link
                                    to={isAuthed ? '/dashboard' : '/login'}
                                    className="flex-1 border border-[hsl(var(--gold))]/60 py-4 text-center text-[0.72rem] uppercase tracking-[0.24em] text-[hsl(var(--gold))]"
                                >
                                    {isAuthed ? 'My dashboard' : 'Sign in'}
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : null}
            </header>

            <main>{children}</main>

            <footer className="border-t border-border bg-[hsl(var(--surface))]">
                <div className="mx-auto grid max-w-[90rem] gap-12 px-5 py-16 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] md:px-10">
                    <div>
                        <p className="font-display text-2xl">Pete Edochie</p>
                        <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                            The official digital home of a life in storytelling — archive, autobiography, events and mentorship.
                        </p>
                        <p className="mt-5 text-[0.66rem] uppercase tracking-[0.22em] text-muted-foreground">
                            Published by
                        </p>
                        <p className="mt-1 font-display text-lg text-[hsl(var(--gold))]">{PUBLISHER.name}</p>
                        <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                            Official owner &amp; rights holder of the Pete Edochie Legacy.
                        </p>
                        <div className="rule-gold mt-6 w-24" />
                    </div>
                    <FooterCol
                        title="Explore"
                        links={[
                            { to: '/pete-edochie', label: 'Biography' },
                            { to: '/legacy', label: 'Legacy archive' },
                            { to: '/gallery', label: 'Gallery' },
                            { to: '/news', label: 'Journal' },
                        ]}
                    />
                    <FooterCol
                        title="Participate"
                        links={[
                            { to: '/events', label: 'Events & tickets' },
                            { to: '/shop', label: 'Shop merchandise' },
                            { to: '/mentorship', label: 'Mentorship' },
                            { to: '/sponsors', label: 'Partnership' },
                            { to: '/join', label: 'Create account' },
                            { to: '/#subscribe', label: 'Subscribe to updates' },
                        ]}
                    />
                    <FooterCol
                        title="Contact"
                        links={[
                            { to: '/contact', label: 'General enquiries' },
                            { to: '/contact', label: 'Media & press' },
                            { to: '/contact', label: 'Publishing & rights' },
                        ]}
                    />
                    <FooterCol
                        title="Legal"
                        links={[
                            { to: '/terms', label: 'Terms of Service' },
                            { to: '/privacy', label: 'Privacy Policy' },
                            { to: '/contact', label: 'Rights inquiries' },
                        ]}
                    />
                </div>
                <div className="border-t border-border/60">
                    <div className="mx-auto flex max-w-[90rem] flex-col gap-2 px-5 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-10">
                        <p>© {new Date().getFullYear()} {PUBLISHER.name}. All rights reserved.</p>
                        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <Link to="/terms" className="transition-colors hover:text-foreground">Terms</Link>
                            <span className="text-border">·</span>
                            <Link to="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
                            <span className="text-border">·</span>
                            <span>Lagos · Enugu · Anambra State, Nigeria</span>
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const FooterCol = ({ title, links }) => (
    <div>
        <p className="eyebrow">{title}</p>
        <ul className="mt-5 space-y-3">
            {links.map((l, i) => (
                <li key={`${l.to}-${i}`}>
                    <Link to={l.to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                        {l.label}
                    </Link>
                </li>
            ))}
        </ul>
    </div>
);

export default SiteLayout;
