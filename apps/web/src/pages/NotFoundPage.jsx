import React from 'react';
import { Link } from 'react-router-dom';
import { PageHead, Section } from '@/components/Section';

const NotFoundPage = () => (
    <Section className="flex min-h-[70vh] flex-col justify-center py-32" width="max-w-[56rem]">
        <PageHead title="Page not found | The Peter Edochie Legacy" description="The page you requested is not part of the archive." />
        <p className="eyebrow">404</p>
        <h1 className="mt-5 font-display text-5xl md:text-7xl">This page is not in the archive.</h1>
        <Link to="/" className="mt-10 inline-block w-fit border border-[hsl(var(--gold))]/60 px-8 py-4 text-[0.7rem] uppercase tracking-[0.24em] text-[hsl(var(--gold))]">
            Return home
        </Link>
    </Section>
);

export default NotFoundPage;
