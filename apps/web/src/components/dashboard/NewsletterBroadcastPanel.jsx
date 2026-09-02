import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
    Mail, Send, Users, Clock, Download, Trash2, CheckCircle2,
    AlertCircle, Smartphone, Monitor, Sparkles, RefreshCw,
    ExternalLink, Bold, Italic, Underline, Heading2, Heading3,
    List, ListOrdered, Quote, Link as LinkIcon, Unlink, RotateCcw,
    Plus, Filter, X, ChevronDown
} from 'lucide-react';
import { api, apiCrud } from '@/lib/api';
import { INTEREST_OPTIONS } from '@/lib/accounts';
import { Panel, Stat } from '@/components/dashboard/DashboardShell';
import { useAuth } from '@/contexts/AuthContext';

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

const NewsletterBroadcastPanel = ({ subscribers = [], onRefreshSubscribers }) => {
    const { user } = useAuth();
    const [subView, setSubView] = useState('compose'); // 'compose' | 'subscribers' | 'campaigns'
    const [campaigns, setCampaigns] = useState([]);
    const [smtpStatus, setSmtpStatus] = useState(null);

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

    const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'mobile'
    const [isSending, setIsSending] = useState(false);
    const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', message: string }
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showAudienceSettings, setShowAudienceSettings] = useState(false);
    const [showCtaSettings, setShowCtaSettings] = useState(false);

    // Word-style contentEditable state
    const editorRef = useRef(null);
    const [isEditorFocused, setIsEditorFocused] = useState(false);
    const [activeStates, setActiveStates] = useState({
        bold: false,
        italic: false,
        underline: false,
        unorderedList: false,
        orderedList: false,
    });

    // Subscribers tab search & filters
    const [subSearch, setSubSearch] = useState('');
    const [subInterestFilter, setSubInterestFilter] = useState('all');
    const [subCountryFilter, setSubCountryFilter] = useState('all');

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

    // Update active toolbar states based on cursor/selection
    const updateActiveStates = useCallback(() => {
        try {
            setActiveStates({
                bold: document.queryCommandState('bold'),
                italic: document.queryCommandState('italic'),
                underline: document.queryCommandState('underline'),
                unorderedList: document.queryCommandState('insertUnorderedList'),
                orderedList: document.queryCommandState('insertOrderedList'),
            });
        } catch (_) {
            /* ignore */
        }
    }, []);

    // Sync external value to editor if empty or changed outside
    useEffect(() => {
        const el = editorRef.current;
        if (!el) return;
        if (!isEditorFocused && form.content !== el.innerHTML) {
            el.innerHTML = form.content || '';
        }
    }, [form.content, isEditorFocused]);

    const handleEditorInput = () => {
        if (!editorRef.current) return;
        const html = editorRef.current.innerHTML;
        const clean = html === '<p><br></p>' || html === '<br>' || html === '' ? '' : html;
        setForm((prev) => ({ ...prev, content: clean }));
        updateActiveStates();
    };

    const exec = (command, valueArg = null) => {
        if (!editorRef.current) return;
        editorRef.current.focus();
        document.execCommand(command, false, valueArg);
        handleEditorInput();
        updateActiveStates();
    };

    const handleFormatBlock = (tag) => {
        if (!editorRef.current) return;
        editorRef.current.focus();
        const current = document.queryCommandValue('formatBlock');
        if (current && current.toLowerCase() === tag.toLowerCase()) {
            document.execCommand('formatBlock', false, '<p>');
        } else {
            document.execCommand('formatBlock', false, `<${tag}>`);
        }
        handleEditorInput();
    };

    const handleLink = () => {
        if (!editorRef.current) return;
        const selection = window.getSelection();
        const selectedText = selection.toString();
        const url = window.prompt('Enter link URL (e.g. https://...):', 'https://');
        if (url && url.trim() && url !== 'https://') {
            if (!selectedText) {
                exec('insertHTML', `<a href="${url.trim()}" target="_blank" rel="noopener noreferrer">${url.trim()}</a>`);
            } else {
                exec('createLink', url.trim());
            }
        }
    };

    const handleQuote = () => {
        handleFormatBlock('blockquote');
    };

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
            if (editorRef.current) {
                editorRef.current.innerHTML = '';
            }
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

    const inputClasses = 'w-full border border-border bg-card text-foreground px-4 py-2.5 text-sm outline-none transition-colors focus:border-[hsl(var(--gold))] [&>option]:bg-card [&>option]:text-foreground';

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

    const ribbonBtn = (onClick, title, Icon, isActive = false) => (
        <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onClick(); }}
            title={title}
            className={`p-1.5 transition-colors rounded-sm ${
                isActive
                    ? 'bg-[hsl(var(--gold))] text-black font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
            }`}
        >
            <Icon size={14} />
        </button>
    );

    const isContentEmpty = !form.content || form.content === '<p><br></p>' || form.content === '<br>' || form.content.trim() === '';

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
                    <p className="mt-2 text-[0.58rem] text-muted-foreground">
                        {smtpStatus?.configured ? `Host: ${smtpStatus.host}:${smtpStatus.port}` : 'Console logging mode (safe dev fallback)'}
                    </p>
                </div>
            </div>

            {/* Sub View Switcher */}
            <div className="border-b border-border flex items-center gap-2 overflow-x-auto">
                {subNavBtn('compose', 'Word-Style Visual Composer', Send)}
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

            {/* ─── 1. VISUAL WORD-STYLE COMPOSE & BROADCAST VIEW ─── */}
            {subView === 'compose' && (
                <div className="space-y-6">
                    {/* Top Action Ribbon: Audience & Dispatch Controls */}
                    <div className="border border-border bg-card p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
                        {/* Left: Audience Selector Pill */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowAudienceSettings(!showAudienceSettings)}
                                className="flex items-center gap-2 border border-border bg-secondary/30 px-3 py-1.5 text-xs text-foreground hover:border-[hsl(var(--gold))] transition-colors"
                            >
                                <Users size={14} className="text-[hsl(var(--gold))]" />
                                <span>Audience:</span>
                                <span className="font-semibold text-[hsl(var(--gold))]">
                                    {form.targetInterest === 'all' && form.targetCountry === 'all'
                                        ? `All Subscribers (${targetSubscribers.length})`
                                        : `Filtered (${targetSubscribers.length})`}
                                </span>
                                <ChevronDown size={13} className="text-muted-foreground" />
                            </button>
                        </div>

                        {/* Center: Device View Mode Switch */}
                        <div className="flex items-center border border-border">
                            <button
                                type="button"
                                onClick={() => setPreviewDevice('desktop')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
                                    previewDevice === 'desktop'
                                        ? 'bg-[hsl(var(--gold))] text-black font-semibold'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                                title="Desktop Letterhead View"
                            >
                                <Monitor size={14} /> Desktop
                            </button>
                            <button
                                type="button"
                                onClick={() => setPreviewDevice('mobile')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
                                    previewDevice === 'mobile'
                                        ? 'bg-[hsl(var(--gold))] text-black font-semibold'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                                title="Mobile Phone Mockup View"
                            >
                                <Smartphone size={14} /> Mobile
                            </button>
                        </div>

                        {/* Right: Test & Broadcast Actions */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleSendTest}
                                disabled={isSending}
                                className="flex items-center gap-1.5 border border-border bg-secondary/40 px-3.5 py-2 text-[0.68rem] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-[hsl(var(--gold))] transition-colors disabled:opacity-40"
                            >
                                <Mail size={13} /> Send Test to Me
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(true)}
                                disabled={isSending || targetSubscribers.length === 0}
                                className="flex items-center gap-1.5 bg-[hsl(var(--gold))] px-5 py-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[hsl(var(--background))] transition-opacity hover:opacity-90 disabled:opacity-40"
                            >
                                <Send size={13} /> Broadcast ({targetSubscribers.length})
                            </button>
                        </div>
                    </div>

                    {/* Collapsible Audience Filter Drawer */}
                    {showAudienceSettings && (
                        <div className="border border-border bg-secondary/20 p-4 grid gap-4 sm:grid-cols-2 animate-in fade-in duration-200">
                            <div>
                                <label className="text-[0.62rem] uppercase tracking-wider text-muted-foreground block mb-1">
                                    Filter Audience By Interest
                                </label>
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
                                <label className="text-[0.62rem] uppercase tracking-wider text-muted-foreground block mb-1">
                                    Filter Audience By Country
                                </label>
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
                    )}

                    {/* Email Subject & Preheader Bar (The "Envelope") */}
                    <div className="border border-border bg-card p-5 space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-[0.62rem] uppercase tracking-wider text-muted-foreground block mb-1.5 font-medium">
                                    Email Subject Line <span className="text-[hsl(var(--gold))]">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Special Announcement: The Pete Edochie Continental Tour"
                                    value={form.subject}
                                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                    className={inputClasses}
                                />
                            </div>
                            <div>
                                <label className="text-[0.62rem] uppercase tracking-wider text-muted-foreground block mb-1.5 font-medium">
                                    Inbox Preheader <span className="text-xs text-muted-foreground font-normal">(snippet previewed next to subject)</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Tour dates, VIP access, and mentorship reservations are now live."
                                    value={form.previewText}
                                    onChange={(e) => setForm({ ...form, previewText: e.target.value })}
                                    className={inputClasses}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sticky Word-Style Formatting Ribbon */}
                    <div className="sticky top-16 z-20 border border-border bg-card/95 backdrop-blur-md px-3 py-2 flex flex-wrap items-center justify-between gap-2 shadow-lg">
                        {/* Text Styling Buttons */}
                        <div className="flex flex-wrap items-center gap-1">
                            {ribbonBtn(() => exec('bold'), 'Bold (Ctrl+B)', Bold, activeStates.bold)}
                            {ribbonBtn(() => exec('italic'), 'Italic (Ctrl+I)', Italic, activeStates.italic)}
                            {ribbonBtn(() => exec('underline'), 'Underline (Ctrl+U)', Underline, activeStates.underline)}

                            <span className="h-4 w-px bg-border mx-1.5" />

                            {ribbonBtn(() => handleFormatBlock('h2'), 'Heading 2 (Gold Serif)', Heading2)}
                            {ribbonBtn(() => handleFormatBlock('h3'), 'Heading 3 (Gold Serif)', Heading3)}

                            <span className="h-4 w-px bg-border mx-1.5" />

                            {ribbonBtn(() => exec('insertUnorderedList'), 'Bullet List', List, activeStates.unorderedList)}
                            {ribbonBtn(() => exec('insertOrderedList'), 'Numbered List', ListOrdered, activeStates.orderedList)}
                            {ribbonBtn(handleQuote, 'Quote (Gold Border)', Quote)}

                            <span className="h-4 w-px bg-border mx-1.5" />

                            {ribbonBtn(handleLink, 'Insert Clickable Link', LinkIcon)}
                            {ribbonBtn(() => exec('unlink'), 'Remove Link', Unlink)}
                            {ribbonBtn(() => exec('removeFormat'), 'Clear Formatting', RotateCcw)}
                        </div>

                        {/* Toggle Gold Call-to-Action Button */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCtaSettings(!showCtaSettings);
                                    if (!form.ctaText && !showCtaSettings) {
                                        setForm((prev) => ({ ...prev, ctaText: 'Reserve Your Seat', ctaUrl: 'https://' }));
                                    }
                                }}
                                className={`flex items-center gap-1.5 border px-2.5 py-1 text-xs transition-colors ${
                                    form.ctaText || showCtaSettings
                                        ? 'border-[hsl(var(--gold))] text-[hsl(var(--gold))] bg-[hsl(var(--gold))]/10 font-semibold'
                                        : 'border-border text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                <Plus size={13} /> {form.ctaText ? 'CTA Button Active' : 'Add CTA Button'}
                            </button>
                        </div>
                    </div>

                    {/* Optional CTA Button Setting Inline Bar */}
                    {showCtaSettings && (
                        <div className="border border-[hsl(var(--gold))]/30 bg-[hsl(var(--gold))]/5 p-4 grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="text-[0.62rem] uppercase tracking-wider text-[hsl(var(--gold))] block mb-1">
                                    Button Text
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Reserve Your Seat"
                                    value={form.ctaText}
                                    onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                                    className={inputClasses}
                                />
                            </div>
                            <div>
                                <label className="text-[0.62rem] uppercase tracking-wider text-[hsl(var(--gold))] block mb-1">
                                    Button Destination URL
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://peteredochie.com/..."
                                    value={form.ctaUrl}
                                    onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })}
                                    className={inputClasses}
                                />
                            </div>
                        </div>
                    )}

                    {/* ─── THE WORD-STYLE LETTERHEAD DOCUMENT SHEET ─── */}
                    {/* What you see and type here IS the document itself! */}
                    <div className="py-6 flex justify-center bg-zinc-950/60 border border-border min-h-[600px]">
                        <div
                            className={`transition-all duration-300 w-full shadow-2xl bg-[#141416] border border-[#27272a] ${
                                previewDevice === 'mobile' ? 'max-w-[360px]' : 'max-w-[620px]'
                            }`}
                        >
                            {/* Top Gold Accent Strip */}
                            <div className="h-1.5 w-full bg-[#D4AF37]" />

                            {/* Letterhead Header / Crest */}
                            <div className="border-b border-[#222226] px-6 py-6 text-center select-none">
                                <p className="font-serif text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">
                                    THE PETE EDOCHIE LEGACY
                                </p>
                                <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-[#71717a]">
                                    King Dawie Publishing &bull; Official Dispatch
                                </p>
                            </div>

                            {/* Editable Letter Canvas */}
                            <div className="px-6 py-8 space-y-4">
                                {/* Inline Editable Headline */}
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Click here to type a letter headline (e.g. A Word on Legacy)..."
                                        value={form.headline}
                                        onChange={(e) => setForm({ ...form, headline: e.target.value })}
                                        className="w-full font-serif text-xl sm:text-2xl font-normal text-white bg-transparent outline-none border-b border-transparent focus:border-[#D4AF37] placeholder:text-zinc-600 transition-colors pb-1"
                                    />
                                </div>

                                {/* Salutation */}
                                <p className="text-xs sm:text-sm text-[#e4e4e7] select-none">
                                    Dear {user?.name || 'Valued Subscriber'},
                                </p>

                                {/* The Word-Style Visual Editable Message Area */}
                                <div className="relative">
                                    <div
                                        ref={editorRef}
                                        contentEditable
                                        onInput={handleEditorInput}
                                        onFocus={() => { setIsEditorFocused(true); updateActiveStates(); }}
                                        onBlur={() => { setIsEditorFocused(false); handleEditorInput(); }}
                                        onKeyUp={updateActiveStates}
                                        onMouseUp={updateActiveStates}
                                        className="min-h-[260px] text-xs sm:text-sm leading-relaxed outline-none text-[#d4d4d8] font-sans
                                            [&_h1]:text-xl [&_h1]:font-serif [&_h1]:font-bold [&_h1]:text-white [&_h1]:my-3
                                            [&_h2]:text-lg [&_h2]:font-serif [&_h2]:font-semibold [&_h2]:text-[#D4AF37] [&_h2]:my-3
                                            [&_h3]:text-base [&_h3]:font-serif [&_h3]:font-semibold [&_h3]:text-[#D4AF37] [&_h3]:my-2
                                            [&_p]:mb-2.5 [&_p]:leading-relaxed
                                            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2.5 [&_ul]:text-[#D4AF37] [&_ul_li]:text-[#d4d4d8] [&_ul_li]:mb-1
                                            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2.5 [&_ol]:text-[#D4AF37] [&_ol_li]:text-[#d4d4d8] [&_ol_li]:mb-1
                                            [&_blockquote]:border-l-2 [&_blockquote]:border-[#D4AF37] [&_blockquote]:bg-zinc-900/60 [&_blockquote]:py-2 [&_blockquote]:px-3.5 [&_blockquote]:my-3 [&_blockquote]:italic [&_blockquote]:text-zinc-200
                                            [&_a]:text-[#D4AF37] [&_a]:underline [&_a]:font-semibold
                                            [&_strong]:text-white [&_strong]:font-bold
                                            [&_b]:text-white [&_b]:font-bold
                                            [&_em]:italic [&_em]:text-zinc-200"
                                    />

                                    {/* Placeholder when document is empty */}
                                    {isContentEmpty && !isEditorFocused && (
                                        <div
                                            onClick={() => editorRef.current?.focus()}
                                            className="pointer-events-none absolute left-0 top-0 text-xs sm:text-sm text-zinc-600 italic select-none"
                                        >
                                            Click here to begin typing your official dispatch... Highlight text and use the toolbar above to make words bold, italic, or headings visually.
                                        </div>
                                    )}
                                </div>

                                {/* Call to Action Button directly on the document */}
                                {form.ctaText && (
                                    <div className="pt-4 pb-2 text-center">
                                        <a
                                            href={form.ctaUrl || '#'}
                                            onClick={(e) => e.preventDefault()}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-block bg-[#D4AF37] px-6 py-3 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-[#09090b] shadow-md hover:opacity-95"
                                        >
                                            {form.ctaText}
                                        </a>
                                    </div>
                                )}

                                {/* Signoff */}
                                <div className="pt-6 border-t border-[#222226] text-xs text-[#a1a1aa] leading-normal select-none">
                                    Warm regards,<br />
                                    <strong className="text-white">The Pete Edochie Legacy Team</strong><br />
                                    <span className="text-[11px] text-[#71717a]">King Dawie Publishing</span>
                                </div>
                            </div>

                            {/* Letterhead Footer */}
                            <div className="border-t border-[#222226] bg-[#0c0c0e] px-6 py-5 text-center text-[10px] text-[#71717a] leading-relaxed select-none">
                                <p>You received this email because you subscribed to updates from the Pete Edochie Legacy platform.</p>
                                <p className="mt-1 text-[#52525b]">&copy; {new Date().getFullYear()} The Pete Edochie Legacy &bull; King Dawie Publishing &bull; All Rights Reserved.</p>
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
                            <Download size={13} /> Export CSV ({filteredSubscribers.length})
                        </button>
                    }
                >
                    {/* Search & Filter Toolbar */}
                    <div className="mb-6 grid gap-3 sm:grid-cols-3">
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
                    {filteredSubscribers.length === 0 ? (
                        <div className="border border-border p-12 text-center text-xs text-muted-foreground">
                            No subscribers match your search criteria.
                        </div>
                    ) : (
                        <div className="border border-border overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-border bg-[hsl(var(--surface))] uppercase tracking-wider text-[0.62rem] text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3">Subscriber</th>
                                        <th className="px-4 py-3">Country</th>
                                        <th className="px-4 py-3">Interests</th>
                                        <th className="px-4 py-3">Subscribed</th>
                                        <th className="px-4 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredSubscribers.map((s) => {
                                        const interests = Array.isArray(s.interests)
                                            ? s.interests
                                            : typeof s.interests === 'string'
                                                ? (() => { try { return JSON.parse(s.interests); } catch { return [s.interests]; } })()
                                                : [];
                                        return (
                                            <tr key={s.id} className="hover:bg-[hsl(var(--surface))]/40">
                                                <td className="px-4 py-3">
                                                    <p className="font-semibold text-foreground">{s.name || 'Anonymous'}</p>
                                                    <p className="text-muted-foreground text-[0.7rem]">{s.email}</p>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {s.country || '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {interests.length > 0 ? (
                                                            interests.map((it, i) => (
                                                                <span key={i} className="border border-border px-1.5 py-0.5 text-[0.6rem] text-muted-foreground">
                                                                    {it}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-muted-foreground text-[0.68rem] italic">All updates</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                                    {fmtDate(s.created || s.createdAt)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteSubscriber(s.id, s.email)}
                                                        className="text-muted-foreground hover:text-[hsl(var(--destructive))] p-1"
                                                        title="Unsubscribe"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Panel>
            )}

            {/* ─── 3. CAMPAIGNS BROADCAST HISTORY VIEW ─── */}
            {subView === 'campaigns' && (
                <Panel
                    title="Broadcast History"
                    lead="Archive of sent newsletters with delivery counts and timestamps."
                    actions={
                        <button
                            type="button"
                            onClick={loadCampaigns}
                            className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-[0.62rem] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                        >
                            <RefreshCw size={12} /> Refresh
                        </button>
                    }
                >
                    {campaigns.length === 0 ? (
                        <div className="border border-border p-12 text-center text-xs text-muted-foreground">
                            No newsletter broadcasts sent yet. Use the composer tab to launch your first dispatch.
                        </div>
                    ) : (
                        <div className="border border-border overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-border bg-[hsl(var(--surface))] uppercase tracking-wider text-[0.62rem] text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3">Subject & Headline</th>
                                        <th className="px-4 py-3">Audience Filter</th>
                                        <th className="px-4 py-3">Recipients</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Date Dispatched</th>
                                        <th className="px-4 py-3">Sent By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {campaigns.map((c) => (
                                        <tr key={c.id} className="hover:bg-[hsl(var(--surface))]/40">
                                            <td className="px-4 py-3">
                                                <p className="font-semibold text-foreground">{c.subject}</p>
                                                {c.headline && <p className="text-[0.68rem] text-[hsl(var(--gold))]">{c.headline}</p>}
                                                {c.previewText && <p className="text-[0.68rem] text-muted-foreground truncate max-w-xs">{c.previewText}</p>}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {c.targetInterest === 'all' && c.targetCountry === 'all'
                                                    ? 'All Subscribers'
                                                    : `${c.targetInterest !== 'all' ? c.targetInterest : 'Any Interest'}${c.targetCountry !== 'all' ? ` (${c.targetCountry})` : ''}`}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-foreground">
                                                {c.recipientCount || 0}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="inline-block border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[0.62rem] uppercase tracking-wider text-emerald-400">
                                                    {c.status || 'SENT'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                                {fmtDateTime(c.sentAt || c.createdAt)}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {c.sender?.name || c.sender?.email || 'Admin'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Panel>
            )}

            {/* ─── Confirmation Modal Before Mass Broadcast ─── */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="border border-border bg-card max-w-md w-full p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <h4 className="font-serif text-lg font-semibold text-foreground">Confirm Broadcast</h4>
                            <button type="button" onClick={() => setShowConfirmModal(false)} className="text-muted-foreground hover:text-foreground">
                                <X size={16} />
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            You are about to broadcast the following newsletter campaign:
                        </p>
                        <div className="border border-border bg-secondary/30 p-3 space-y-1.5 text-xs">
                            <p><strong className="text-foreground">Subject:</strong> {form.subject}</p>
                            {form.headline && <p><strong className="text-foreground">Headline:</strong> {form.headline}</p>}
                            <p><strong className="text-foreground">Recipients:</strong> {targetSubscribers.length} subscriber(s)</p>
                            <p><strong className="text-foreground">Target:</strong> {form.targetInterest === 'all' ? 'All interests' : form.targetInterest}, {form.targetCountry === 'all' ? 'All countries' : form.targetCountry}</p>
                            <p><strong className="text-foreground">Delivery Mode:</strong> {smtpStatus?.configured ? 'Live SMTP' : 'Console Simulation'}</p>
                        </div>
                        <p className="text-[0.68rem] text-muted-foreground italic">
                            This action will immediately transmit this email to all matching subscribers.
                        </p>
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(false)}
                                className="border border-border px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleBroadcast}
                                disabled={isSending}
                                className="bg-[hsl(var(--gold))] px-5 py-2 text-xs font-bold uppercase tracking-wider text-black transition-opacity hover:opacity-90 disabled:opacity-40"
                            >
                                {isSending ? 'Transmitting...' : 'Confirm & Send Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewsletterBroadcastPanel;
