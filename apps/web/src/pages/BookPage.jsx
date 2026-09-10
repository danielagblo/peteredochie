import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, ExternalLink, Loader2, MessageCircle } from 'lucide-react';
import Reveal from '@/components/Reveal';
import CountUp from '@/components/CountUp';
import { PageHead, PageHero, Section, SectionTitle } from '@/components/Section';
import { BOOK, IMG, LEGACY, PUBLISHER } from '@/lib/content';
import { groupBooksByCategory } from '@/lib/books';
import { fetchBookPreregStats } from '@/lib/bookStats';
import { formatUSD, isRedirectOnly } from '@/lib/commerce';
import { composeWhatsApp, whatsappHref } from '@/lib/whatsapp';
import { apiCrud } from '@/lib/api';

const orderViaWhatsAppHref = (edition) =>
    whatsappHref(
        composeWhatsApp('Book pre-order via WhatsApp', {
            Edition: edition || BOOK.title,
            Intent: 'I would like to pre-order this edition and need assistance completing my order.',
        }),
    );

const BookPage = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [preregStats, setPreregStats] = useState({ totalCopies: 0, totalRegistrations: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            apiCrud.list('products', {
                filter: `product_type = "book" && enabled = true`,
                sort: 'price',
            }),
            apiCrud.list('book-categories', { sort: 'sort' }).catch(() => []),
            fetchBookPreregStats().catch(() => ({ totalCopies: 0, totalRegistrations: 0 })),
        ])
            .then(([prods, cats, stats]) => {
                setProducts(prods);
                const enabledCats = (cats || []).filter((c) => c.enabled !== false);
                setCategories(enabledCats.length ? enabledCats : [{ id: '', name: 'All editions', sort: 0 }]);
                setPreregStats(stats);
            })
            .catch(() => {
                setProducts([]);
                setCategories([]);
            })
            .finally(() => setLoading(false));
    }, []);

    const grouped = groupBooksByCategory(products, categories);

    const renderEdition = (p) => {
        const redirect = isRedirectOnly(p);
        const statusLabel = p.status === 'preorder' ? 'Preorder' : p.status === 'main_order' ? 'Available' : 'Unavailable';
        const formatLabel = p.format === 'hardcopy' ? 'Hardcover' : 'Digital';

        return (
            <Reveal key={p.id}>
                <article className="group flex h-full flex-col overflow-hidden border border-border bg-background transition-colors hover:border-[hsl(var(--gold))]/50">
                    <div className="relative aspect-[3/4] overflow-hidden bg-[hsl(var(--surface))]">
                        <img
                            src={p.image || IMG.book}
                            alt={p.edition || p.name}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 pt-16">
                            <p className="text-[0.58rem] uppercase tracking-[0.22em] text-white/75">
                                {formatLabel} · {statusLabel}
                            </p>
                            <p className="mt-1 font-display text-2xl text-white">{p.edition || p.name}</p>
                        </div>
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                        {p.author ? (
                            <p className="text-xs text-muted-foreground">
                                {p.author}{p.published_year ? ` · ${p.published_year}` : ''}
                            </p>
                        ) : null}
                        <p className="mt-3 font-display text-3xl text-[hsl(var(--gold))]">{formatUSD(p.price)}</p>
                        <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                            {p.excerpt || p.description}
                        </p>
                        {p.isbn ? (
                            <p className="mt-4 text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">ISBN {p.isbn}</p>
                        ) : null}

                        {redirect ? (
                            <a
                                href={p.external_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-6 flex items-center justify-center gap-2 border border-border py-3.5 text-[0.66rem] uppercase tracking-[0.22em] transition-colors hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]"
                            >
                                <ExternalLink size={13} strokeWidth={1.6} /> Buy on Amazon
                            </a>
                        ) : (
                            <div className="mt-6 space-y-3">
                                <Link
                                    to={`/book/item/${p.id}`}
                                    className="flex items-center justify-center gap-2 bg-[hsl(var(--primary))] py-3.5 text-[0.66rem] uppercase tracking-[0.22em] text-[hsl(var(--primary-foreground))] transition-transform active:scale-[0.98]"
                                >
                                    Preorder &amp; pay
                                    <ArrowRight size={13} strokeWidth={1.6} />
                                </Link>
                                <a
                                    href={orderViaWhatsAppHref(p.edition || p.name)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 border border-border py-3.5 text-[0.66rem] uppercase tracking-[0.22em] transition-colors hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]"
                                >
                                    <MessageCircle size={13} strokeWidth={1.6} /> Order via WhatsApp
                                </a>
                            </div>
                        )}
                    </div>
                </article>
            </Reveal>
        );
    };

    return (
        <div>
            <PageHead
                title={`${BOOK.title} | Preorder | Pete Edochie | King Dawie Publishing`}
                description={BOOK.shortDescription}
            />
            <PageHero
                eyebrow="The Autobiography"
                title={BOOK.title}
                lead={`${BOOK.tagline}. ${BOOK.shortDescription}`}
                image={IMG.cover}
            />

            <Section className="grid gap-14 py-24 md:grid-cols-[0.9fr_1.1fr] md:items-start md:py-32" width="max-w-[80rem]">
                <Reveal>
                    <div className="relative mx-auto w-full max-w-md">
                        <div className="absolute -inset-3 rotate-[-2deg] border border-[hsl(var(--gold))]/30" />
                        <img src={IMG.book} alt={`${BOOK.title} hardcover edition`} className="relative w-full object-cover shadow-2xl" />
                    </div>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <a
                            href="#editions"
                            className="inline-flex items-center justify-center gap-2 bg-[hsl(var(--primary))] px-6 py-3.5 text-[0.68rem] uppercase tracking-[0.24em] text-[hsl(var(--primary-foreground))] transition-transform active:scale-[0.98]"
                        >
                            Pre-Order Now
                            <ArrowRight size={14} strokeWidth={1.6} />
                        </a>
                        <a
                            href={orderViaWhatsAppHref()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 border border-border px-6 py-3.5 text-[0.68rem] uppercase tracking-[0.24em] transition-colors hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]"
                        >
                            <MessageCircle size={14} strokeWidth={1.6} /> Order via WhatsApp
                        </a>
                    </div>
                    <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                        Select an edition, enter your details, pay securely, or message us on WhatsApp if you need help.
                        Confirmation may arrive by email and SMS.
                    </p>
                </Reveal>
                <div className="space-y-12">
                    <div>
                        <SectionTitle eyebrow="Why this book" title={BOOK.tagline} lead={BOOK.shortDescription} />
                    </div>
                    <div>
                        <p className="eyebrow">Key lessons</p>
                        <ul className="mt-5 space-y-3">
                            {BOOK.lessons.map((lesson) => (
                                <li key={lesson} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                                    <span className="mt-2 h-px w-4 shrink-0 bg-[hsl(var(--gold))]" />
                                    {lesson}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <p className="eyebrow">Who it is for</p>
                        <p className="mt-4 text-base leading-[1.85] text-muted-foreground">{BOOK.whoItsFor}</p>
                    </div>
                    <div>
                        <p className="eyebrow">Why you should read it</p>
                        <p className="mt-4 text-base leading-[1.85] text-muted-foreground">{BOOK.whyRead}</p>
                    </div>
                    <Link to={LEGACY.bioPath} className="inline-flex items-center gap-3 text-[0.72rem] uppercase tracking-[0.24em] text-[hsl(var(--gold))]">
                        Meet the author <ArrowRight size={14} strokeWidth={1.6} />
                    </Link>
                </div>
            </Section>

            <Section className="grid gap-14 border-t border-border py-24 md:grid-cols-[0.9fr_1.1fr] md:items-center md:py-32" width="max-w-[80rem]">
                <Reveal>
                    <SectionTitle eyebrow="Extract" title="Chapter one, opening" />
                </Reveal>
                <div className="space-y-5 border-l border-[hsl(var(--gold))]/50 pl-7 text-base leading-[1.95] text-muted-foreground">
                    <p className="font-display text-2xl italic leading-snug text-foreground">
                        &ldquo;My father did not raise his voice. That is the whole inheritance; everything else is detail.&rdquo;
                    </p>
                    <p>
                        In our compound, a proverb was not an ornament. It was an instruction with the sharp edges sanded
                        off, so that a child could carry it without cutting himself. By the time I understood what I had
                        been given, I had already spent it on a career.
                    </p>
                    <p>
                        People ask me how I prepared for Okonkwo. The honest answer is that I did not. I had been
                        rehearsing him at every family meeting of my childhood, listening to men who knew that dignity
                        and stubbornness live in the same house.
                    </p>
                </div>
            </Section>

            {preregStats.totalRegistrations > 0 ? (
                <div className="border-y border-border bg-[hsl(var(--primary))] py-14 text-[hsl(var(--primary-foreground))]">
                    <Section width="max-w-[80rem]">
                        <div className="flex flex-wrap items-center gap-10 md:gap-16">
                            <div className="flex items-center gap-4">
                                <BookOpen size={28} strokeWidth={1.4} className="text-white/85" />
                                <div>
                                    <p className="font-display text-4xl">
                                        <CountUp value={preregStats.totalCopies} />
                                    </p>
                                    <p className="mt-1 text-[0.65rem] uppercase tracking-[0.22em] text-white/65">Copies reserved</p>
                                </div>
                            </div>
                            <div>
                                <p className="font-display text-4xl">
                                    <CountUp value={preregStats.totalRegistrations} />
                                </p>
                                <p className="mt-1 text-[0.65rem] uppercase tracking-[0.22em] text-white/65">Preorders</p>
                            </div>
                            <p className="max-w-md text-sm leading-relaxed text-white/75">
                                Readers across the continent are securing their editions ahead of the Ghana launch. Payment confirms your copy.
                            </p>
                        </div>
                    </Section>
                </div>
            ) : null}

            <div id="editions" className="scroll-mt-28 border-b border-border bg-[hsl(var(--surface))] py-24 md:py-32">
                <Section width="max-w-[80rem]">
                    <SectionTitle
                        eyebrow="Editions"
                        title="Choose your edition"
                        lead="Select a book → enter your details → make payment → receive confirmation by email and SMS. Prefer help? Order via WhatsApp."
                    />

                    {loading ? (
                        <div className="mt-14 flex items-center gap-3 text-sm text-muted-foreground">
                            <Loader2 size={16} className="animate-spin" /> Loading editions…
                        </div>
                    ) : products.length === 0 ? (
                        <p className="mt-14 text-sm text-muted-foreground">Editions will appear here shortly.</p>
                    ) : (
                        <div className="mt-14 space-y-16">
                            {grouped.map(({ category, books }) => (
                                <div key={category.id || 'uncategorised'}>
                                    <div className="mb-8 max-w-2xl">
                                        <p className="eyebrow">{category.name}</p>
                                        {category.description ? (
                                            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{category.description}</p>
                                        ) : null}
                                    </div>
                                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                        {books.map((p) => renderEdition(p))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-16 border-t border-border pt-10">
                        <p className="eyebrow">Imprint</p>
                        <p className="mt-3 font-display text-2xl text-[hsl(var(--gold))]">{PUBLISHER.name}</p>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                            The autobiography is published and distributed worldwide by {PUBLISHER.name}, the official publisher
                            and rights holder of the Pete Edochie Legacy. All editions carry the {PUBLISHER.name} imprint.
                        </p>
                        <Link to="/contact" className="mt-5 inline-block text-[0.7rem] uppercase tracking-[0.22em] text-[hsl(var(--gold))]">
                            Publishing &amp; rights inquiries
                        </Link>
                    </div>
                </Section>
            </div>
        </div>
    );
};

export default BookPage;
