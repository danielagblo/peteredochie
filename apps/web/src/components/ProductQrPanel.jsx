import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Download } from 'lucide-react';
import { productOrderUrl } from '@/lib/productLinks';

const ProductQrPanel = ({ product, compact = false }) => {
    const wrapRef = useRef(null);
    const [copied, setCopied] = useState(false);
    const url = productOrderUrl(product.id, product.product_type || 'book');

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (_) {
            /* ignore */
        }
    };

    const downloadPng = () => {
        const svg = wrapRef.current?.querySelector('svg');
        if (!svg) return;
        const size = compact ? 180 : 220;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, size, size);
            const link = document.createElement('a');
            const slug = (product.edition || product.name || product.id).replace(/[^\w.-]+/g, '-').slice(0, 40);
            link.download = `qr-${slug}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        };
        img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(svg))))}`;
    };

    return (
        <div className={`border border-border bg-background ${compact ? 'p-4' : 'p-5'}`}>
            <p className="text-[0.58rem] uppercase tracking-[0.18em] text-muted-foreground">Scan to order</p>
            <div ref={wrapRef} className="mt-3 inline-block rounded bg-white p-3">
                <QRCodeSVG value={url} size={compact ? 120 : 160} includeMargin />
            </div>
            <p className="mt-3 break-all font-mono text-[0.62rem] text-muted-foreground">{url}</p>
            <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={copyLink} className="inline-flex items-center gap-1.5 border border-border px-3 py-2 text-[0.58rem] uppercase tracking-[0.18em] hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]">
                    <Copy size={12} /> {copied ? 'Copied' : 'Copy link'}
                </button>
                <button type="button" onClick={downloadPng} className="inline-flex items-center gap-1.5 border border-border px-3 py-2 text-[0.58rem] uppercase tracking-[0.18em] hover:border-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]">
                    <Download size={12} /> Download QR
                </button>
            </div>
        </div>
    );
};

export default ProductQrPanel;
