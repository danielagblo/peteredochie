import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { COUNTRIES } from '@/lib/countries';
import { composeWhatsApp, openWhatsApp } from '@/lib/whatsapp';
import { apiCrud } from '@/lib/api';

const field = 'w-full border border-border bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[hsl(var(--gold))]';

const BookPreregistrationForm = ({ product }) => {
    const { user, isAuthed } = useAuth();
    const { toast } = useToast();
    const [form, setForm] = useState({
        full_name: '',
        email: '',
        phone: '',
        country: 'GH',
        city: '',
        quantity: 1,
        notes: '',
    });
    const [sending, setSending] = useState(false);
    const [done, setDone] = useState(false);
    const [submittedQty, setSubmittedQty] = useState(1);

    useEffect(() => {
        if (!user) return;
        setForm((prev) => ({
            ...prev,
            full_name: prev.full_name || user.name || '',
            email: prev.email || user.email || '',
            phone: prev.phone || user.phone || '',
            country: prev.country || user.country || 'GH',
        }));
    }, [user]);

    const submit = async (e) => {
        e.preventDefault();
        if (!product?.id) return;
        setSending(true);

        const edition = product.edition || product.name;
        openWhatsApp(
            composeWhatsApp(`Book pre-registration — ${edition}`, {
                Name: form.full_name,
                Email: form.email,
                Phone: form.phone,
                Country: COUNTRIES.find((c) => c.code === form.country)?.name || form.country,
                City: form.city,
                Edition: edition,
                Quantity: form.quantity,
                Notes: form.notes,
            }),
        );

        try {
            await apiCrud.create('book-preregistrations', {
                product: product.id,
                full_name: form.full_name,
                email: form.email,
                phone: form.phone,
                country: COUNTRIES.find((c) => c.code === form.country)?.name || form.country,
                city: form.city,
                quantity: Number(form.quantity) || 1,
                notes: form.notes,
                edition,
            });
        } catch (_) {
            /* WhatsApp is the primary channel */
        }

        setDone(true);
        setSubmittedQty(Number(form.quantity) || 1);
        setForm({ full_name: '', email: '', phone: '', country: 'GH', city: '', quantity: 1, notes: '' });
        toast({
            title: 'Pre-registration received',
            description: 'Your interest in this edition has been recorded. WhatsApp should have opened to confirm with the publishing office.',
        });
        setSending(false);
    };

    if (done) {
        return (
            <div className="border border-[hsl(var(--gold))]/40 bg-[hsl(var(--surface))] p-8">
                <p className="font-display text-2xl text-[hsl(var(--gold))]">Thank you.</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Your pre-registration for <span className="text-foreground">{product.edition || product.name}</span> ({submittedQty} {submittedQty === 1 ? 'copy' : 'copies'}) is on file.
                    The publishing office will contact you when this edition is ready to order.
                </p>
                <button
                    type="button"
                    onClick={() => setDone(false)}
                    className="mt-6 text-[0.68rem] uppercase tracking-[0.2em] text-[hsl(var(--gold))]"
                >
                    Register another person
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="border border-border bg-[hsl(var(--surface))] p-8 md:p-10">
            <p className="eyebrow">Pre-register</p>
            <h2 className="mt-3 font-display text-3xl">Reserve your interest</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Leave your details to pre-register for <span className="text-foreground">{product.edition || product.name}</span>.
                The team will notify you when ordering opens — no payment is taken now.
            </p>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2 sm:col-span-2">
                    <label htmlFor="pr-name" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Full name</label>
                    <input id="pr-name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={field} />
                </div>
                <div className="grid gap-2">
                    <label htmlFor="pr-email" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Email</label>
                    <input id="pr-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} />
                </div>
                <div className="grid gap-2">
                    <label htmlFor="pr-phone" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Phone / WhatsApp</label>
                    <input id="pr-phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={field} />
                </div>
                <div className="grid gap-2">
                    <label htmlFor="pr-country" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Country</label>
                    <select id="pr-country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className={field}>
                        {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code} className="bg-background">{c.name}</option>
                        ))}
                    </select>
                </div>
                <div className="grid gap-2">
                    <label htmlFor="pr-city" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">City</label>
                    <input id="pr-city" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={field} />
                </div>
                <div className="grid gap-2">
                    <label htmlFor="pr-qty" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Number of copies</label>
                    <input
                        id="pr-qty"
                        type="number"
                        min={1}
                        max={99}
                        required
                        value={form.quantity}
                        onChange={(e) => setForm({ ...form, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                        className={field}
                    />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                    <label htmlFor="pr-notes" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Notes (optional)</label>
                    <textarea id="pr-notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={field} placeholder="Signed copy preference, gift message…" />
                </div>
            </div>

            <button
                type="submit"
                disabled={sending}
                className="mt-8 w-full bg-[hsl(var(--primary))] py-4 text-[0.7rem] uppercase tracking-[0.24em] text-white transition-transform active:scale-[0.99] disabled:opacity-60"
            >
                {sending ? (
                    <span className="inline-flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> Submitting…</span>
                ) : (
                    'Pre-register for this edition'
                )}
            </button>
        </form>
    );
};

export default BookPreregistrationForm;
