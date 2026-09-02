import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ShoppingCart, Check } from 'lucide-react';
import Reveal from '@/components/Reveal';
import { PageHead, PageHero, Section, SectionTitle } from '@/components/Section';
import { IMG } from '@/lib/content';
import { useCart } from '@/contexts/CartContext';
import { formatUSD, isPurchasable } from '@/lib/commerce';
import { apiCrud } from '@/lib/api';

const ShopPage = () => {
    const { items, add } = useCart();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [added, setAdded] = useState(null);
    const [selections, setSelections] = useState({});

    useEffect(() => {
        apiCrud
            .list('products', {
                filter: `product_type = "merchandise" && enabled = true`,
                sort: 'price',
            })
            .then(setProducts)
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    }, []);

    const variantLabel = (p) => {
        const sel = selections[p.id];
        if (!sel) return '';
        return Object.entries(sel)
            .map(([name, value]) => `${name}: ${value}`)
            .join(' · ');
    };

    const handleAdd = (p) => {
        const variants = Array.isArray(p.variants) ? p.variants : [];
        // require a choice for every variant axis
        const sel = selections[p.id] || {};
        if (variants.some((v) => !sel[v.name])) {
            setSelections((prev) => ({ ...prev, [p.id]: { ...Object.fromEntries(variants.map((v) => [v.name, sel[v.name] || ''])), __error: true } }));
            return;
        }
        add(p.id, 1, variantLabel(p));
        setAdded(p.id);
        setTimeout(() => setAdded(null), 1800);
    };

    const setVariant = (pid, name, value) => {
        setSelections((prev) => ({ ...prev, [pid]: { ...(prev[pid] || {}), [name]: value, __error: false } }));
    };

    const inCart = (p) => items.find((it) => it.product_id === p.id && (!it.variant || it.variant === variantLabel(p)));

    return (
        <div>
            <PageHead
                title="Shop — Official Merchandise | Pete Edochie Legacy | King Dawie Publishing"
                description="Official Pete Edochie Legacy merchandise: premium T-shirts, framed and limited-edition prints, tote bags, caps and homeware. Published by King Dawie Publishing."
            />
            <PageHero
                eyebrow="The Shop"
                title="Carry the legacy with you"
                lead="A curated collection of official merchandise — apparel, prints and keepsakes drawn from six decades of storytelling. Every piece is produced and shipped by King Dawie Publishing."
                image={IMG.stage}
            />

            <Section className="py-24 md:py-32" width="max-w-[90rem]">
                <SectionTitle
                    eyebrow="Merchandise"
                    title="The collection"
                    lead="All items are in stock and ship with tracking. Limited-edition pieces are numbered and sold while they last."
                />

                {loading ? (
                    <div className="mt-14 flex items-center gap-3 text-sm text-muted-foreground">
                        <Loader2 size={16} className="animate-spin" /> Loading the collection…
                    </div>
                ) : products.length === 0 ? (
                    <p className="mt-14 text-sm text-muted-foreground">The shop is being stocked. Please check back shortly.</p>
                ) : (
                    <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {products.map((p, i) => {
                            const variants = Array.isArray(p.variants) ? p.variants.filter((v) => Array.isArray(v.options) && v.options.length > 0) : [];
                            const sel = selections[p.id] || {};
                            const showError = sel.__error && variants.some((v) => !sel[v.name]);
                            const cartLine = inCart(p);
                            return (
                                <Reveal key={p.id} delay={i * 0.05}>
                                    <article className="flex h-full flex-col border border-border bg-card">
                                        <div className="relative overflow-hidden">
                                            <img
                                                src={p.image || IMG.artifact}
                                                alt={p.name}
                                                className="aspect-[4/5] w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                                            />
                                            {p.category ? (
                                                <span className="absolute left-0 top-0 bg-background/80 px-3 py-1.5 text-[0.56rem] uppercase tracking-[0.2em] text-[hsl(var(--gold))]">
                                                    {p.category}
                                                </span>
                                            ) : null}
                                            {p.status === 'preorder' ? (
                                                <span className="absolute right-0 top-0 bg-[hsl(var(--primary))] px-3 py-1.5 text-[0.56rem] uppercase tracking-[0.2em] text-white">
                                                    Preorder
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="flex flex-1 flex-col p-6">
                                            <h3 className="font-display text-2xl">{p.name}</h3>
                                            <p className="mt-2 font-display text-2xl text-[hsl(var(--gold))]">{formatUSD(p.price)}</p>
                                            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{p.description}</p>

                                            {variants.length > 0 ? (
                                                <div className="mt-5 space-y-3">
                                                    {variants.map((v) => (
                                                        <div key={v.name} className="grid gap-1.5">
                                                            <label className="text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">{v.name}</label>
                                                            <select
                                                                value={sel[v.name] || ''}
                                                                onChange={(e) => setVariant(p.id, v.name, e.target.value)}
                                                                className="w-full border border-border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[hsl(var(--gold))]"
                                                            >
                                                                <option value="" disabled>Select {v.name}</option>
                                                                {v.options.map((opt) => (
                                                                    <option key={opt} value={opt}>{opt}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    ))}
                                                    {showError ? (
                                                        <p className="text-[0.62rem] uppercase tracking-[0.16em] text-[hsl(var(--primary))]">Please choose an option for each variant.</p>
                                                    ) : null}
                                                </div>
                                            ) : null}

                                            {isPurchasable(p) ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleAdd(p)}
                                                    className="mt-6 flex items-center justify-center gap-2 bg-[hsl(var(--primary))] py-3.5 text-[0.66rem] uppercase tracking-[0.22em] text-white transition-transform active:scale-[0.98]"
                                                >
                                                    <ShoppingCart size={13} strokeWidth={1.6} />
                                                    {added === p.id ? 'Added to cart' : cartLine ? `In cart (${cartLine.quantity}) — add another` : 'Add to cart'}
                                                </button>
                                            ) : (
                                                <p className="mt-6 border border-dashed border-border py-3.5 text-center text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">
                                                    Not available yet
                                                </p>
                                            )}
                                        </div>
                                    </article>
                                </Reveal>
                            );
                        })}
                    </div>
                )}

                <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
                    <p className="text-xs text-muted-foreground">
                        <Link to="/checkout" className="text-[hsl(var(--gold))]">Review cart & checkout →</Link>
                        {' '}No account required.
                    </p>
                    <Link
                        to="/checkout"
                        className="flex items-center gap-2 border border-[hsl(var(--gold))]/60 px-6 py-3 text-[0.66rem] uppercase tracking-[0.22em] text-[hsl(var(--gold))] transition-colors hover:bg-[hsl(var(--gold))] hover:text-black"
                    >
                        <Check size={13} strokeWidth={1.6} /> View cart & checkout
                    </Link>
                </div>
            </Section>
        </div>
    );
};

export default ShopPage;
