import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LAUNCH } from '@/lib/content';

const UNIT_LABELS = [
    { key: 'days', label: 'Days' },
    { key: 'hours', label: 'Hours' },
    { key: 'minutes', label: 'Minutes' },
    { key: 'seconds', label: 'Seconds' },
];

function getRemaining(targetMs) {
    const diff = Math.max(0, targetMs - Date.now());
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return { days, hours, minutes, seconds, done: diff <= 0 };
}

const LaunchCountdown = ({ target = LAUNCH.activationAt }) => {
    const targetMs = new Date(target).getTime();
    const [remaining, setRemaining] = useState(() => getRemaining(targetMs));

    useEffect(() => {
        setRemaining(getRemaining(targetMs));
        const id = window.setInterval(() => setRemaining(getRemaining(targetMs)), 1000);
        return () => window.clearInterval(id);
    }, [targetMs]);

    return (
        <section className="border-b border-border bg-[hsl(var(--primary))] text-white">
            <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-8 px-5 py-8 md:flex-row md:items-center md:justify-between md:px-10 md:py-10">
                <div className="max-w-md">
                    <p className="text-[0.62rem] uppercase tracking-[0.24em] text-white/60">{LAUNCH.headline}</p>
                    <h2 className="mt-2 font-display text-2xl md:text-3xl">
                        {remaining.done ? 'The Legacy Experience is live' : 'Countdown to The Legacy Experience'}
                    </h2>
                    <p className="mt-2 text-sm text-white/70">
                        {LAUNCH.activationCity} · {LAUNCH.activationDate}
                        {LAUNCH.venue ? ` · ${LAUNCH.venue}` : ''}
                    </p>
                </div>

                <div className="grid grid-cols-4 gap-3 sm:gap-5">
                    {UNIT_LABELS.map(({ key, label }) => (
                        <div key={key} className="min-w-[4.25rem] border border-white/20 bg-white/[0.08] px-3 py-3 text-center sm:min-w-[5rem] sm:px-4 sm:py-4">
                            <p className="font-display text-2xl tabular-nums text-white sm:text-4xl">
                                {String(remaining[key]).padStart(2, '0')}
                            </p>
                            <p className="mt-1 text-[0.58rem] uppercase tracking-[0.18em] text-white/70">{label}</p>
                        </div>
                    ))}
                </div>

                <Link
                    to="/events"
                    className="shrink-0 border border-white/50 px-6 py-3 text-center text-[0.66rem] uppercase tracking-[0.22em] text-white transition-colors hover:border-white hover:bg-white/10"
                >
                    View launch events
                </Link>
            </div>
        </section>
    );
};

export default LaunchCountdown;
