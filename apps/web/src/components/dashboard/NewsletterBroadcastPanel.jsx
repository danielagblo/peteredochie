import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Mail, Send, Users, Clock, Download, Trash2, CheckCircle2,
    AlertCircle, Smartphone, Monitor, Sparkles, RefreshCw,
    ExternalLink, Bold, Italic, Heading, List, Quote, Link as LinkIcon
} from 'lucide-react';
import { api, apiCrud } from '@/lib/api';
import { INTEREST_OPTIONS } from '@/lib/accounts';
import { Panel, Stat } from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/contexts/AuthContext';

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

const NewsletterBroadcastPanel = ({ subscribers = [], countries = [], onRefreshSubscribers }) => {
    const { user } = useAuth();
    const [subView, setSubView] = useState('compose'); // 'compose' | 'subscribers' | 'campaigns'
    const [campaigns, setCampaigns] = useState([]);
    const [smtpStatus, setSmtpStatus] = useState(null);
    const [loadingData, setLoadingData] = useState(false);

    // Compose form state
    const [form, setForm] = useState({
        subject: '',
        previewText: '',
        headline: '',
        content: '',
        ctaText: '',
        ctaUrl: '',
        targetInterest: 'all',
        targetCountry: 'all',
        testEmail: user?.email || '',
    });

    const [previewDevice, setPreviewDevice] = useState('desktop');
    const [isSending, setIsSending] = useState(false);
    const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message: string }
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Subscribers tab search & filters
    const [subSearch, setSubSearch] = useState('');
    const [subInterestFilter, setSubInterestFilter] = useState('all');
    const [subCountryFilter, setSubCountryFilter] = useState('all');

    const textareaRef = useRef(null);

    // Load campaigns & SMTP status
    const loadCampaigns = async () => {
        try {
            const data = await api.get('/newsletter/campaigns');
            setCampaigns(data?.items || []);
        } catch (_) {
            /* ignore */
        }
    };

    const loadStatus = async () => {
        try {
            const status = await api.get('/newsletter/status');
            setSmtpStatus(status);
        } catch (_) {
            /* ignore */
        }
    };

    useEffect(() => {
        loadCampaigns();
        loadStatus();
    }, []);

    // Filtered subscribers for targeting
    const targetSubscribers = useMemo(() => {
        return subscribers.filter((s) => {
            if (form.targetCountry !== 'all' && s.country !== form.targetCountry) return false;
            if (form.targetInterest !== 'all') {
                if (!s.interests) return false;
                const list = Array.isArray(s.interests)
                    ? s.interests
                    : typeof s.interests === 'string'
                        ? (() => { try { return JSON.parse(s.interests); } catch { return [s.interests]; } })()
                        : [];
                if (!list.includes(form.targetInterest)) return false;
            }
            return true;
        });
    }, [subscribers, form.targetCountry, form.targetInterest]);

    // Filtered subscribers for directory table
    const filteredSubscribers = useMemo(() => {
        const q = subSearch.toLowerCase().trim();
        return subscribers.filter((s) => {
            if (q) {
                const matchEmail = (s.email || '').toLowerCase().includes(q);
                const matchName = (s.name || '').toLowerCase().includes(q);
                const matchCountry = (s.country || '').toLowerCase().includes(q);
                if (!matchEmail && !matchName && !matchCountry) return false;
            }
            if (subCountryFilter !== 'all' && s.country !== subCountryFilter) return false;
            if (subInterestFilter !== 'all') {
                if (!s.interests) return false;
                const list = Array.isArray(s.interests)
                    ? s.interests
                    : typeof s.interests === 'string'
                        ? (() => { try { return JSON.parse(s.interests); } catch { return [s.interests]; } })()
                        : [];
                if (!list.includes(subInterestFilter)) return false;
            }
            return true;
        });
    }, [subscribers, subSearch, subCountryFilter, subInterestFilter]);

    // Unique countries from subscribers
    const distinctCountries = useMemo(() => {
        const set = new Set();
        subscribers.forEach((s) => { if (s.country) set.add(s.country); });
        return Array.from(set).sort();
    }, [subscribers]);

    // Send test email
    const handleSendTest = async () => {
        if (!form.subject.trim() || !form.content.trim()) {
            setFeedback({ type: 'error', message: 'Please provide both a subject and content before sending a test.' });
            return;
        }
        if (!form.testEmail.trim()) {
            setFeedback({ type: 'error', message: 'Please specify a recipient email for the test.' });
            return;
        }

        setIsSending(true);
        setFeedback(null);
        try {
            const res = await api.post('/newsletter/send', {
                ...form,
                isTest: true,
            });
            setFeedback({
                type: 'success',
                message: res.message || `Test email dispatched to ${form.testEmail}`,
            });
        } catch (err) {
            setFeedback({
                type: 'error',
                message: err.message || 'Could not send test email.',
            });
        } finally {
            setIsSending(false);
        }
    };

    // Broadcast newsletter to all matching subscribers
    const handleBroadcast = async () => {
        if (!form.subject.trim() || !form.content.trim()) {
            setFeedback({ type: 'error', message: 'Please provide both a subject and content for your campaign.' });
            return;
        }
        if (targetSubscribers.length === 0) {
            setFeedback({ type: 'error', message: 'No subscribers match your selected audience filters.' });
            return;
        }

        setIsSending(true);
        setFeedback(null);
        setShowConfirmModal(false);

        try {
            const res = await api.post('/newsletter/send', {
                ...form,
                isTest: false,
            });
            setFeedback({
                type: 'success',
                message: res.message || `Successfully broadcast to ${res.sentCount} subscriber(s)!`,
            });
            // Clear form
            setForm((prev) => ({
                ...prev,
                subject: '',
                previewText: '',
                headline: '',
                content: '',
                ctaText: '',
                ctaUrl: '',
            }));
            loadCampaigns();
        } catch (err) {
            setFeedback({
                type: 'error',
                message: err.message || 'Failed to dispatch broadcast campaign.',
            });
        } finally {
            setIsSending(false);
        }
    };

    // Remove a subscriber
    const handleDeleteSubscriber = async (id, email) => {
        if (!window.confirm(`Are you sure you want to unsubscribe ${email}?`)) return;
        try {
            await apiCrud.remove('subscribers', id);
            if (onRefreshSubscribers) onRefreshSubscribers();
        } catch (_) {
            alert('Could not remove subscriber.');
        }
    };

    // Export CSV
    const exportCSV = () => {
        const rows = [['Name', 'Email', 'Country', 'Interests', 'Subscribed Date']];
        filteredSubscribers.forEach((s) => {
            const interestsStr = Array.isArray(s.interests) ? s.interests.join('; ') : String(s.interests || '');
            rows.push([
                s.name || '',
                s.email || '',
                s.country || '',
                interestsStr,
                fmtDate(s.created || s.createdAt),
            ]);
        });
        const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `newsletter-subscribers-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Client-side markdown renderer matching email output
    const renderPreviewHtml = (text) => {
        if (!text) return '';
        const escapeHtml = (str) =>
            str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');

        const formatInline = (str) => {
            let out = escapeHtml(str);
            out = out.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
            out = out.replace(/__(.*?)__/g, '<strong class="text-white font-bold">$1</strong>');
            out = out.replace(/(^|[^*])\*(?!\*)(.*?)\*(?!\*)/g, '$1<em class="text-zinc-200 italic">$2</em>');
            out = out.replace(/(^|[^_])_(?!_)(.*?)_(?!_)/g, '$1<em class="text-zinc-200 italic">$2</em>');
            out = out.replace(
                /\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g,
                '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#D4AF37] underline font-semibold hover:opacity-80">$1</a>'
            );
            out = out.replace(
                /(^|[\s(])(https?:\/\/[^\s)<]+)/g,
                '$1<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#D4AF37] underline font-semibold hover:opacity-80">$2</a>'
            );
            out = out.replace(/\n/g, '<br />');
            return out;
        };

        const blocks = String(text).replace(/\r\n/g, '\n').trim().split(/\n\s*\n+/);

        return blocks.map((block) => {
            const trimmed = block.trim();
            if (!trimmed) return '';
            if (trimmed.startsWith('### ')) {
                return `<h4 class="mt-4 mb-1.5 font-serif text-base font-semibold text-[#D4AF37]">${formatInline(trimmed.slice(4))}</h4>`;
            }
            if (trimmed.startsWith('## ')) {
                return `<h3 class="mt-5 mb-2 font-serif text-lg font-semibold text-[#D4AF37]">${formatInline(trimmed.slice(3))}</h3>`;
            }
            if (trimmed.startsWith('# ')) {
                return `<h2 class="mt-6 mb-2.5 font-serif text-xl font-bold text-white">${formatInline(trimmed.slice(2))}</h2>`;
            }
            if (trimmed.startsWith('>') || trimmed.startsWith('&gt;')) {
                const quoteLines = trimmed.split('\n').map((l) => l.replace(/^(?:>|&gt;)\s?/, '')).join('\n');
                return `<blockquote class="my-3.5 border-l-2 border-[#D4AF37] bg-zinc-900/60 py-2 px-3 text-xs italic text-zinc-200">${formatInline(quoteLines)}</blockquote>`;
            }
            // Bullet list (handles mixed text + bullet lines)
            const lines = trimmed.split('\n');
            const hasBulletList = lines.some((l) => /^\s*[-*]\s+/.test(l));
            if (hasBulletList) {
                const outputParts = [];
                let currentList = [];
                for (const line of lines) {
                    if (/^\s*[-*]\s+/.test(line)) {
                        currentList.push(line.replace(/^\s*[-*]\s+/, '').trim());
                    } else {
                        if (currentList.length > 0) {
                            outputParts.push(
                                `<ul class="my-2.5 pl-5 text-[#D4AF37] space-y-0.5">${currentList.map((item) => `<li class="mb-1 list-disc text-zinc-300">${formatInline(item)}</li>`).join('')}</ul>`,
                            );
                            currentList = [];
                        }
                        if (line.trim()) {
                            outputParts.push(`<p class="mb-2 text-xs sm:text-sm leading-relaxed text-zinc-300">${formatInline(line.trim())}</p>`);
                        }
                    }
                }
                if (currentList.length > 0) {
                    outputParts.push(
                        `<ul class="my-2.5 pl-5 text-[#D4AF37] space-y-0.5">${currentList.map((item) => `<li class="mb-1 list-disc text-zinc-300">${formatInline(item)}</li>`).join('')}</ul>`,
                    );
                }
                return outputParts.join('');
            }

            // Numbered list (handles mixed text + numbered lines)
            const hasNumberList = lines.some((l) => /^\s*\d+\.\s+/.test(l));
            if (hasNumberList) {
                const outputParts = [];
                let currentList = [];
                for (const line of lines) {
                    if (/^\s*\d+\.\s+/.test(line)) {
                        currentList.push(line.replace(/^\s*\d+\.\s+/, '').trim());
                    } else {
                        if (currentList.length > 0) {
                            outputParts.push(
                                `<ol class="my-2.5 pl-5 text-[#D4AF37] space-y-0.5">${currentList.map((item) => `<li class="mb-1 list-decimal text-zinc-300">${formatInline(item)}</li>`).join('')}</ol>`,
                            );
                            currentList = [];
                        }
                        if (line.trim()) {
                            outputParts.push(`<p class="mb-2 text-xs sm:text-sm leading-relaxed text-zinc-300">${formatInline(line.trim())}</p>`);
                        }
                    }
                }
                if (currentList.length > 0) {
                    outputParts.push(
                        `<ol class="my-2.5 pl-5 text-[#D4AF37] space-y-0.5">${currentList.map((item) => `<li class="mb-1 list-decimal text-zinc-300">${formatInline(item)}</li>`).join('')}</ol>`,
                    );
                }
                return outputParts.join('');
            }
            return `<p class="mb-2.5 text-xs sm:text-sm leading-relaxed text-zinc-300">${formatInline(trimmed)}</p>`;
        }).filter(Boolean).join('');
    };

    // Formatting insertion helper for composer textarea
    const insertFormat = (prefix, suffix = '') => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const text = el.value;
        const selected = text.substring(start, end);
        const replacement = prefix + (selected || 'text') + suffix;
        const nextVal = text.substring(0, start) + replacement + text.substring(end);
        setForm((prev) => ({ ...prev, content: nextVal }));
        setTimeout(() => {
            el.focus();
            el.setSelectionRange(start + prefix.length, start + replacement.length - suffix.length);
        }, 10);
    };

    const inputClasses = 'w-full border border-border bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[hsl(var(--gold))]';
    const subNavBtn = (key, label, Icon) => (
        <button
            type="button"
            onClick={() => { setSubView(key); setFeedback(null); }}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-[0.68rem] uppercase tracking-[0.2em] transition-colors ${
                subView === key
                    ? 'border-[hsl(var(--gold))] text-[hsl(var(--gold))] font-semibold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
            <Icon size={14} /> {label}
        </button>
    );

    return (
        <div className="space-y-8">
            {/* Top Stat Cards & Status */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Total Subscribers" value={subscribers.length} hint="Active newsletter recipients" />
                <Stat label="Distinct Countries" value={distinctCountries.length} hint="Global reach" />
                <Stat label="Campaigns Broadcast" value={campaigns.length} hint="Total email dispatches" />
                <div className="border border-border p-6 flex flex-col justify-between">
                    <div>
                        <p className="text-[0.6rem] uppercase tracking-[0.22em] text-muted-foreground">Email Engine (SMTP)</p>
                        <div className="mt-3 flex items-center gap-2">
                            {smtpStatus?.configured ? (
                                <span className="inline-flex items-center gap-1.5 border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[0.65rem] uppercase tracking-wider text-emerald-400">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    SMTP Live
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[0.65rem] uppercase tracking-wider text-amber-300">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                    Dev Simulation
                                </span>
                            )}
                        </div>
                    </div>
                    <p className="mt-3 text-[0.68rem] text-muted-foreground">
                        {smtpStatus?.configured
                            ? `Connected to ${smtpStatus.host}:${smtpStatus.port}`
                            : 'Emails preview in server logs. Add SMTP to .env for live dispatch.'}
                    </p>
                </div>
            </div>

            {/* Sub View Switcher */}
            <div className="border-b border-border flex items-center gap-2 overflow-x-auto">
                {subNavBtn('compose', 'Compose & Broadcast', Send)}
                {subNavBtn('subscribers', `Subscribers Directory (${subscribers.length})`, Users)}
                {subNavBtn('campaigns', `Broadcast History (${campaigns.length})`, Clock)}
            </div>

            {/* Feedback Alert */}
            {feedback && (
                <div className={`flex items-start justify-between gap-3 border p-4 text-sm ${
                    feedback.type === 'success'
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        : 'border-[hsl(var(--destructive))]/40 bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))]'
                }`}>
                    <div className="flex items-center gap-3">
                        {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        <p>{feedback.message}</p>
                    </div>
                    <button type="button" onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">Dismiss</button>
                </div>
            )}

            {/* ─── 1. COMPOSE & BROADCAST VIEW ─── */}
            {subView === 'compose' && (
                <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                    {/* Left: Composer Form */}
                    <div className="space-y-6">
                        <Panel title="Newsletter Composer" lead="Craft branded email dispatches delivered directly to subscriber inboxes.">
                            <div className="space-y-5">
                                {/* Audience Targeting Card */}
                                <div className="border border-border bg-[hsl(var(--surface))]/40 p-5">
                                    <p className="text-[0.6rem] uppercase tracking-[0.22em] text-[hsl(var(--gold))] font-semibold">Target Audience</p>
                                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                        <div>
                                            <label className="text-[0.62rem] uppercase tracking-wider text-muted-foreground block mb-1">By Interest</label>
                                            <select
                                                value={form.targetInterest}
                                                onChange={(e) => setForm({ ...form, targetInterest: e.target.value })}
                                                className={inputClasses}
                                            >
                                                <option value="all">All Interests ({subscribers.length})</option>
                                                {INTEREST_OPTIONS.map((opt) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[0.62rem] uppercase tracking-wider text-muted-foreground block mb-1">By Country</label>
                                            <select
                                                value={form.targetCountry}
                                                onChange={(e) => setForm({ ...form, targetCountry: e.target.value })}
                                                className={inputClasses}
                                            >
                                                <option value="all">All Countries</option>
                                                {distinctCountries.map((c) => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                                        <span>Matched recipients:</span>
                                        <span className="font-semibold text-[hsl(var(--gold))]">
                                            {targetSubscribers.length} subscriber{targetSubscribers.length === 1 ? '' : 's'}
                                        </span>
                                    </div>
                                </div>

                                {/* Subject Line */}
                                <div>
                                    <label className="text-[0.62rem] uppercase tracking-wider text-muted-foreground block mb-1.5">
                                        Email Subject <span className="text-[hsl(var(--gold))]">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Special Announcement: The Pete Edochie Continental Tour"
                                        value={form.subject}
                                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                        className={inputClasses}
                                    />
                                </div>

                                {/* Preview / Preheader Text */}
                                <div>
                                    <label className="text-[0.62rem] uppercase tracking-wider text-muted-foreground block mb-1.5">
                                        Inbox Preheader Text <span className="text-xs text-muted-foreground font-normal">(displayed next to subject in inbox)</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Dates, ticket access and meet-and-greet reservations are now live."
                                        value={form.previewText}
                                        onChange={(e) => setForm({ ...form, previewText: e.target.value })}
                                        className={inputClasses}
                                    />
                                </div>

                                {/* Section Headline */}
                                <div>
                                    <label className="text-[0.62rem] uppercase tracking-wider text-muted-foreground block mb-1.5">
                                        Email Headline <span className="text-xs text-muted-foreground font-normal">(prominent heading inside the letter)</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. A Personal Word on Legacy and Leadership"
                                        value={form.headline}
                                        onChange={(e) => setForm({ ...form, headline: e.target.value })}
                                        className={inputClasses}
                                    />
                                </div>

                                {/* Formatting Toolbar & Message Body */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-[0.62rem] uppercase tracking-wider text-muted-foreground">
                                            Message Content <span className="text-[hsl(var(--gold))]">*</span>
                                        </label>
                                        {/* Helper toolbar buttons */}
                                        <div className="flex items-center gap-1 border border-border px-1 py-0.5 bg-[hsl(var(--surface))]">
                                            <button
                                                type="button"
                                                onClick={() => insertFormat('**', '**')}
                                                title="Bold"
                                                className="p-1 text-muted-foreground hover:text-[hsl(var(--gold))]"
                                            >
                                                <Bold size={13} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormat('*', '*')}
                                                title="Italic"
                                                className="p-1 text-muted-foreground hover:text-[hsl(var(--gold))]"
                                            >
                                                <Italic size={13} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormat('\n\n## ', '\n')}
                                                title="Heading"
                                                className="p-1 text-muted-foreground hover:text-[hsl(var(--gold))]"
                                            >
                                                <Heading size={13} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormat('\n- Bullet item 1\n- Bullet item 2\n')}
                                                title="Bullet list"
                                                className="p-1 text-muted-foreground hover:text-[hsl(var(--gold))]"
                                            >
                                                <List size={13} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => insertFormat('\n> ')}
                                                title="Quote"
                                                className="p-1 text-muted-foreground hover:text-[hsl(var(--gold))]"
                                            >
                                                <Quote size={13} />
                                            </button>
                                        </div>
                                    </div>
                                    <textarea
                                        ref={textareaRef}
                                        rows={10}
                                        placeholder="Write your newsletter message here... Separate paragraphs with a blank line."
                                        value={form.content}
                                        onChange={(e) => setForm({ ...form, content: e.target.value })}
                                        className={`${inputClasses} font-sans leading-relaxed`}
                                    />
                                    <p className="mt-1.5 text-[0.65rem] text-muted-foreground">
                                        Tip: Press Enter twice between paragraphs for clean spacing in the email.
                                    </p>
                                </div>

                                {/* Call to Action Button (Optional) */}
                                <div className="border border-border p-4 bg-[hsl(var(--surface))]/20 space-y-3">
                                    <p className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                                        Call-to-Action Button (Optional)
                                    </p>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <input
                                            type="text"
                                            placeholder="Button Label (e.g. Reserve Your Seat)"
                                            value={form.ctaText}
                                            onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                                            className={inputClasses}
                                        />
                                        <input
                                            type="url"
                                            placeholder="Target Link (https://...)"
                                            value={form.ctaUrl}
                                            onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
                                            className={inputClasses}
                                        />
                                    </div>
                                </div>

                                {/* Send Actions */}
                                <div className="pt-4 border-t border-border space-y-4">
                                    {/* Test Send Row */}
                                    <div className="flex flex-wrap items-center gap-3">
                                        <input
                                            type="email"
                                            placeholder="Test email address"
                                            value={form.testEmail}
                                            onChange={(e) => setForm({ ...form, testEmail: e.target.value })}
                                            className={`${inputClasses} max-w-xs text-xs py-2`}
                                        />
                                        <button
                                            type="button"
                                            disabled={isSending || !form.subject || !form.content}
                                            onClick={handleSendTest}
                                            className="border border-border px-4 py-2.5 text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))] disabled:opacity-40"
                                        >
                                            Send Test Email
                                        </button>
                                    </div>

                                    {/* Broadcast Primary Button */}
                                    <div className="flex items-center justify-between gap-4 pt-2">
                                        <span className="text-xs text-muted-foreground">
                                            Will be delivered to <strong className="text-foreground">{targetSubscribers.length}</strong> recipient{targetSubscribers.length === 1 ? '' : 's'}.
                                        </span>
                                        <button
                                            type="button"
                                            disabled={isSending || targetSubscribers.length === 0 || !form.subject.trim() || !form.content.trim()}
                                            onClick={() => setShowConfirmModal(true)}
                                            className="flex items-center gap-2 bg-[hsl(var(--gold))] px-6 py-3 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[hsl(var(--background))] transition-opacity hover:opacity-90 disabled:opacity-40"
                                        >
                                            <Send size={14} /> Broadcast Campaign
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Panel>
                    </div>

                    {/* Right: Live Interactive Email Preview */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-[0.65rem] uppercase tracking-[0.22em] text-[hsl(var(--gold))] font-semibold flex items-center gap-2">
                                <Sparkles size={14} /> Live Email Preview
                            </p>
                            <div className="flex items-center border border-border">
                                <button
                                    type="button"
                                    onClick={() => setPreviewDevice('desktop')}
                                    className={`p-1.5 transition-colors ${previewDevice === 'desktop' ? 'bg-[hsl(var(--gold))] text-black' : 'text-muted-foreground hover:text-foreground'}`}
                                    title="Desktop view"
                                >
                                    <Monitor size={14} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPreviewDevice('mobile')}
                                    className={`p-1.5 transition-colors ${previewDevice === 'mobile' ? 'bg-[hsl(var(--gold))] text-black' : 'text-muted-foreground hover:text-foreground'}`}
                                    title="Mobile view"
                                >
                                    <Smartphone size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Simulated Email Client Shell */}
                        <div className={`border border-border bg-[#09090b] shadow-2xl transition-all duration-300 mx-auto ${
                            previewDevice === 'mobile' ? 'max-w-[360px]' : 'w-full'
                        }`}>
                            {/* Browser / Inbox Header Bar */}
                            <div className="border-b border-[#222226] bg-[#111114] px-4 py-3 text-xs">
                                <div className="flex items-center gap-2 text-[#71717a] text-[0.62rem]">
                                    <span className="font-semibold text-[#a1a1aa]">From:</span>
                                    <span>The Pete Edochie Legacy &lt;newsletter@peteredochie.com&gt;</span>
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-[0.68rem] font-medium text-white truncate">
                                    <span className="text-[#a1a1aa] font-normal">Subject:</span>
                                    <span>{form.subject || 'Subject will appear here...'}</span>
                                </div>
                                {form.previewText && (
                                    <p className="mt-0.5 text-[0.62rem] text-[#71717a] truncate">
                                        {form.previewText}
                                    </p>
                                )}
                            </div>

                            {/* Inner Email Body Canvas */}
                            <div className="p-4 sm:p-6 bg-[#09090b]">
                                <div className="border border-[#27272a] bg-[#141416] overflow-hidden">
                                    {/* Gold Accent Strip */}
                                    <div className="h-1 w-full bg-[#D4AF37]" />

                                    {/* Email Header */}
                                    <div className="border-b border-[#222226] px-6 py-6 text-center">
                                        <p className="font-serif text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">
                                            THE PETE EDOCHIE LEGACY
                                        </p>
                                        <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-[#71717a]">
                                            King Dawie Publishing &bull; Official Dispatch
                                        </p>
                                    </div>

                                    {/* Email Content */}
                                    <div className="px-6 py-8 space-y-4">
                                        {form.headline && (
                                            <h3 className="font-serif text-xl sm:text-2xl font-normal leading-tight text-white">
                                                {form.headline}
                                            </h3>
                                        )}

                                        <p className="text-xs sm:text-sm text-[#e4e4e7]">
                                            Dear {user?.name || 'Valued Subscriber'},
                                        </p>

                                        {form.content ? (
                                            <div
                                                className="space-y-1 text-xs sm:text-sm leading-relaxed text-[#d4d4d8]"
                                                dangerouslySetInnerHTML={{ __html: renderPreviewHtml(form.content) }}
                                            />
                                        ) : (
                                            <p className="italic text-xs text-[#71717a]">
                                                Start typing your message to see a live render of your official newsletter here...
                                            </p>
                                        )}

                                        {/* CTA Button */}
                                        {form.ctaText && (
                                            <div className="pt-4 pb-2 text-center">
                                                <span className="inline-block bg-[#D4AF37] px-6 py-3 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-[#09090b]">
                                                    {form.ctaText}
                                                </span>
                                            </div>
                                        )}

                                        {/* Sign-off */}
                                        <div className="pt-6 border-t border-[#222226] text-xs text-[#a1a1aa] leading-normal">
                                            Warm regards,<br />
                                            <strong className="text-white">The Pete Edochie Legacy Team</strong><br />
                                            <span className="text-[11px] text-[#71717a]">King Dawie Publishing</span>
                                        </div>
                                    </div>

                                    {/* Email Footer */}
                                    <div className="border-t border-[#222226] bg-[#0c0c0e] px-6 py-5 text-center text-[10px] text-[#71717a] leading-relaxed">
                                        <p>You received this email because you subscribed to updates from the Pete Edochie Legacy platform.</p>
                                        <p className="mt-1 text-[#52525b]">&copy; {new Date().getFullYear()} The Pete Edochie Legacy &bull; King Dawie Publishing &bull; All Rights Reserved.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── 2. SUBSCRIBERS DIRECTORY VIEW ─── */}
            {subView === 'subscribers' && (
                <Panel
                    title="Subscribers Directory"
                    lead="View, search, filter and export the active newsletter recipient registry."
                    actions={
                        <button
                            type="button"
                            onClick={exportCSV}
                            className="flex items-center gap-2 border border-border px-4 py-2 text-[0.62rem] uppercase tracking-[0.18em] hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]"
                        >
                            <Download size={14} /> Export CSV ({filteredSubscribers.length})
                        </button>
                    }
                >
                    <div className="space-y-4">
                        {/* Search & Filters */}
                        <div className="grid gap-3 sm:grid-cols-3">
                            <input
                                type="text"
                                placeholder="Search by name, email, or country..."
                                value={subSearch}
                                onChange={(e) => setSubSearch(e.target.value)}
                                className={inputClasses}
                            />
                            <select
                                value={subInterestFilter}
                                onChange={(e) => setSubInterestFilter(e.target.value)}
                                className={inputClasses}
                            >
                                <option value="all">All Interests</option>
                                {INTEREST_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                            <select
                                value={subCountryFilter}
                                onChange={(e) => setSubCountryFilter(e.target.value)}
                                className={inputClasses}
                            >
                                <option value="all">All Countries</option>
                                {distinctCountries.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        {/* Subscribers Table */}
                        <div className="overflow-x-auto border border-border">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-border bg-[hsl(var(--surface))] uppercase tracking-[0.18em] text-[0.6rem] text-muted-foreground">
                                    <tr>
                                        <th className="p-4">Subscriber</th>
                                        <th className="p-4">Country</th>
                                        <th className="p-4">Interests</th>
                                        <th className="p-4">Subscribed</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredSubscribers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                                No subscribers match your search criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredSubscribers.map((sub) => {
                                            const interestsList = Array.isArray(sub.interests)
                                                ? sub.interests
                                                : typeof sub.interests === 'string'
                                                    ? (() => { try { return JSON.parse(sub.interests); } catch { return [sub.interests]; } })()
                                                    : [];

                                            return (
                                                <tr key={sub.id} className="hover:bg-[hsl(var(--surface))]/40 transition-colors">
                                                    <td className="p-4">
                                                        <p className="font-semibold text-foreground">{sub.name || 'Unnamed'}</p>
                                                        <p className="text-muted-foreground">{sub.email}</p>
                                                    </td>
                                                    <td className="p-4 text-muted-foreground">
                                                        {sub.country || '—'}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex flex-wrap gap-1 max-w-xs">
                                                            {interestsList.length > 0 ? (
                                                                interestsList.map((interest, i) => (
                                                                    <span
                                                                        key={i}
                                                                        className="inline-block border border-border px-2 py-0.5 text-[0.55rem] uppercase tracking-wider text-muted-foreground"
                                                                    >
                                                                        {interest}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="text-muted-foreground">—</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-muted-foreground whitespace-nowrap">
                                                        {fmtDate(sub.created || sub.createdAt)}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                                                            className="p-1.5 text-muted-foreground hover:text-[hsl(var(--destructive))] transition-colors"
                                                            title="Unsubscribe"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Panel>
            )}

            {/* ─── 3. BROADCAST HISTORY VIEW ─── */}
            {subView === 'campaigns' && (
                <Panel
                    title="Broadcast History"
                    lead="Record of all previous newsletter campaigns and dispatches."
                    actions={
                        <button
                            type="button"
                            onClick={loadCampaigns}
                            className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
                        >
                            <RefreshCw size={13} /> Refresh Log
                        </button>
                    }
                >
                    <div className="overflow-x-auto border border-border">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-border bg-[hsl(var(--surface))] uppercase tracking-[0.18em] text-[0.6rem] text-muted-foreground">
                                <tr>
                                    <th className="p-4">Date Sent</th>
                                    <th className="p-4">Subject</th>
                                    <th className="p-4">Audience Target</th>
                                    <th className="p-4">Recipients</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Sent By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {campaigns.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                            No campaigns sent yet. Use the composer tab to launch your first dispatch.
                                        </td>
                                    </tr>
                                ) : (
                                    campaigns.map((camp) => (
                                        <tr key={camp.id} className="hover:bg-[hsl(var(--surface))]/40 transition-colors">
                                            <td className="p-4 whitespace-nowrap text-muted-foreground">
                                                {fmtDateTime(camp.sent_at || camp.created)}
                                            </td>
                                            <td className="p-4">
                                                <p className="font-semibold text-foreground">{camp.subject}</p>
                                                {camp.preview_text && (
                                                    <p className="text-[0.65rem] text-muted-foreground truncate max-w-xs">{camp.preview_text}</p>
                                                )}
                                            </td>
                                            <td className="p-4 text-muted-foreground">
                                                {camp.target_interest ? (
                                                    <span className="border border-border px-2 py-0.5 text-[0.58rem] uppercase tracking-wider">
                                                        {camp.target_interest}
                                                    </span>
                                                ) : (
                                                    <span className="text-[0.65rem] text-muted-foreground">All Interests</span>
                                                )}
                                                {camp.target_country && (
                                                    <span className="ml-1.5 border border-border px-2 py-0.5 text-[0.58rem] uppercase tracking-wider">
                                                        {camp.target_country}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 font-semibold text-[hsl(var(--gold))]">
                                                {camp.recipient_count}
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center gap-1 border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[0.58rem] uppercase tracking-wider text-emerald-400">
                                                    <CheckCircle2 size={11} /> Sent
                                                </span>
                                            </td>
                                            <td className="p-4 text-muted-foreground">
                                                {camp.sent_by?.name || camp.sent_by?.email || 'Admin'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Panel>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="w-full max-w-lg border border-[hsl(var(--gold))] bg-[hsl(var(--background))] p-7 shadow-2xl">
                        <div className="flex items-center gap-3 text-[hsl(var(--gold))]">
                            <Send size={20} />
                            <h3 className="font-display text-2xl text-foreground">Confirm Broadcast Dispatch</h3>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                            You are about to broadcast the newsletter <strong className="text-foreground">"{form.subject}"</strong> to:
                        </p>
                        <div className="mt-4 border border-border bg-[hsl(var(--surface))] p-4 space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Recipients:</span>
                                <strong className="text-[hsl(var(--gold))] text-sm">{targetSubscribers.length} subscribers</strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Interest Filter:</span>
                                <span>{form.targetInterest === 'all' ? 'All Interests' : form.targetInterest}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Country Filter:</span>
                                <span>{form.targetCountry === 'all' ? 'All Countries' : form.targetCountry}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Email Dispatch Mode:</span>
                                <span className={smtpStatus?.configured ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                                    {smtpStatus?.configured ? 'Live SMTP' : 'Dev Simulation Mode'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                className="border border-border px-5 py-2.5 text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isSending}
                                onClick={handleBroadcast}
                                className="bg-[hsl(var(--gold))] px-6 py-2.5 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[hsl(var(--background))] transition-opacity hover:opacity-90 disabled:opacity-50"
                            >
                                {isSending ? 'Broadcasting...' : 'Yes, Send Broadcast Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewsletterBroadcastPanel;
