import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
    Bold, Italic, Underline, Heading2, Heading3,
    List, ListOrdered, Quote, Link as LinkIcon, Unlink, RotateCcw
} from 'lucide-react';

const RichTextEditor = ({
    value = '',
    onChange,
    placeholder = 'Write your newsletter message here... Format visually using the toolbar above.',
    minHeight = '220px',
}) => {
    const editorRef = useRef(null);
    const [isFocused, setIsFocused] = useState(false);
    const [activeStates, setActiveStates] = useState({
        bold: false,
        italic: false,
        underline: false,
        unorderedList: false,
        orderedList: false,
    });

    // Update active states based on current selection
    const updateActiveStates = useCallback(() => {
        try {
            setActiveStates({
                bold: document.queryCommandState('bold'),
                italic: document.queryCommandState('italic'),
                underline: document.queryCommandState('underline'),
                unorderedList: document.queryCommandState('insertUnorderedList'),
                orderedList: document.queryCommandState('insertOrderedList'),
            });
        } catch (_) {
            /* ignore */
        }
    }, []);

    // Sync external value changes into editor innerHTML only if content actually differs
    useEffect(() => {
        const el = editorRef.current;
        if (!el) return;
        if (el.innerHTML !== value && !isFocused) {
            el.innerHTML = value || '';
        }
    }, [value, isFocused]);

    const handleInput = () => {
        if (!editorRef.current) return;
        const html = editorRef.current.innerHTML;
        // Clean empty tags
        const clean = html === '<p><br></p>' || html === '<br>' || html === '' ? '' : html;
        if (onChange) onChange(clean);
        updateActiveStates();
    };

    const exec = (command, valueArg = null) => {
        if (!editorRef.current) return;
        editorRef.current.focus();
        document.execCommand(command, false, valueArg);
        handleInput();
        updateActiveStates();
    };

    const handleFormatBlock = (tag) => {
        if (!editorRef.current) return;
        editorRef.current.focus();
        // Check current format block
        const current = document.queryCommandValue('formatBlock');
        if (current && current.toLowerCase() === tag.toLowerCase()) {
            document.execCommand('formatBlock', false, '<p>');
        } else {
            document.execCommand('formatBlock', false, `<${tag}>`);
        }
        handleInput();
    };

    const handleLink = () => {
        if (!editorRef.current) return;
        const selection = window.getSelection();
        const selectedText = selection.toString();
        const url = window.prompt('Enter link URL (e.g. https://...):', 'https://');
        if (url && url.trim() && url !== 'https://') {
            if (!selectedText) {
                // Insert a link with text
                exec('insertHTML', `<a href="${url.trim()}" target="_blank" rel="noopener noreferrer">${url.trim()}</a>`);
            } else {
                exec('createLink', url.trim());
            }
        }
    };

    const handleQuote = () => {
        handleFormatBlock('blockquote');
    };

    const toolBtn = (onClick, title, Icon, isActive = false) => (
        <button
            type="button"
            onClick={(e) => { e.preventDefault(); onClick(); }}
            title={title}
            className={`p-1.5 transition-colors ${
                isActive
                    ? 'bg-[hsl(var(--gold))] text-black font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
            }`}
        >
            <Icon size={14} />
        </button>
    );

    const isEmpty = !value || value === '<p><br></p>' || value === '<br>' || value.trim() === '';

    return (
        <div className={`border transition-colors ${isFocused ? 'border-[hsl(var(--gold))]' : 'border-border'} bg-card`}>
            {/* Visual Toolbar */}
            <div className="flex flex-wrap items-center gap-1 border-b border-border bg-[hsl(var(--surface))] px-2 py-1.5">
                {toolBtn(() => exec('bold'), 'Bold (Ctrl+B)', Bold, activeStates.bold)}
                {toolBtn(() => exec('italic'), 'Italic (Ctrl+I)', Italic, activeStates.italic)}
                {toolBtn(() => exec('underline'), 'Underline (Ctrl+U)', Underline, activeStates.underline)}

                <span className="h-4 w-px bg-border mx-1" />

                {toolBtn(() => handleFormatBlock('h2'), 'Heading 2', Heading2)}
                {toolBtn(() => handleFormatBlock('h3'), 'Heading 3', Heading3)}

                <span className="h-4 w-px bg-border mx-1" />

                {toolBtn(() => exec('insertUnorderedList'), 'Bullet List', List, activeStates.unorderedList)}
                {toolBtn(() => exec('insertOrderedList'), 'Numbered List', ListOrdered, activeStates.orderedList)}
                {toolBtn(handleQuote, 'Quote', Quote)}

                <span className="h-4 w-px bg-border mx-1" />

                {toolBtn(handleLink, 'Insert Link', LinkIcon)}
                {toolBtn(() => exec('unlink'), 'Remove Link', Unlink)}
                {toolBtn(() => exec('removeFormat'), 'Clear Formatting', RotateCcw)}
            </div>

            {/* ContentEditable Visual Area */}
            <div className="relative">
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    onFocus={() => { setIsFocused(true); updateActiveStates(); }}
                    onBlur={() => { setIsFocused(false); handleInput(); }}
                    onKeyUp={updateActiveStates}
                    onMouseUp={updateActiveStates}
                    style={{ minHeight }}
                    className="p-4 text-sm leading-relaxed outline-none text-foreground bg-transparent font-sans
                        [&_h1]:text-2xl [&_h1]:font-serif [&_h1]:font-semibold [&_h1]:text-white [&_h1]:mt-5 [&_h1]:mb-2.5
                        [&_h2]:text-xl [&_h2]:font-serif [&_h2]:font-semibold [&_h2]:text-[hsl(var(--gold))] [&_h2]:mt-4 [&_h2]:mb-2
                        [&_h3]:text-lg [&_h3]:font-serif [&_h3]:font-semibold [&_h3]:text-[hsl(var(--gold))] [&_h3]:mt-3 [&_h3]:mb-1.5
                        [&_p]:mb-3 [&_p]:leading-relaxed
                        [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ul]:text-[hsl(var(--gold))] [&_ul_li]:text-foreground [&_ul_li]:mb-1
                        [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_ol]:text-[hsl(var(--gold))] [&_ol_li]:text-foreground [&_ol_li]:mb-1
                        [&_blockquote]:border-l-2 [&_blockquote]:border-[hsl(var(--gold))] [&_blockquote]:bg-secondary/40 [&_blockquote]:px-4 [&_blockquote]:py-2.5 [&_blockquote]:my-3.5 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
                        [&_a]:text-[hsl(var(--gold))] [&_a]:underline [&_a]:font-semibold"
                />

                {/* Floating Placeholder when empty */}
                {isEmpty && !isFocused && (
                    <div
                        onClick={() => editorRef.current?.focus()}
                        className="pointer-events-none absolute left-4 top-4 text-sm text-muted-foreground italic select-none"
                    >
                        {placeholder}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RichTextEditor;
