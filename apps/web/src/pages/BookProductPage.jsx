import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink, Loader2, ShoppingCart } from 'lucide-react';
import { PageHead, Section } from '@/components/Section';
import { IMG } from '@/lib/content';
import { useCart } from '@/contexts/CartContext';
import { formatUSD, isPurchasable, isRedirectOnly } from '@/lib/commerce';
import pb from '@/lib/pocketbaseClient';

const BookProductPage = () => {
    const { productId } = useParams();
    const { items, add } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [missing, setMissing] = useState(false);
    const [added, setAdded] = useState(false);

    useEffect(() => {
        setLoading(true);
        setMissing(false);
        pb.collection('products')
            .getOne(productId, { requestKey: `book-item-${productId}` })
            .then((p) => {
                if (p.product_type !== 'book') {
                    setMissing(true);
                    setProduct(null);
                } else {
                    setProduct(p);
                }
            })
            .catch(() => {
                setMissing(true);
                setProduct(null);
            })
            .finally(() => setLoading(false));
    }, [productId]);

    const inCart = items.find((it) => it.product_id === productId);
    const redirect = product ? isRedirectOnly(product) : false;
    const purchasable = product ? isPurchasable(product) : false;

    const handleAdd = () => {
        if (!product) return;
        add(product.id, 1);
        setAdded(true);
    };

    const title = product?.edition || product?.name || 'Book edition';

    return (
        <div className="pt-28">
            <PageHead
                title={`${title} — Order | Pete Edochie Legacy`}
                description={product?.description || 'Order this edition of the Pete Edochie autobiography from King Dawie Publishing.'}
            />
            <Section className="py-16 md:py-24" width="max-w-[42rem]">
                {loading ? (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Loader2 size={16} className="animate-spin" /> Loading edition…
                    </div>
                ) : missing || !product ? (
                    <div className="border border-border bg-card p-8 text-center">
                        <p className="font-display text-3xl">Edition not found</p>
                        <p className="mt-3 text-sm text-muted-foreground">This book link may be outdated or the edition is no longer available.</p>
                        <Link to="/book" className="mt-6 inline-block text-[0.68rem] uppercase tracking-[0.2em] text-[hsl(var(--gold))]">
                            Browse all editions
                        </Link>
                    </div>
                ) : (
                    <article className="border border-border bg-card p-8 md:p-10">
                        <p className="eyebrow">Order this edition</p>
                        <h1 className="mt-4 font-display text-4xl md:text-5xl">{title}</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {product.format === 'hardcopy' ? 'Hardcopy' : 'Digital'} · {product.status === 'preorder' ? 'Preorder' : 'Available'}
                        </p>
                        <img src={product.image || IMG.book} alt={title} className="mt-8 w-full max-w-sm object-cover" />
                        <p className="mt-6 font-display text-4xl text-[hsl(var(--gold))]">{formatUSD(product.price)}</p>
                        {product.description ? (
                            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
                        ) : null}

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            {redirect ? (
                                <a
                                    href={product.external_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-1 items-center justify-center gap-2 border border-border py-4 text-[0.66rem] uppercase tracking-[0.22em] hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]"
                                >
                                    <ExternalLink size={14} /> Buy on Amazon
                                </a>
                            ) : purchasable ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleAdd}
                                        className="flex flex-1 items-center justify-center gap-2 bg-[hsl(var(--primary))] py-4 text-[0.66rem] uppercase tracking-[0.22em] text-white"
                                    >
                                        <ShoppingCart size={14} />
                                        {added ? 'Added to cart' : inCart ? `In cart (${inCart.quantity}) — add another` : 'Add to cart'}
                                    </button>
                                    <Link
                                        to="/checkout"
                                        className="flex flex-1 items-center justify-center border border-[hsl(var(--gold))]/60 py-4 text-center text-[0.66rem] uppercase tracking-[0.22em] text-[hsl(var(--gold))]"
                                    >
                                        Go to checkout
                                    </Link>
                                </>
                            ) : (
                                <p className="border border-dashed border-border py-4 text-center text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">
                                    Not available to order yet
                                </p>
                            )}
                        </div>
                        <Link to="/book" className="mt-6 inline-block text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
                            View all editions
                        </Link>
                    </article>
                )}
            </Section>
        </div>
    );
};

export default BookProductPage;
