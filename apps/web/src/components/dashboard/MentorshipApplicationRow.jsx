import React from 'react';
import { REGISTRATION_TYPES, registrationTypeLabel } from '@/lib/mentorship';

const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const Detail = ({ label, value }) => (
    <div>
        <p className="text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm text-foreground">{value || '—'}</p>
    </div>
);

const MentorshipApplicationRow = ({
    application: a,
    input,
    smallBtn,
    dangerBtn,
    onAccept,
    onReject,
    onRegistrationTypeChange,
    compact = false,
}) => {
    const acceptId = `accept-type-${a.id}`;
    const requested = registrationTypeLabel(a.requested_type || 'standard');
    const assigned = a.registration_type ? registrationTypeLabel(a.registration_type) : null;
    const accountName = a.expand?.owner?.name || a.expand?.owner?.email;

    if (compact) {
        return (
            <li className="flex flex-wrap items-start justify-between gap-4 py-4">
                <div>
                    <p className="font-display text-lg">{a.name || a.email}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {a.email} · {a.country || 'Country not set'} · {a.discipline || 'Discipline not set'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {a.cohort || '2027'} cohort · Requested {requested}
                    </p>
                </div>
                <span className="text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">
                    {a.status || 'pending'}
                </span>
            </li>
        );
    }

    return (
        <li className="py-6">
            <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="max-w-3xl flex-1">
                    <p className="font-display text-2xl">{a.name || a.email}</p>
                    <p className="mt-2 text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">
                        Submitted {fmtDate(a.created)} · {a.status || 'pending'}
                    </p>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                        <Detail label="Full name" value={a.name} />
                        <Detail label="Email" value={a.email} />
                        <Detail label="Country" value={a.country} />
                        <Detail label="Discipline" value={a.discipline} />
                        <Detail label="Cohort" value={a.cohort || '2027'} />
                        <Detail label="Requested registration type" value={requested} />
                        <Detail label="Assigned registration type" value={assigned} />
                        <Detail label="Linked account" value={accountName} />
                    </div>

                    <div className="mt-6">
                        <p className="text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">
                            Why this programme
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                            {a.statement || '—'}
                        </p>
                    </div>
                </div>

                <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:min-w-[12rem] sm:items-end">
                    <span className="text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground sm:text-right">
                        {a.status || 'pending'}
                    </span>
                    {a.status === 'accepted' ? (
                        <select
                            value={a.registration_type || a.requested_type || 'standard'}
                            onChange={(e) => onRegistrationTypeChange(a.id, e.target.value)}
                            className={`${input} max-w-full sm:max-w-[12rem]`}
                        >
                            {REGISTRATION_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    ) : (
                        <select
                            id={acceptId}
                            defaultValue={a.registration_type || a.requested_type || 'standard'}
                            className={`${input} max-w-full sm:max-w-[12rem]`}
                        >
                            {REGISTRATION_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    )}
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <button
                            type="button"
                            onClick={() => {
                                const sel = document.getElementById(acceptId);
                                onAccept(a.id, sel?.value);
                            }}
                            className={smallBtn}
                            disabled={a.status === 'accepted'}
                        >
                            Accept
                        </button>
                        <button
                            type="button"
                            onClick={() => onReject(a.id)}
                            className={dangerBtn}
                            disabled={a.status === 'rejected'}
                        >
                            Reject
                        </button>
                    </div>
                </div>
            </div>
        </li>
    );
};

export default MentorshipApplicationRow;
