import React, { useState, useEffect } from 'react';
import {
    Smartphone, Send, Users, ShieldAlert, CheckCircle2,
    RefreshCw, AlertCircle, Sparkles, MessageSquare, Phone
} from 'lucide-react';
import { api } from '@/lib/api';
import { Panel, Stat, EmptyState } from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/contexts/AuthContext';

const SmsBroadcastPanel = ({ countries = [] }) => {
    const { user } = useAuth();
    const [smsStatus, setSmsStatus] = useState(null);
    const [loadingStatus, setLoadingStatus] = useState(true);

    const [form, setForm] = useState({
        message: '',
        targetAudience: 'all_subscribers', // 'all_subscribers' | 'distributors' | 'sponsors' | 'all_users'
        targetCountry: 'all',
        testPhone: user?.phone || '0557609106',
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

    const targetAudienceLabel = {
        all_subscribers: 'Newsletter Subscribers (with Phone)',
        distributors: 'Approved Distributors',
        sponsors: 'Corporate Sponsors',
        all_users: 'All Registered Platform Users',
    }[form.targetAudience] || 'Audience';

    const estimatedRecipients = smsStatus?.audience?.[
        form.targetAudience === 'all_subscribers' ? 'subscribers' :
        form.targetAudience === 'distributors' ? 'distributors' :
        form.targetAudience === 'sponsors' ? 'sponsors' : 'allUsers'
    ] || 0;

    // Send single test SMS
    const handleSendTest = async () => {
        if (!form.message.trim()) {
            setFeedback({ type: 'error', message: 'Please write an SMS message before sending a test.' });
            return;
        }
        if (!form.testPhone.trim()) {
            setFeedback({ type: 'error', message: 'Please provide a test phone number.' });
            return;
        }

        setIsSending(true);
        setFeedback(null);
        try {
            const res = await api.post('/sms/send', {
                message: form.message,
                isTest: true,
                testPhone: form.testPhone,
            });
            setFeedback({
                type: 'success',
                message: res.message || `Test SMS dispatched to ${form.testPhone}`,
            });
        } catch (err) {
            setFeedback({
                type: 'error',
                message: err.message || 'Could not send test SMS.',
            });
        } finally {
            setIsSending(false);
        }
    };

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
                targetAudience: form.targetAudience,
                targetCountry: form.targetCountry,
                isTest: false,
            });
            setFeedback({
                type: 'success',
                message: res.message || `SMS broadcast dispatched to ${res.sentCount || 0} recipient(s).`,
            });
            setForm((prev) => ({ ...prev, message: '' }));
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

    const inputClasses = 'w-full border border-border bg-card text-foreground px-4 py-2.5 text-sm outline-none transition-colors focus:border-[hsl(var(--gold))] [&>option]:bg-card [&>option]:text-foreground';

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

                {/* Quick Audience Counter Stats */}
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Stat
                        label="Subscribers (SMS Ready)"
                        value={smsStatus?.audience?.subscribers ?? '—'}
                        hint="Newsletter contacts with phone"
                    />
                    <Stat
                        label="Distributors"
                        value={smsStatus?.audience?.distributors ?? '—'}
                        hint="Wholesale partner network"
                    />
                    <Stat
                        label="Sponsors"
                        value={smsStatus?.audience?.sponsors ?? '—'}
                        hint="Corporate partner contacts"
                    />
                    <Stat
                        label="All Accounts (with Phone)"
                        value={smsStatus?.audience?.allUsers ?? '—'}
                        hint="Full platform directory"
                    />
                </div>
            </div>

            {/* 2. Feedback Alert */}
            {feedback && (
                <div className={`flex items-start gap-3 border p-4 text-sm ${
                    feedback.type === 'success'
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

            {/* 3. Compose SMS Grid */}
            <div className="grid gap-8 lg:grid-cols-12">
                {/* Left Column: Editor & Controls (7 cols) */}
                <div className="space-y-6 lg:col-span-7">
                    <Panel title="Compose SMS Broadcast" lead="Draft your SMS message and configure target audience filters.">
                        <div className="space-y-5">
                            {/* Audience Target */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Target Audience</label>
                                    <select
                                        value={form.targetAudience}
                                        onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                                        className={`${inputClasses} mt-1`}
                                    >
                                        <option value="all_subscribers">Newsletter Subscribers ({smsStatus?.audience?.subscribers ?? 0})</option>
                                        <option value="distributors">Distributors ({smsStatus?.audience?.distributors ?? 0})</option>
                                        <option value="sponsors">Corporate Sponsors ({smsStatus?.audience?.sponsors ?? 0})</option>
                                        <option value="all_users">All Registered Platform Users ({smsStatus?.audience?.allUsers ?? 0})</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Target Country</label>
                                    <select
                                        value={form.targetCountry}
                                        onChange={(e) => setForm({ ...form, targetCountry: e.target.value })}
                                        className={`${inputClasses} mt-1`}
                                    >
                                        <option value="all">All Countries</option>
                                        {countries.map((c) => (
                                            <option key={c.id || c.code} value={c.name || c.code}>
                                                {c.name} ({c.code})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* SMS Message Box */}
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
                                    rows={5}
                                    value={form.message}
                                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                                    placeholder="Pete Edochie Legacy: We are thrilled to announce the Ghana Launch Tour dates! Tickets are now live at peteredochie.com/events."
                                    className={`${inputClasses} mt-1 font-mono text-sm leading-relaxed`}
                                />
                                <p className="mt-1.5 text-[0.68rem] text-muted-foreground">
                                    Tip: Messages up to 160 characters count as 1 SMS. Longer messages automatically concatenate.
                                </p>
                            </div>

                            {/* Test Send Row */}
                            <div className="border-t border-border pt-5">
                                <label className="text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">Test Dispatch</label>
                                <div className="mt-1.5 flex flex-wrap gap-2">
                                    <input
                                        type="tel"
                                        value={form.testPhone}
                                        onChange={(e) => setForm({ ...form, testPhone: e.target.value })}
                                        placeholder="0557609106 or +233..."
                                        className={`${inputClasses} max-w-xs`}
                                    />
                                    <button
                                        type="button"
                                        disabled={isSending || !form.message.trim()}
                                        onClick={handleSendTest}
                                        className="border border-border px-5 py-2.5 text-[0.62rem] uppercase tracking-[0.2em] transition-colors hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))] disabled:opacity-40"
                                    >
                                        {isSending ? 'Sending…' : 'Send Test SMS'}
                                    </button>
                                </div>
                            </div>

                            {/* Broadcast Button */}
                            <div className="border-t border-border pt-5">
                                <button
                                    type="button"
                                    disabled={isSending || !form.message.trim() || estimatedRecipients === 0}
                                    onClick={() => setShowConfirmModal(true)}
                                    className="w-full flex items-center justify-center gap-2 bg-[hsl(var(--primary))] px-8 py-4 text-[0.68rem] uppercase tracking-[0.24em] text-white font-medium shadow-md transition-all hover:brightness-110 disabled:opacity-40"
                                >
                                    <Send size={14} /> Broadcast SMS to {estimatedRecipients} {targetAudienceLabel}
                                </button>
                            </div>
                        </div>
                    </Panel>
                </div>

                {/* Right Column: Live Mobile Device Phone Preview (5 cols) */}
                <div className="space-y-6 lg:col-span-5">
                    <Panel title="Live Phone Preview" lead="Real-time rendering on recipient mobile handset.">
                        <div className="flex justify-center p-4">
                            {/* Realistic iPhone mockup */}
                            <div className="relative w-[280px] rounded-[36px] border-[6px] border-[#2d2d2d] bg-[#121212] p-4 shadow-2xl">
                                {/* Dynamic Island / Speaker notch */}
                                <div className="mx-auto mb-4 h-4 w-20 rounded-full bg-[#2d2d2d]" />

                                {/* Chat Header */}
                                <div className="mb-4 border-b border-border/40 pb-2 text-center">
                                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))]">
                                        <MessageSquare size={18} />
                                    </div>
                                    <p className="mt-1 font-semibold text-xs text-foreground">
                                        {smsStatus?.senderId || 'PeteEdochie'}
                                    </p>
                                    <p className="text-[0.55rem] text-muted-foreground">Arkesel SMS Gateway</p>
                                </div>

                                {/* SMS Chat Bubble */}
                                <div className="space-y-3 py-2 min-h-[220px]">
                                    <div className="flex justify-start">
                                        <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-[#242424] p-3 text-xs text-foreground shadow-sm">
                                            <p className="whitespace-pre-wrap break-words leading-relaxed">
                                                {form.message || 'Your SMS broadcast preview will appear here in real-time as you type…'}
                                            </p>
                                            <p className="mt-1.5 text-right text-[0.55rem] text-muted-foreground">
                                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Phone Home Bar Indicator */}
                                <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-muted-foreground/30" />
                            </div>
                        </div>
                    </Panel>
                </div>
            </div>

            {/* 4. Confirmation Modal Before Real Broadcast */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg border border-border bg-card p-6 shadow-2xl">
                        <div className="flex items-center gap-3 text-[hsl(var(--gold))]">
                            <Smartphone size={22} />
                            <h3 className="font-display text-xl">Confirm SMS Broadcast</h3>
                        </div>

                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                            You are about to dispatch a live SMS broadcast to <strong>{estimatedRecipients} recipients</strong> in <strong>{targetAudienceLabel}</strong> via Arkesel.
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
                                {isSending ? 'Sending…' : 'Yes, Dispatch SMS Broadcast'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmsBroadcastPanel;
