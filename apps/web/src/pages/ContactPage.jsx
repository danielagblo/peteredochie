import React, { useState } from 'react';
import { PageHead, PageHero, Section, SectionTitle } from '@/components/Section';
import { IMG, PUBLISHER } from '@/lib/content';
import { useToast } from '@/hooks/use-toast';
import { composeWhatsApp, openWhatsApp, whatsappHref } from '@/lib/whatsapp';
import { apiCrud } from '@/lib/api';

const SUBJECTS = [
    'General enquiry',
    'Media & press',
    'Booking & appearances',
    'Partnership',
    'Sponsorship',
    'Book orders',
    'Publishing & rights',
];

const ContactPage = () => {
    const { toast } = useToast();
    const [form, setForm] = useState({ name: '', email: '', organisation: '', subject: SUBJECTS[0], message: '' });
    const [sending, setSending] = useState(null);
    const [sent, setSent] = useState(false);
    const [sentVia, setSentVia] = useState('');

    const validate = () => {
        if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
            toast({ title: 'Missing details', description: 'Please complete name, email and message.' });
            return false;
        }
        return true;
    };

    const saveEnquiry = async () => {
        try {
            await apiCrud.create('enquiries', form);
        } catch (_) {
            /* Channel delivery is primary; record is best-effort */
        }
    };

    const resetForm = () => {
        setForm({ name: '', email: '', organisation: '', subject: SUBJECTS[0], message: '' });
    };

    const sendViaWhatsApp = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSending('whatsapp');
        const text = composeWhatsApp('Contact enquiry', {
            Name: form.name,
            Email: form.email,
            Organisation: form.organisation,
            Subject: form.subject,
            Message: form.message,
        });
        openWhatsApp(text);
        await saveEnquiry();
        setSentVia('whatsapp');
        setSent(true);
        resetForm();
        toast({ title: 'Opening WhatsApp', description: 'Your message is ready to send to the Pete Edochie Legacy team.' });
        setSending(null);
    };

    const sendViaEmail = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSending('email');
        const body = [
            `Name: ${form.name}`,
            `Email: ${form.email}`,
            form.organisation ? `Organisation: ${form.organisation}` : '',
            `Subject: ${form.subject}`,
            '',
            form.message,
        ]
            .filter(Boolean)
            .join('\n');
        const mailto = `mailto:${PUBLISHER.email}?subject=${encodeURIComponent(`Contact, ${form.subject}`)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailto;
        await saveEnquiry();
        setSentVia('email');
        setSent(true);
        resetForm();
        toast({ title: 'Opening email', description: `Your message is ready to send to ${PUBLISHER.email}.` });
        setSending(null);
    };

    const field = 'w-full border border-border bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[hsl(var(--gold))]';

    return (
        <div>
            <PageHead
                title="Contact & Enquiries | The Pete Edochie Legacy | King Dawie Publishing"
                description="Contact King Dawie Publishing, official owner and rights holder of the Pete Edochie Legacy, for media, bookings, publishing, rights and licensing, partnership, sponsorship and general enquiries."
            />
            <PageHero
                eyebrow="Contact"
                title={<>The Pete Edochie<br />Legacy</>}
                lead="Media, bookings, publishing and rights, partnership, sponsorship and general enquiries for the Pete Edochie Legacy are administered by King Dawie Publishing."
                image={IMG.cover}
            />

            <Section className="grid gap-14 py-24 md:grid-cols-[1fr_1.1fr] md:py-32" width="max-w-[80rem]">
                <div>
                    <SectionTitle eyebrow="Reach us" title="Write to the Legacy" />
                    <div className="mt-10 space-y-8 text-sm">
                        {[
                            ['Publisher & rights holder', PUBLISHER.name],
                            ['WhatsApp', PUBLISHER.phoneDisplay],
                            ['Publishing & rights', PUBLISHER.email],
                            ['Response time', 'Within three working days'],
                            ['Press', 'Please state your outlet and deadline'],
                        ].map(([k, v]) => (
                            <div key={k} className="border-t border-border pt-5">
                                <p className="text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground">{k}</p>
                                {k === 'WhatsApp' ? (
                                    <a
                                        href={whatsappHref(`Hello ${PUBLISHER.name}. I am writing from the Pete Edochie Legacy platform.`)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 inline-block font-display text-2xl text-[hsl(var(--gold))] transition-colors hover:text-foreground"
                                    >
                                        {v}
                                    </a>
                                ) : k === 'Publishing & rights' ? (
                                    <a
                                        href={`mailto:${PUBLISHER.email}`}
                                        className="mt-2 inline-block font-display text-2xl text-[hsl(var(--gold))] transition-colors hover:text-foreground"
                                    >
                                        {v}
                                    </a>
                                ) : (
                                    <p className="mt-2 font-display text-2xl">{v}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border border-border p-8 md:p-10">
                    {sent ? (
                        <div>
                            <p className="font-display text-3xl text-[hsl(var(--gold))]">Thank you.</p>
                            <p className="mt-3 text-sm text-muted-foreground">
                                {sentVia === 'email'
                                    ? 'Your email client should have opened with the message. If it did not, write to us directly.'
                                    : 'WhatsApp should have opened with your message. If it did not, use the green button on this page.'}
                            </p>
                            <button type="button" onClick={() => setSent(false)} className="mt-8 text-[0.68rem] uppercase tracking-[0.2em] text-[hsl(var(--gold))]">
                                Send another message
                            </button>
                        </div>
                    ) : (
                        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <label htmlFor="c-name" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Name</label>
                                    <input id="c-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
                                </div>
                                <div className="grid gap-2">
                                    <label htmlFor="c-email" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Email</label>
                                    <input id="c-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="c-org" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Organisation (optional)</label>
                                <input id="c-org" value={form.organisation} onChange={(e) => setForm({ ...form, organisation: e.target.value })} className={field} />
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="c-sub" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Subject</label>
                                <select id="c-sub" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={field}>
                                    {SUBJECTS.map((s) => (
                                        <option key={s} value={s} className="bg-background">
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <label htmlFor="c-msg" className="text-[0.66rem] uppercase tracking-[0.2em] text-muted-foreground">Message</label>
                                <textarea id="c-msg" required rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={field} />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={sendViaWhatsApp}
                                    disabled={!!sending}
                                    className="w-full bg-[hsl(var(--primary))] py-4 text-[0.7rem] uppercase tracking-[0.24em] text-[hsl(var(--primary-foreground))] transition-transform active:scale-[0.99] disabled:opacity-60"
                                >
                                    {sending === 'whatsapp' ? 'Opening WhatsApp…' : 'Send via WhatsApp'}
                                </button>
                                <button
                                    type="button"
                                    onClick={sendViaEmail}
                                    disabled={!!sending}
                                    className="w-full border border-border py-4 text-[0.7rem] uppercase tracking-[0.24em] transition-colors hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))] disabled:opacity-60"
                                >
                                    {sending === 'email' ? 'Opening email…' : 'Send via Email'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </Section>
        </div>
    );
};

export default ContactPage;
