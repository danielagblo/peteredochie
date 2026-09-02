import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, LayoutDashboard, LogOut } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { ACCOUNT_LABEL } from '@/lib/accounts';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const PortalLayout = ({ children }) => {
    const { user, accountType, logout } = useAuth();
    const navigate = useNavigate();

    const signOut = () => {
        logout();
        navigate('/');
    };

    const greeting = user?.name || user?.email?.split('@')[0] || 'Member';
    const initials = greeting
        .split(/\s+/)
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <div className="grain min-h-screen bg-background text-foreground">
            <header className="fixed inset-x-0 top-0 z-50 h-14 border-b border-border bg-background/95 backdrop-blur-md">
                <div className="flex h-full w-full items-center justify-between px-5 md:px-8">
                    <Link to="/" className="group flex items-baseline gap-3">
                        <span className="font-display text-xl tracking-wide text-foreground md:text-2xl">Pete Edochie</span>
                        <span className="hidden text-[0.6rem] uppercase tracking-[0.3em] text-[hsl(var(--gold))] xl:block">Official Legacy Platform</span>
                    </Link>

                    <div className="flex items-center gap-3 xl:gap-5">
                        <Link
                            to="/"
                            className="hidden items-center gap-2 text-[0.72rem] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground sm:flex"
                        >
                            <ArrowRight size={13} strokeWidth={1.5} className="rotate-180" /> Back to site
                        </Link>
                        <ThemeToggle compact />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="flex items-center gap-2.5 rounded-full border border-border p-1 pr-3 transition-colors hover:bg-secondary/40"
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-[hsl(var(--gold))]/15 text-[0.68rem] font-semibold text-[hsl(var(--gold))]">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="hidden max-w-[10rem] truncate text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground lg:block">
                                        {greeting}
                                    </span>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="flex flex-col gap-0.5">
                                    <span className="font-display text-base text-foreground">{greeting}</span>
                                    <span className="text-[0.62rem] uppercase tracking-[0.18em] text-[hsl(var(--gold))]">{ACCOUNT_LABEL[accountType]}</span>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link to="/dashboard" className="cursor-pointer">
                                        <LayoutDashboard size={15} /> Dashboard
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link to="/" className="cursor-pointer">
                                        <ArrowRight size={15} /> Back to site
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={signOut} className="cursor-pointer">
                                    <LogOut size={15} /> Sign out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>
            <main>{children}</main>
        </div>
    );
};

export default PortalLayout;
