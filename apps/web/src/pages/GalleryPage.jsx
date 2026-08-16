import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import Reveal from '@/components/Reveal';
import { PageHead, PageHero, Section } from '@/components/Section';
import { IMG } from '@/lib/content';

const ITEMS = [
    { src: IMG.portrait, cat: 'Portraits', caption: 'Studio portrait, Lagos' },
    { src: IMG.stage, cat: 'Stage', caption: 'Under a single light, Enugu' },
    { src: IMG.set, cat: 'On set', caption: 'Behind the scenes, Nollywood' },
    { src: IMG.award, cat: 'Honours', caption: 'Lifetime achievement, Lagos' },
    { src: IMG.youth, cat: 'Mentorship', caption: 'Workshop cohort, Abuja' },
    { src: IMG.podium, cat: 'Speaking', caption: 'Convocation address, Nsukka' },
    { src: IMG.family, cat: 'Family', caption: 'Courtyard gathering, Anambra' },
    { src: IMG.artifact, cat: 'Artifacts', caption: 'Mask and coral beads' },
    { src: IMG.theatre, cat: 'Stage', caption: 'The house before doors open' },
];

const GalleryPage = () => {
    const [filter, setFilter] = useState('All');
    const [open, setOpen] = useState(null);
    const cats = useMemo(() => ['All', ...Array.from(new Set(ITEMS.map((i) => i.cat)))], []);
    const shown = filter === 'All' ? ITEMS : ITEMS.filter((i) => i.cat === filter);

    return (
        <div>
            <PageHead
                title="Gallery — The Pete Edochie Photographic Archive"
                description="A curated photographic archive: portraits, film stills, award ceremonies, speaking engagements, family moments and cultural artifacts."
            />
            <PageHero eyebrow="Gallery" title="The photographic archive" lead="Curated images from six decades, held and captioned like a collection." image={IMG.family} />

            <Section className="py-20 md:py-28" width="max-w-[90rem]">
                <div className="flex flex-wrap gap-3 border-b border-border pb-6">
                    {cats.map((c) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setFilter(c)}
                            className={`px-4 py-2 text-[0.66rem] uppercase tracking-[0.2em] transition-colors ${
                                filter === c ? 'bg-[hsl(var(--gold))] text-black' : 'border border-border text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>

                {shown.length === 0 ? (
                    <p className="py-20 text-center text-sm text-muted-foreground">No images in this category yet.</p>
                ) : (
                    <div className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
                        {shown.map((item, i) => (
                            <Reveal key={item.src + item.caption} delay={(i % 3) * 0.05}>
                                <button type="button" onClick={() => setOpen(item)} className="group block w-full overflow-hidden text-left">
                                    <img
                                        src={item.src}
                                        alt={item.caption}
                                        className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                                    />
                                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.caption}</p>
                                </button>
                            </Reveal>
                        ))}
                    </div>
                )}
            </Section>

            {open ? (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 p-6"
                    onClick={() => setOpen(null)}
                    role="presentation"
                >
                    <button type="button" aria-label="Close" className="absolute right-6 top-6 text-foreground" onClick={() => setOpen(null)}>
                        <X size={26} strokeWidth={1.2} />
                    </button>
                    <figure className="max-h-full max-w-5xl">
                        <img src={open.src} alt={open.caption} className="max-h-[80vh] w-full object-contain" />
                        <figcaption className="mt-4 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            {open.caption}
                        </figcaption>
                    </figure>
                </div>
            ) : null}
        </div>
    );
};

export default GalleryPage;
