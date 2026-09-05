import React, { useState, useEffect } from 'react';
import {
    Smartphone, Send, CheckCircle2, RefreshCw,
    AlertCircle, ShieldAlert, History, MessageSquare, Clock, Phone
} from 'lucide-react';
import { api } from '@/lib/api';
import { Panel, Stat, EmptyState } from '@/components/dashboard/DashboardShell';

const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

const SmsBroadcastPanel = () => {
    const [subView, setSubView] = useState('compose'); // 'compose' | 'history'
    const [smsStatus, setSmsStatus] = useState(null);
    const [smsLogs, setSmsLogs] = useState([]);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [loadingLogs, setLoadingLogs] = useState(false);

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

    const loadLogs = async () => {
        setLoadingLogs(true);
        try {
            const data = await api.get('/sms/logs');
            setSmsLogs(data?.items || []);
        } catch (_) {
            /* ignore */
        } finally {
            setLoadingLogs(false);
        }
    };

    useEffect(() => {
        loadStatus();
        loadLogs();
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
                context: 'broadcast',
            });
            setFeedback({
                type: 'success',
                message: res.message || `SMS broadcast dispatched to ${res.sentCount || 0} recipient(s).`,
            });
            setForm({ message: '' });
            loadStatus();
            loadLogs();
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
                        <h2 className="mt-1 font-display text-2xl">SMS Center & Sent History</h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Dispatch instant bulk SMS broadcasts and view delivery records of every sent message.
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
                            onClick={() => { loadStatus(); loadLogs(); }}
                            title="Refresh gateway status and logs"
                            className="border border-border p-2 text-muted-foreground transition-colors hover:text-foreground hover:border-[hsl(var(--gold))]"
                        >
                            <RefreshCw size={13} />
                        </button>
                    </div>
                </div>

                {/* Counter Stats */}
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Stat
                        label="Available Phone Contacts"
                        value={smsStatus?.audience?.allUsers ?? '—'}
                        hint="Subscribers, Distributors & Sponsors"
                    />
                    <Stat
                        label="Total SMS Logs Recorded"
                        value={smsStatus?.totalLogsCount ?? smsLogs.length}
                        hint="All-time dispatched messages"
                    />
                    <Stat
                        label="Distributor Partners"
                        value={smsStatus?.audience?.distributors ?? '—'}
                        hint="Wholesale partner network"
                    />
                </div>
            </div>

            {/* Sub-navigation Tabs: Compose vs History */}
            <div className="flex border-b border-border">
                <button
                    type="button"
                    onClick={() => { setSubView('compose'); setFeedback(null); }}
                    className={`flex items-center gap-2 border-b-2 px-6 py-3 text-[0.68rem] uppercase tracking-[0.2em] transition-colors ${
                        subView === 'compose'
                            ? 'border-[hsl(var(--gold))] text-[hsl(var(--gold))] font-semibold'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Send size={14} /> Compose SMS
                </button>
                <button
                    type="button"
                    onClick={() => { setSubView('history'); setFeedback(null); loadLogs(); }}
                    className={`flex items-center gap-2 border-b-2 px-6 py-3 text-[0.68rem] uppercase tracking-[0.2em] transition-colors ${
                        subView === 'history'
                            ? 'border-[hsl(var(--gold))] text-[hsl(var(--gold))] font-semibold'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <History size={14} /> SMS Records & Logs ({smsLogs.length})
                </button>
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

            {/* 3. Compose View */}
            {subView === 'compose' && (
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
                                placeholder="Peter Edochie Legacy: We are thrilled to announce the Ghana Launch Tour dates! Tickets are now live at peteredochie.com/events."
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
                                className="flex items-center justify-center gap-2 bg-[hsl(var(--primary))] px-8 py-4 text-[0.68rem] uppercase tracking-[0.24em] text-[hsl(var(--primary-foreground))] font-medium shadow-md transition-all hover:brightness-110 disabled:opacity-40"
                            >
                                <Send size={14} /> Send SMS Broadcast
                            </button>
                        </div>
                    </div>
                </Panel>
            )}

            {/* 4. Sent History / Logs View */}
            {subView === 'history' && (
                <Panel title="Dispatched SMS Records" lead="Complete chronological audit log of all SMS messages dispatched by the system and administrators.">
                    {loadingLogs ? (
                        <div className="py-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                            <RefreshCw size={14} className="animate-spin" /> Loading SMS logs…
                        </div>
                    ) : smsLogs.length === 0 ? (
                        <EmptyState>No SMS records logged yet. Sent broadcasts and automated alerts will appear here.</EmptyState>
                    ) : (
                        <div className="divide-y divide-border">
                            {smsLogs.map((log) => (
                                <div key={log.id} className="py-4 hover:bg-card/30 transition-colors">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="space-y-1.5 max-w-2xl">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-sm font-semibold text-foreground flex items-center gap-1.5">
                                                    <Phone size={13} className="text-[hsl(var(--gold))]" />
                                                    {log.recipient_phone}
                                                </span>
                                                <span className="rounded bg-secondary px-2 py-0.5 text-[0.58rem] font-mono uppercase tracking-wider text-muted-foreground">
                                                    {log.context || 'broadcast'}
                                                </span>
                                                <span className="text-[0.62rem] text-emerald-400 flex items-center gap-1">
                                                    <CheckCircle2 size={11} /> {log.status || 'sent'}
                                                </span>
                                            </div>
                                            <p className="font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed bg-secondary/30 p-3 rounded border border-border/50">
                                                {log.message}
                                            </p>
                                        </div>

                                        <div className="text-right text-[0.68rem] text-muted-foreground space-y-1">
                                            <p className="flex items-center justify-end gap-1 font-mono">
                                                <Clock size={12} /> {fmtDateTime(log.created_at)}
                                            </p>
                                            <p>Sender: <strong className="text-foreground">{log.sender_id || 'PeteEdochie'}</strong></p>
                                            {log.sent_by?.name ? (
                                                <p>Admin: {log.sent_by.name}</p>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Panel>
            )}

            {/* 5. Confirmation Modal */}
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
                                className="bg-[hsl(var(--primary))] px-6 py-2.5 text-[0.62rem] uppercase tracking-[0.2em] text-[hsl(var(--primary-foreground))] font-medium hover:brightness-110"
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
