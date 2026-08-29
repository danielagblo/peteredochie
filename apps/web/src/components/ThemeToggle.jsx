import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle = ({ className = '', compact = false, onDark = false }) => {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const isDark = resolvedTheme === 'dark';
    const label = isDark ? 'Switch to Day Shift (light mode)' : 'Switch to Night Shift (dark mode)';
    const size = compact ? 15 : 16;

    return (
        <button
            type="button"
            aria-label={label}
            aria-pressed={isDark}
            title={label}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={`flex items-center justify-center rounded-full border transition-colors hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))] active:scale-[0.96] ${
                onDark
                    ? 'border-white/30 text-white'
                    : 'border-border text-foreground'
            } ${compact ? 'h-9 w-9' : 'h-10 w-10'} ${className}`}
        >
            {mounted ? (
                isDark ? (
                    <Moon size={size} strokeWidth={1.6} />
                ) : (
                    <Sun size={size} strokeWidth={1.6} />
                )
            ) : (
                <Sun size={size} strokeWidth={1.6} />
            )}
        </button>
    );
};

export default ThemeToggle;
