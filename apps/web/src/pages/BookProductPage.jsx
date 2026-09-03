import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink, Loader2 } from 'lucide-react';
import BookPreregistrationForm from '@/components/BookPreregistrationForm';
import { PageHead, Section } from '@/components/Section';
import { IMG } from '@/lib/content';
import { fetchBookPreregStats } from '@/lib/bookStats';
import { formatUSD, isRedirectOnly } from '@/lib/commerce';
import { apiCrud } from '@/lib/api';
import CountUp from '@/components/CountUp';

const BookProductPage = () => {
    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [editionStats, setEditionStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [missing, setMissing] = useState(false);

    useEffect(() => {
        setLoading(true);
        setMissing(false);
        apiCrud
            .getOne('products', productId)
            .then((p) => {
                if (p.product_type !== 'book') {
                    setMissing(true);
                    setProduct(null);
                } else {
                    setProduct(p);
                    fetchBookPreregStats(p.id)
                        .then(setEditionStats)
                        .catch(() => setEditionStats(null));
                }
            })
            .catch(() => {
                setMissing(true);
                setProduct(null);
            })
            .finally(() => setLoading(false));
    }, [productId]);

    const title = product?.edition || product?.name || 'Book edition';
    const categoryName = product?.expand?.book_category?.name || product?.book_category?.name;
    const redirect = product ? isRedirectOnly(product) : false;

    return (
        <div className="pt-28">
            <PageHead
                title={`${title} — Book details | Pete Edochie Legacy`}
                description={product?.excerpt || product?.description || 'View details and pre-register for this Pete Edochie autobiography edition.'}
            />
            <Section className="py-16 md:py-24" width="max-w-[80rem]">
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
                    <div className="space-y-16">
                        <article className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
                            <div>
                                <img src={product.image || IMG.book} alt={title} className="w-full object-cover" />
                                {categoryName ? (
                                    <p className="mt-6 text-[0.66rem] uppercase tracking-[0.22em] text-[hsl(var(--gold))]">{categoryName}</p>
                                ) : null}
                            </div>

                            <div>
                                <p className="eyebrow">Book details</p>
                                <h1 className="mt-4 font-display text-4xl md:text-5xl lg:text-6xl">{title}</h1>
                                {product.name && product.edition ? (
                                    <p className="mt-2 text-sm text-muted-foreground">{product.name}</p>
                                ) : null}
                                <p className="mt-4 text-sm text-muted-foreground">
                                    {product.author ? `${product.author} · ` : ''}
                                    {product.format === 'hardcopy' ? 'Hardcover' : 'Digital'} ·{' '}
                                    {product.status === 'preorder' ? 'Preorder' : product.status === 'main_order' ? 'Available' : 'Unavailable'}
                                    {product.published_year ? ` · ${product.published_year}` : ''}
                                </p>

                                <p className="mt-6 font-display text-4xl text-[hsl(var(--gold))]">{formatUSD(product.price)}</p>

                                {editionStats?.totalRegistrations > 0 ? (
                                    <p className="mt-4 text-sm text-muted-foreground">
                                        <span className="font-display text-2xl text-[hsl(var(--gold))]">
                                            <CountUp value={editionStats.totalCopies} />
                                        </span>
                                        {' '}copies pre-ordering across{' '}
                                        <CountUp value={editionStats.totalRegistrations} /> registrations for this edition
                                    </p>
                                ) : null}

                                <dl className="mt-8 grid gap-5 border-t border-border pt-8 text-sm sm:grid-cols-2">
                                    {product.isbn ? (
                                        <div>
                                            <dt className="text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">ISBN</dt>
                                            <dd className="mt-1 font-medium">{product.isbn}</dd>
                                        </div>
                                    ) : null}
                                    {product.pages ? (
                                        <div>
                                            <dt className="text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">Pages</dt>
                                            <dd className="mt-1 font-medium">{product.pages}</dd>
                                        </div>
                                    ) : null}
                                    {product.language ? (
                                        <div>
                                            <dt className="text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">Language</dt>
                                            <dd className="mt-1 font-medium">{product.language}</dd>
                                        </div>
                                    ) : null}
                                    {product.edition ? (
                                        <div>
                                            <dt className="text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground">Edition</dt>
                                            <dd className="mt-1 font-medium">{product.edition}</dd>
                                        </div>
                                    ) : null}
                                </dl>

                                {product.excerpt ? (
                                    <blockquote className="mt-8 border-l-2 border-[hsl(var(--gold))] pl-6 font-display text-xl italic leading-relaxed text-foreground">
                                        {product.excerpt}
                                    </blockquote>
                                ) : null}

                                {product.description ? (
                                    <div className="mt-8 space-y-4 text-sm leading-[1.9] text-muted-foreground">
                                        {product.description.split('\n').filter(Boolean).map((para) => (
                                            <p key={para.slice(0, 24)}>{para}</p>
                                        ))}
                                    </div>
                                ) : null}

                                {redirect ? (
                                    <a
                                        href={product.external_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-10 inline-flex items-center gap-2 border border-border px-6 py-4 text-[0.66rem] uppercase tracking-[0.22em] transition-colors hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]"
                                    >
                                        <ExternalLink size={14} /> Buy on Amazon
                                    </a>
                                ) : null}

                                <Link to="/book" className="mt-8 inline-block text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
                                    ← All editions
                                </Link>
                            </div>
                        </article>

                        {!redirect ? <BookPreregistrationForm product={product} /> : null}
                    </div>
                )}
            </Section>
        </div>
    );
};

export default BookProductPage;
