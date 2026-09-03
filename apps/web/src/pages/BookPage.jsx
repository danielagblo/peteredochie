import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, Loader2 } from 'lucide-react';
import Reveal from '@/components/Reveal';
import { PageHead, PageHero, Section, SectionTitle } from '@/components/Section';
import { IMG, PUBLISHER } from '@/lib/content';
import { groupBooksByCategory } from '@/lib/books';
import { fetchBookPreregStats } from '@/lib/bookStats';
import { formatUSD, isRedirectOnly } from '@/lib/commerce';
import { apiCrud } from '@/lib/api';
import CountUp from '@/components/CountUp';

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
        return (
            <Reveal key={p.id}>
                <div className="flex h-full flex-col bg-[hsl(var(--surface))] p-7">
                    <p className="text-[0.6rem] uppercase tracking-[0.22em] text-muted-foreground">
                        {p.format === 'hardcopy' ? 'Hardcopy' : 'Digital'} · {p.status === 'preorder' ? 'Preorder' : p.status === 'main_order' ? 'Available' : 'Unavailable'}
                    </p>
                    <p className="mt-3 font-display text-2xl">{p.edition || p.name}</p>
                    {p.author ? <p className="mt-2 text-xs text-muted-foreground">{p.author}{p.published_year ? ` · ${p.published_year}` : ''}</p> : null}
                    <p className="mt-3 font-display text-3xl text-[hsl(var(--gold))]">{formatUSD(p.price)}</p>
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-4">{p.excerpt || p.description}</p>
                    {p.isbn ? <p className="mt-3 text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">ISBN {p.isbn}</p> : null}

                    {redirect ? (
                        <a
                            href={p.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-7 flex items-center justify-center gap-2 border border-border py-3.5 text-[0.66rem] uppercase tracking-[0.22em] transition-colors hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]"
                        >
                            <ExternalLink size={13} strokeWidth={1.6} /> Buy on Amazon
                        </a>
                    ) : (
                        <Link
                            to={`/book/item/${p.id}`}
                            className="mt-7 flex items-center justify-center gap-2 bg-[hsl(var(--primary))] py-3.5 text-[0.66rem] uppercase tracking-[0.22em] text-white transition-transform active:scale-[0.98]"
                        >
                            View details & pre-register
                            <ArrowRight size={13} strokeWidth={1.6} />
                        </Link>
                    )}
                </div>
            </Reveal>
        );
    };

    return (
        <div>
            <PageHead
                title="The Autobiography — Preorder | Pete Edochie | King Dawie Publishing"
                description="Preorder the official Pete Edochie autobiography: signed hardcover, standard hardcover, audiobook and e-book. Published by King Dawie Publishing."
            />
            <PageHero
                eyebrow="The Autobiography"
                title="In his own cadence"
                lead="Three years of recorded conversation, edited into one volume. Published 2026 by King Dawie Publishing. Ghana activation drives preorders now."
                image={IMG.book}
            />

            <Section className="grid gap-14 py-24 md:grid-cols-[1fr_1fr] md:py-32" width="max-w-[80rem]">
                <Reveal>
                    <img src={IMG.book} alt="The autobiography hardcover edition" className="w-full object-cover" />
                </Reveal>
                <div>
                    <SectionTitle eyebrow="Extract" title="Chapter one, opening" />
                    <div className="mt-8 space-y-5 border-l border-[hsl(var(--gold))]/50 pl-7 text-base leading-[1.95] text-muted-foreground">
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
                </div>
            </Section>

            {preregStats.totalRegistrations > 0 ? (
                <div className="border-y border-border bg-background py-12">
                    <Section width="max-w-[80rem]">
                        <div className="flex flex-wrap items-center gap-8 md:gap-16">
                            <div>
                                <p className="font-display text-4xl text-[hsl(var(--gold))]">
                                    <CountUp value={preregStats.totalCopies} />
                                </p>
                                <p className="mt-2 text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground">Copies pre-ordering</p>
                            </div>
                            <div>
                                <p className="font-display text-4xl text-[hsl(var(--gold))]">
                                    <CountUp value={preregStats.totalRegistrations} />
                                </p>
                                <p className="mt-2 text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground">Registrations</p>
                            </div>
                            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                                Readers across the continent are reserving their editions ahead of the Ghana launch. Pre-register now — no payment is taken at this stage.
                            </p>
                        </div>
                    </Section>
                </div>
            ) : null}

            <div className="border-y border-border bg-[hsl(var(--surface))] py-24 md:py-32">
                <Section width="max-w-[80rem]">
                    <SectionTitle
                        eyebrow="Editions"
                        title="Choose your edition"
                        lead="Browse each edition, read the full details, and pre-register your interest. No payment is taken at this stage."
                    />

                    {loading ? (
                        <div className="mt-14 flex items-center gap-3 text-sm text-muted-foreground">
                            <Loader2 size={16} className="animate-spin" /> Loading editions…
                        </div>
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
                                    <div className="grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
                                        {books.map((p) => renderEdition(p))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <p className="mt-10 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                        Select an edition to view full book details and submit a pre-registration. The publishing office will contact you when ordering opens.
                    </p>

                    <div className="mt-10 border-t border-border pt-8">
                        <p className="eyebrow">Imprint</p>
                        <p className="mt-3 font-display text-2xl text-[hsl(var(--gold))]">{PUBLISHER.name}</p>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                            The autobiography is published and distributed worldwide by {PUBLISHER.name}, the official publisher
                            and rights holder of the Pete Edochie Legacy. All editions carry the {PUBLISHER.name} imprint.
                            Rights, licensing and bulk-order inquiries are handled by the publishing office.
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
