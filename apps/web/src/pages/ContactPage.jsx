import React, { useState } from 'react';
import { PageHead, PageHero, Section, SectionTitle } from '@/components/Section';
import { IMG, PUBLISHER } from '@/lib/content';
import { useToast } from '@/hooks/use-toast';
import { composeWhatsApp, openWhatsApp, whatsappHref } from '@/lib/whatsapp';
import { apiCrud } from '@/lib/api';

const SUBJECTS = ['General enquiry', 'Media & press', 'Booking & appearances', 'Partnership', 'Book orders', 'Publishing & rights'];

const ContactPage = () => {
    const { toast } = useToast();
    const [form, setForm] = useState({ name: '', email: '', organisation: '', subject: SUBJECTS[0], message: '' });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setSending(true);
        const text = composeWhatsApp('Contact enquiry', {
            Name: form.name,
            Email: form.email,
            Organisation: form.organisation,
            Subject: form.subject,
            Message: form.message,
        });
        openWhatsApp(text);
        try {
            await apiCrud.create('enquiries', form);
        } catch (_) {
            /* WhatsApp is the primary channel */
        }
        setSent(true);
        setForm({ name: '', email: '', organisation: '', subject: SUBJECTS[0], message: '' });
        toast({ title: 'Opening WhatsApp', description: 'Your message is ready to send to the publishing office.' });
        setSending(false);
    };

    const field = 'w-full border border-border bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-[hsl(var(--gold))]';

    return (
        <div>
            <PageHead
                title="Contact & Enquiries | The Peter Edochie Legacy | King Dawie Publishing"
                description="Contact King Dawie Publishing, official owner and rights holder of the Peter Edochie Legacy, for media, bookings, publishing, rights and licensing, partnership and general enquiries."
            />
            <PageHero eyebrow="Contact" title="The office" lead="Media, bookings, publishing & rights, partnership and general enquiries are handled by the legacy office in Lagos, administered by King Dawie Publishing." image={IMG.cover} />

            <Section className="grid gap-14 py-24 md:grid-cols-[1fr_1.1fr] md:py-32" width="max-w-[80rem]">
                <div>
                    <SectionTitle eyebrow="Reach us" title="Write to the office" />
                    <div className="mt-10 space-y-8 text-sm">
                        {[
                            ['Office', 'Victoria Island, Lagos, Nigeria'],
                            ['Archive', 'Nteje, Anambra State, Nigeria'],
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
                                        href={whatsappHref(`Hello ${PUBLISHER.name}. I am writing from the Peter Edochie Legacy platform.`)}
                                        target="_blank"
                                        rel="noopener noreferrer"
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
                    <div className="mt-10 border border-border p-6">
                        <p className="eyebrow">Publishing &amp; rights</p>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                            All publishing, licensing, translation, broadcast and rights inquiries relating to the
                            autobiography, the events or the archive are administered by {PUBLISHER.name}. Select
                            <span className="text-foreground"> Publishing &amp; rights</span> in the form and your
                            message is routed directly to the publishing office.
                        </p>
                    </div>
                </div>

                <div className="border border-border p-8 md:p-10">
                    {sent ? (
                        <div>
                            <p className="font-display text-3xl text-[hsl(var(--gold))]">Thank you.</p>
                            <p className="mt-3 text-sm text-muted-foreground">WhatsApp should have opened with your message. If it did not, use the green button on this page.</p>
                            <button type="button" onClick={() => setSent(false)} className="mt-8 text-[0.68rem] uppercase tracking-[0.2em] text-[hsl(var(--gold))]">
                                Send another message
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={submit} className="space-y-5">
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
                            <button
                                type="submit"
                                disabled={sending}
                                className="w-full bg-[hsl(var(--primary))] py-4 text-[0.7rem] uppercase tracking-[0.24em] text-[hsl(var(--primary-foreground))] transition-transform active:scale-[0.99] disabled:opacity-60"
                            >
                                {sending ? 'Opening WhatsApp…' : 'Send via WhatsApp'}
                            </button>
                        </form>
                    )}
                </div>
            </Section>
        </div>
    );
};

export default ContactPage;
