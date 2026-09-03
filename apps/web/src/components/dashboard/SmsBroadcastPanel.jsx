import React, { useState, useEffect } from 'react';
import {
    Smartphone, Send, CheckCircle2, RefreshCw,
    AlertCircle, ShieldAlert
} from 'lucide-react';
import { api } from '@/lib/api';
import { Panel, Stat } from '@/components/dashboard/DashboardShell';

const SmsBroadcastPanel = () => {
    const [smsStatus, setSmsStatus] = useState(null);
    const [loadingStatus, setLoadingStatus] = useState(true);

    const [form, setForm] = useState({
        message: '',
    });

    const [isSending, setIsSending] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const loadStatus = async () => {
        setLoadingStatus(true);
        try {
            const data = await api.get('/sms/status');
            setSmsStatus(data);
        } catch (_) {
            /* ignore */
        } finally {
            setLoadingStatus(false);
        }
    };

    useEffect(() => {
        loadStatus();
    }, []);

    // Standard GSM character calculation
    const charCount = form.message.length;
    const smsSegments = charCount === 0 ? 1 : charCount <= 160 ? 1 : Math.ceil(charCount / 153);
    const totalRecipients = smsStatus?.audience?.allUsers ?? 0;

    // Broadcast SMS to audience
    const handleBroadcast = async () => {
        if (!form.message.trim()) {
            setFeedback({ type: 'error', message: 'Please write an SMS message before broadcasting.' });
            return;
        }

        setIsSending(true);
        setFeedback(null);
        setShowConfirmModal(false);

        try {
            const res = await api.post('/sms/send', {
                message: form.message,
                targetAudience: 'all_users',
                targetCountry: 'all',
                isTest: false,
            });
            setFeedback({
                type: 'success',
                message: res.message || `SMS broadcast dispatched to ${res.sentCount || 0} recipient(s).`,
            });
            setForm({ message: '' });
            loadStatus();
        } catch (err) {
            setFeedback({
                type: 'error',
                message: err.message || 'Could not complete SMS broadcast.',
            });
        } finally {
            setIsSending(false);
        }
    };

    const inputClasses = 'w-full border border-border bg-card text-foreground px-4 py-3 text-sm outline-none transition-colors focus:border-[hsl(var(--gold))]';

    return (
        <div className="space-y-8">
            {/* 1. Header & Live Gateway Status */}
            <div className="border border-border bg-card/40 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="eyebrow flex items-center gap-2">
                            <Smartphone size={14} className="text-[hsl(var(--gold))]" />
                            Arkesel SMS Gateway
                        </p>
                        <h2 className="mt-1 font-display text-2xl">Direct SMS Broadcast</h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Send instant bulk SMS alerts, tour updates, and priority notifications directly to phones via Arkesel.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {loadingStatus ? (
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <RefreshCw size={12} className="animate-spin" /> Checking gateway…
                            </span>
                        ) : smsStatus?.configured ? (
                            <div className="flex items-center gap-2 border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1.5 text-xs text-emerald-400">
                                <CheckCircle2 size={13} />
                                <span>Sender ID: <strong>{smsStatus.senderId}</strong> (Live)</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 border border-amber-500/40 bg-amber-500/10 px-3.5 py-1.5 text-xs text-amber-300">
                                <AlertCircle size={13} />
                                <span>Dev Simulation Mode</span>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={loadStatus}
                            title="Refresh gateway status"
                            className="border border-border p-2 text-muted-foreground transition-colors hover:text-foreground hover:border-[hsl(var(--gold))]"
                        >
                            <RefreshCw size={13} />
                        </button>
                    </div>
                </div>

                {/* Counter Stat */}
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Stat
                        label="Available Contacts (with Phone)"
                        value={smsStatus?.audience?.allUsers ?? '—'}
                        hint="Platform accounts with phone number"
                    />
                    <Stat
                        label="Distributor Contacts"
                        value={smsStatus?.audience?.distributors ?? '—'}
                        hint="Wholesale partner network"
                    />
                    <Stat
                        label="Sponsor Contacts"
                        value={smsStatus?.audience?.sponsors ?? '—'}
                        hint="Corporate partner contacts"
                    />
                </div>
            </div>

            {/* 2. Feedback Alert */}
            {feedback && (
                <div className={`flex items-start gap-3 border p-4 text-sm ${feedback.type === 'success'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-red-500/40 bg-red-500/10 text-red-300'
                }`}>
                    {feedback.type === 'success' ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <ShieldAlert size={16} className="mt-0.5 shrink-0" />}
                    <div className="flex-1">
                        <p>{feedback.message}</p>
                    </div>
                    <button type="button" onClick={() => setFeedback(null)} className="text-muted-foreground hover:text-foreground">
                        &times;
                    </button>
                </div>
            )}

            {/* 3. Clean Compose Box */}
            <Panel title="Compose SMS Message" lead="Type your text message below to send an instant SMS broadcast.">
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center justify-between">
                            <label className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">
                                SMS Message Text
                            </label>
                            <div className="text-[0.68rem] text-muted-foreground flex items-center gap-3">
                                <span>Characters: <strong className={charCount > 160 ? 'text-[hsl(var(--gold))]' : 'text-foreground'}>{charCount}</strong> / 160</span>
                                <span>Segments: <strong>{smsSegments} SMS</strong></span>
                            </div>
                        </div>
                        <textarea
                            rows={6}
                            value={form.message}
                            onChange={(e) => setForm({ ...form, message: e.target.value })}
                            placeholder="Pete Edochie Legacy: We are thrilled to announce the Ghana Launch Tour dates! Tickets are now live at peteredochie.com/events."
                            className={`${inputClasses} mt-1.5 font-mono text-sm leading-relaxed`}
                        />
                        <p className="mt-2 text-[0.68rem] text-muted-foreground">
                            Standard SMS messages up to 160 characters count as 1 unit. Longer messages automatically concatenate.
                        </p>
                    </div>

                    <div className="border-t border-border pt-6">
                        <button
                            type="button"
                            disabled={isSending || !form.message.trim()}
                            onClick={() => setShowConfirmModal(true)}
                            className="flex items-center justify-center gap-2 bg-[hsl(var(--primary))] px-8 py-4 text-[0.68rem] uppercase tracking-[0.24em] text-white font-medium shadow-md transition-all hover:brightness-110 disabled:opacity-40"
                        >
                            <Send size={14} /> Send SMS Broadcast
                        </button>
                    </div>
                </div>
            </Panel>

            {/* 4. Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg border border-border bg-card p-6 shadow-2xl">
                        <div className="flex items-center gap-3 text-[hsl(var(--gold))]">
                            <Smartphone size={22} />
                            <h3 className="font-display text-xl">Confirm SMS Broadcast</h3>
                        </div>

                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                            You are about to dispatch this live SMS message to phone contacts via Arkesel.
                        </p>

                        <div className="my-4 border border-border bg-secondary/30 p-4 text-xs font-mono">
                            <p className="text-muted-foreground mb-1">Message Preview ({charCount} chars, {smsSegments} segment/recipient):</p>
                            <p className="text-foreground whitespace-pre-wrap">{form.message}</p>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                className="border border-border px-5 py-2.5 text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isSending}
                                onClick={handleBroadcast}
                                className="bg-[hsl(var(--primary))] px-6 py-2.5 text-[0.62rem] uppercase tracking-[0.2em] text-white font-medium hover:brightness-110"
                            >
                                {isSending ? 'Sending…' : 'Yes, Send SMS Broadcast'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmsBroadcastPanel;
