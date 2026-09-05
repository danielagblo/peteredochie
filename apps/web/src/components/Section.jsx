import React from 'react';
import { Helmet } from 'react-helmet';
import Reveal from '@/components/Reveal';

export const PageHead = ({ title, description }) => (
    <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
    </Helmet>
);

export const PageHero = ({ eyebrow, title, lead, image, align = 'left' }) => (
    <section className="relative flex min-h-[62vh] items-end overflow-hidden bg-[#0a0a0a]">
        {image ? (
            <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className="img-veil absolute inset-0" />
        <div className={`relative z-10 mx-auto w-full max-w-[72rem] px-5 pb-16 pt-32 text-white md:px-10 ${align === 'center' ? 'text-center' : ''}`}>
            <p className="text-[0.68rem] uppercase tracking-[0.32em] text-[hsl(var(--gold))]">{eyebrow}</p>
            <h1 className="mt-5 font-display text-5xl leading-[0.95] text-white md:text-7xl">{title}</h1>
            {lead ? (
                <p className={`mt-6 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg ${align === 'center' ? 'mx-auto' : ''}`}>
                    {lead}
                </p>
            ) : null}
        </div>
    </section>
);

export const Section = ({ children, className = '', width = 'max-w-[72rem]' }) => (
    <section className={`mx-auto w-full px-5 md:px-10 ${width} ${className}`}>{children}</section>
);

export const SectionTitle = ({ eyebrow, title, lead, className = '' }) => (
    <Reveal>
        <div className={className}>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h2 className="mt-4 font-display text-4xl leading-tight md:text-5xl">{title}</h2>
            {lead ? <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">{lead}</p> : null}
        </div>
    </Reveal>
);

export default Section;
