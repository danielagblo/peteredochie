import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ShoppingCart, Loader2 } from 'lucide-react';
import Reveal from '@/components/Reveal';
import { PageHead, PageHero, Section, SectionTitle } from '@/components/Section';
import { IMG, PUBLISHER } from '@/lib/content';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatUSD, isRedirectOnly, isPurchasable } from '@/lib/commerce';
import pb from '@/lib/pocketbaseClient';

const BookPage = () => {
    const { items, add } = useCart();
    const { isAuthed } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [added, setAdded] = useState(null);

    useEffect(() => {
        pb.collection('products')
            .getFullList({
                filter: `product_type = "book" && enabled = true`,
                sort: 'price',
                requestKey: 'book-catalog',
            })
            .then(setProducts)
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    }, []);

    const handleAdd = (product) => {
        add(product.id, 1);
        setAdded(product.id);
        setTimeout(() => setAdded(null), 1800);
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

            <div className="border-y border-border bg-[hsl(var(--surface))] py-24 md:py-32">
                <Section width="max-w-[80rem]">
                    <SectionTitle
                        eyebrow="Editions"
                        title="Choose your edition"
                        lead="Preorders are open for the Ghana activation. Hardcopy editions ship with tracking; digital editions are fulfilled through Amazon."
                    />

                    {loading ? (
                        <div className="mt-14 flex items-center gap-3 text-sm text-muted-foreground">
                            <Loader2 size={16} className="animate-spin" /> Loading editions…
                        </div>
                    ) : (
                        <div className="mt-14 grid gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
                            {products.map((p, i) => {
                                const redirect = isRedirectOnly(p);
                                const purchasable = isPurchasable(p);
                                const inCart = items.find((it) => it.product_id === p.id);
                                return (
                                    <Reveal key={p.id} delay={i * 0.05}>
                                        <div className="flex h-full flex-col bg-[hsl(var(--surface))] p-7">
                                            <p className="text-[0.6rem] uppercase tracking-[0.22em] text-muted-foreground">
                                                {p.format === 'hardcopy' ? 'Hardcopy' : 'Digital'} · {p.status === 'preorder' ? 'Preorder' : p.status === 'main_order' ? 'Available' : 'Unavailable'}
                                            </p>
                                            <p className="mt-3 font-display text-2xl">{p.edition || p.name}</p>
                                            <p className="mt-3 font-display text-3xl text-[hsl(var(--gold))]">{formatUSD(p.price)}</p>
                                            <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">{p.description}</p>

                                            {redirect ? (
                                                <a
                                                    href={p.external_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mt-7 flex items-center justify-center gap-2 border border-border py-3.5 text-[0.66rem] uppercase tracking-[0.22em] transition-colors hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]"
                                                >
                                                    <ExternalLink size={13} strokeWidth={1.6} /> Buy on Amazon
                                                </a>
                                            ) : purchasable ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleAdd(p)}
                                                    className="mt-7 flex items-center justify-center gap-2 bg-[hsl(var(--primary))] py-3.5 text-[0.66rem] uppercase tracking-[0.22em] text-white transition-transform active:scale-[0.98]"
                                                >
                                                    <ShoppingCart size={13} strokeWidth={1.6} />
                                                    {added === p.id ? 'Added to cart' : inCart ? `In cart (${inCart.quantity}) — add another` : 'Add to cart'}
                                                </button>
                                            ) : (
                                                <p className="mt-7 border border-dashed border-border py-3.5 text-center text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">
                                                    Not available yet
                                                </p>
                                            )}
                                        </div>
                                    </Reveal>
                                );
                            })}
                        </div>
                    )}

                    <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                        <p className="text-xs text-muted-foreground">
                            {isAuthed ? (
                                <Link to="/checkout" className="text-[hsl(var(--gold))]">Review cart & checkout →</Link>
                            ) : (
                                'Sign in at checkout to complete your preorder.'
                            )}
                        </p>
                        <Link
                            to="/checkout"
                            className="border border-[hsl(var(--gold))]/60 px-6 py-3 text-[0.66rem] uppercase tracking-[0.22em] text-[hsl(var(--gold))] transition-colors hover:bg-[hsl(var(--gold))] hover:text-black"
                        >
                            View cart & checkout
                        </Link>
                    </div>

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
