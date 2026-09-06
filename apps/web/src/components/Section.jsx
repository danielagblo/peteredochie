import React from 'react';
import { Helmet } from 'react-helmet';
import Reveal from '@/components/Reveal';
import { IMG } from '@/lib/content';

export const PageHead = ({ title, description }) => (
    <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
    </Helmet>
);

/** Shared page header — same legacy cover as the homepage hero, heavily shaded. */
export const PageHero = ({ eyebrow, title, lead, image = IMG.cover, align = 'left' }) => (
    <section className="relative flex min-h-[48vh] items-end overflow-hidden bg-[#07101c] md:min-h-[52vh]">
        <img
            src={image || IMG.cover}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_28%] md:object-center [filter:brightness(0.72)]"
        />
        <div
            className="absolute inset-0"
            style={{
                background:
                    'linear-gradient(to top, rgba(4,10,18,0.96) 0%, rgba(4,10,18,0.82) 38%, rgba(4,10,18,0.62) 68%, rgba(4,10,18,0.7) 100%)',
            }}
        />
        <div className="absolute inset-0 bg-black/35" />
        <div className={`relative z-10 mx-auto w-full max-w-[72rem] px-5 pb-14 pt-28 text-white md:px-10 md:pb-16 ${align === 'center' ? 'text-center' : ''}`}>
            <Reveal>
                <p className="eyebrow text-white/75">{eyebrow}</p>
                <h1 className="mt-5 font-display text-5xl leading-[0.95] text-white md:text-7xl">{title}</h1>
                {lead ? (
                    <p className={`mt-6 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg ${align === 'center' ? 'mx-auto' : ''}`}>
                        {lead}
                    </p>
                ) : null}
            </Reveal>
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
