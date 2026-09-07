import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/** Prominent Pre-Order button reused across the site. */
const PreOrderCta = ({
  to = '/book',
  label = 'Pre-Order Now',
  variant = 'primary',
  className = '',
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 px-6 py-3.5 text-[0.68rem] uppercase tracking-[0.24em] transition-transform active:scale-[0.98]';
  const styles =
    variant === 'outline'
      ? 'border border-current bg-transparent'
      : variant === 'gold'
        ? 'border border-[hsl(var(--gold))]/70 text-[hsl(var(--gold))] hover:bg-[hsl(var(--gold))]/10'
        : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]';

  return (
    <Link to={to} className={`${base} ${styles} ${className}`}>
      {label}
      <ArrowRight size={14} strokeWidth={1.6} />
    </Link>
  );
};

export default PreOrderCta;
