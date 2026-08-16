import React, { useEffect, useState } from 'react';
import Reveal from '@/components/Reveal';
import { PageHead, PageHero, Section } from '@/components/Section';
import { IMG } from '@/lib/content';
import pb from '@/lib/pocketbaseClient';

const NewsPage = () => {
    const [items, setItems] = useState([]);
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        pb.collection('news')
            .getFullList({ sort: '-published' })
            .then((res) => {
                setItems(res);
                setStatus('ready');
            })
            .catch(() => setStatus('error'));
    }, []);

    return (
        <div>
            <PageHead
                title="Journal — News from the Pete Edochie Legacy"
                description="Announcements and dispatches from the Pete Edochie Legacy: the autobiography, events, mentorship cohorts and honours."
            />
            <PageHero eyebrow="Journal" title="Dispatches" lead="Announcements, notes from the archive and news from the road." image={IMG.award} />

            <Section className="py-20 md:py-28" width="max-w-[80rem]">
                {status === 'loading' ? (
                    <div className="grid gap-8 md:grid-cols-3">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="h-80 animate-pulse bg-white/[0.04]" />
                        ))}
                    </div>
                ) : status === 'error' ? (
                    <p className="py-16 text-sm text-muted-foreground">The journal could not be loaded. Please refresh the page.</p>
                ) : items.length === 0 ? (
                    <p className="py-16 text-sm text-muted-foreground">No dispatches have been published yet.</p>
                ) : (
                    <div className="grid gap-10 md:grid-cols-3">
                        {items.map((n, i) => (
                            <Reveal key={n.id} delay={i * 0.06}>
                                <article className="group">
                                    <div className="overflow-hidden">
                                        <img src={n.image} alt="" className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                                    </div>
                                    <p className="mt-5 text-[0.62rem] uppercase tracking-[0.22em] text-[hsl(var(--gold))]">
                                        {n.category}
                                        {n.published ? ` · ${new Date(n.published).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}` : ''}
                                    </p>
                                    <h2 className="mt-3 font-display text-2xl leading-snug">{n.title}</h2>
                                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{n.excerpt}</p>
                                </article>
                            </Reveal>
                        ))}
                    </div>
                )}
            </Section>
        </div>
    );
};

export default NewsPage;
