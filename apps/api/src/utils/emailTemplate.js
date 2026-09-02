// Branded HTML email template for The Pete Edochie Legacy.
// Designed with inline styles and table structures for maximum compatibility
// across Gmail (Web & App, Light & Dark modes), Apple Mail, Outlook, Yahoo, and mobile clients.

export function parseMarkdownToEmailHtml(text = '') {
	if (!text) return '';

	const raw = String(text).replace(/\r\n/g, '\n').trim();
	if (!raw) return '';

	const escapeHtml = (str) =>
		str
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');

	const formatInline = (str) => {
		let out = escapeHtml(str);

		// Bold: **text** or __text__
		out = out.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #ffffff !important; font-weight: 700;">$1</strong>');
		out = out.replace(/__(.*?)__/g, '<strong style="color: #ffffff !important; font-weight: 700;">$1</strong>');

		// Italic: *text* or _text_
		out = out.replace(/(^|[^*])\*(?!\*)(.*?)\*(?!\*)/g, '$1<em style="color: #f4f4f5 !important; font-style: italic;">$2</em>');
		out = out.replace(/(^|[^_])_(?!_)(.*?)_(?!_)/g, '$1<em style="color: #f4f4f5 !important; font-style: italic;">$2</em>');

		// Markdown Links: [text](url)
		out = out.replace(
			/\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g,
			'<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #D4AF37 !important; text-decoration: underline !important; font-weight: 600;"><span style="color: #D4AF37 !important;">$1</span></a>',
		);

		// Auto-Links: https://...
		out = out.replace(
			/(^|[\s(])(https?:\/\/[^\s)<]+)/g,
			'$1<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #D4AF37 !important; text-decoration: underline !important; font-weight: 600;"><span style="color: #D4AF37 !important;">$2</span></a>',
		);

		// Single line breaks
		out = out.replace(/\n/g, '<br />');

		return out;
	};

	const blocks = raw.split(/\n\s*\n+/);

	const rendered = blocks.map((block) => {
		const trimmed = block.trim();
		if (!trimmed) return '';

		// Headings
		if (trimmed.startsWith('### ')) {
			return `<h3 style="margin: 22px 0 10px; font-family: 'Georgia', 'Times New Roman', serif; font-size: 18px; line-height: 1.4; font-weight: 600; color: #D4AF37 !important;">${formatInline(trimmed.slice(4))}</h3>`;
		}
		if (trimmed.startsWith('## ')) {
			return `<h2 style="margin: 26px 0 12px; font-family: 'Georgia', 'Times New Roman', serif; font-size: 21px; line-height: 1.35; font-weight: 600; color: #D4AF37 !important;">${formatInline(trimmed.slice(3))}</h2>`;
		}
		if (trimmed.startsWith('# ')) {
			return `<h1 style="margin: 28px 0 14px; font-family: 'Georgia', 'Times New Roman', serif; font-size: 24px; line-height: 1.3; font-weight: 700; color: #ffffff !important;">${formatInline(trimmed.slice(2))}</h1>`;
		}

		// Blockquote
		if (trimmed.startsWith('>') || trimmed.startsWith('&gt;')) {
			const quoteLines = trimmed
				.split('\n')
				.map((line) => line.replace(/^(?:>|&gt;)\s?/, ''))
				.join('\n');
			return `<blockquote style="margin: 20px 0; padding: 14px 20px; border-left: 3px solid #D4AF37; background-color: #19191d; color: #f4f4f5 !important; font-style: italic; font-size: 15px; line-height: 1.7;">${formatInline(quoteLines)}</blockquote>`;
		}

		// Bullet list (handles mixed text + bullet lines)
		const lines = trimmed.split('\n');
		const hasBulletList = lines.some((l) => /^\s*[-*]\s+/.test(l));
		if (hasBulletList) {
			const outputParts = [];
			let currentList = [];
			for (const line of lines) {
				if (/^\s*[-*]\s+/.test(line)) {
					currentList.push(line.replace(/^\s*[-*]\s+/, '').trim());
				} else {
					if (currentList.length > 0) {
						outputParts.push(
							`<ul style="margin: 14px 0 20px; padding-left: 24px; color: #D4AF37;">${currentList.map((item) => `<li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6; color: #d4d4d8 !important;">${formatInline(item)}</li>`).join('')}</ul>`,
						);
						currentList = [];
					}
					if (line.trim()) {
						outputParts.push(`<p style="margin: 0 0 12px; font-size: 15px; line-height: 1.7; color: #d4d4d8 !important;">${formatInline(line.trim())}</p>`);
					}
				}
			}
			if (currentList.length > 0) {
				outputParts.push(
					`<ul style="margin: 14px 0 20px; padding-left: 24px; color: #D4AF37;">${currentList.map((item) => `<li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6; color: #d4d4d8 !important;">${formatInline(item)}</li>`).join('')}</ul>`,
				);
			}
			return outputParts.join('\n');
		}

		// Numbered list (handles mixed text + numbered lines)
		const hasNumberList = lines.some((l) => /^\s*\d+\.\s+/.test(l));
		if (hasNumberList) {
			const outputParts = [];
			let currentList = [];
			for (const line of lines) {
				if (/^\s*\d+\.\s+/.test(line)) {
					currentList.push(line.replace(/^\s*\d+\.\s+/, '').trim());
				} else {
					if (currentList.length > 0) {
						outputParts.push(
							`<ol style="margin: 14px 0 20px; padding-left: 24px; color: #D4AF37;">${currentList.map((item) => `<li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6; color: #d4d4d8 !important;">${formatInline(item)}</li>`).join('')}</ol>`,
						);
						currentList = [];
					}
					if (line.trim()) {
						outputParts.push(`<p style="margin: 0 0 12px; font-size: 15px; line-height: 1.7; color: #d4d4d8 !important;">${formatInline(line.trim())}</p>`);
					}
				}
			}
			if (currentList.length > 0) {
				outputParts.push(
					`<ol style="margin: 14px 0 20px; padding-left: 24px; color: #D4AF37;">${currentList.map((item) => `<li style="margin-bottom: 8px; font-size: 15px; line-height: 1.6; color: #d4d4d8 !important;">${formatInline(item)}</li>`).join('')}</ol>`,
				);
			}
			return outputParts.join('\n');
		}

		// Paragraph
		return `<p style="margin: 0 0 18px; font-size: 15px; line-height: 1.7; color: #d4d4d8 !important;">${formatInline(trimmed)}</p>`;
	});

	return rendered.filter(Boolean).join('\n');
}

export function renderNewsletterHtml({
	subject = 'The Pete Edochie Legacy Update',
	previewText = '',
	headline = '',
	content = '',
	ctaText = '',
	ctaUrl = '',
	recipientName = '',
	recipientEmail = '',
}) {
	const greeting = recipientName ? `Dear ${recipientName},` : 'Greetings,';
	const formattedBody = parseMarkdownToEmailHtml(content);

	const buttonHtml = ctaText && ctaUrl
		? `
			<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0 10px;">
				<tr>
					<td align="center" bgcolor="#D4AF37" style="border-radius: 2px; background-color: #D4AF37; padding: 0;">
						<a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 32px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; font-weight: 700; color: #09090b !important; text-decoration: none; text-transform: uppercase; letter-spacing: 0.18em; background-color: #D4AF37;">
							<span style="color: #09090b !important; font-weight: 700; text-decoration: none;">${ctaText}</span>
						</a>
					</td>
				</tr>
			</table>
		`
		: '';

	return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="color-scheme" content="light dark">
	<meta name="supported-color-schemes" content="light dark">
	<title>${subject}</title>
	<!--[if mso]>
	<noscript>
		<xml>
			<o:OfficeDocumentSettings>
				<o:PixelsPerInch>96</o:PixelsPerInch>
			</o:OfficeDocumentSettings>
		</xml>
	</noscript>
	<![endif]-->
	<style>
		:root {
			color-scheme: light dark;
			supported-color-schemes: light dark;
		}
		body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
		table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
		img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
		body { margin: 0; padding: 0; width: 100% !important; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
		u + #body a { color: #D4AF37 !important; text-decoration: underline !important; }
		@media only screen and (max-width: 620px) {
			.container { width: 100% !important; padding: 0 !important; }
			.content-cell { padding: 28px 20px !important; }
		}
	</style>
</head>
<body id="body" bgcolor="#09090b" style="margin: 0; padding: 0; width: 100% !important; background-color: #09090b; color: #f4f4f5;">
	${previewText ? `<div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; color: #09090b; opacity: 0;">${previewText}</div>` : ''}

	<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#09090b" style="background-color: #09090b;">
		<tr>
			<td align="center" bgcolor="#09090b" style="padding: 40px 16px; background-color: #09090b;">
				<!-- Container -->
				<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" class="container" bgcolor="#141416" style="max-width: 600px; width: 100%; background-color: #141416; border: 1px solid #27272a;">
					<!-- Top Gold Line -->
					<tr>
						<td height="3" bgcolor="#D4AF37" style="background-color: #D4AF37; font-size: 0; line-height: 0;">&nbsp;</td>
					</tr>

					<!-- Header / Crest -->
					<tr>
						<td align="center" bgcolor="#141416" style="padding: 36px 32px 24px; border-bottom: 1px solid #222226; background-color: #141416;">
							<p style="margin: 0; font-family: 'Georgia', 'Times New Roman', serif; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.28em; color: #D4AF37 !important;">
								THE PETE EDOCHIE LEGACY
							</p>
							<p style="margin: 6px 0 0; font-size: 10px; text-transform: uppercase; letter-spacing: 0.16em; color: #71717a !important;">
								King Dawie Publishing &bull; Official Dispatch
							</p>
						</td>
					</tr>

					<!-- Main Content -->
					<tr>
						<td class="content-cell" bgcolor="#141416" style="padding: 40px 36px 32px; background-color: #141416;">
							${headline ? `<h1 style="margin: 0 0 24px; font-family: 'Georgia', 'Times New Roman', serif; font-size: 26px; line-height: 1.3; font-weight: 500; color: #ffffff !important; letter-spacing: -0.01em;">${headline}</h1>` : ''}

							<p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #e4e4e7 !important;">
								${greeting}
							</p>

							<div style="color: #d4d4d8;">
								${formattedBody}
							</div>

							${buttonHtml}

							<p style="margin: 32px 0 0; font-size: 14px; line-height: 1.6; color: #a1a1aa !important;">
								Warm regards,<br />
								<strong style="color: #ffffff !important; font-weight: 600;">The Pete Edochie Legacy Team</strong><br />
								<span style="font-size: 12px; color: #71717a !important;">King Dawie Publishing</span>
							</p>
						</td>
					</tr>

					<!-- Footer -->
					<tr>
						<td bgcolor="#0c0c0e" style="padding: 24px 32px; background-color: #0c0c0e; border-top: 1px solid #222226; text-align: center;">
							<p style="margin: 0 0 8px; font-size: 11px; line-height: 1.5; color: #71717a !important;">
								You received this email because you subscribed to updates from the Pete Edochie Legacy platform${recipientEmail ? ` (${recipientEmail})` : ''}.
							</p>
							<p style="margin: 0; font-size: 11px; line-height: 1.5; color: #52525b !important;">
								&copy; ${new Date().getFullYear()} The Pete Edochie Legacy &bull; King Dawie Publishing &bull; All Rights Reserved.
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>`;
}

export function renderNewsletterText({
	subject = '',
	headline = '',
	content = '',
	ctaText = '',
	ctaUrl = '',
	recipientName = '',
}) {
	const greeting = recipientName ? `Dear ${recipientName},` : 'Greetings,';
	const parts = [
		'THE PETE EDOCHIE LEGACY',
		'King Dawie Publishing - Official Dispatch',
		'========================================',
		'',
		headline ? `${headline}\n` : '',
		greeting,
		'',
		content,
		'',
		ctaText && ctaUrl ? `>>> ${ctaText.toUpperCase()}: ${ctaUrl}\n` : '',
		'Warm regards,',
		'The Pete Edochie Legacy Team',
		'King Dawie Publishing',
		'',
		'----------------------------------------',
		'You received this email because you are subscribed to The Pete Edochie Legacy updates.',
		`© ${new Date().getFullYear()} The Pete Edochie Legacy. All rights reserved.`,
	];
	return parts.filter((p) => p !== undefined && p !== null).join('\n');
}

export default { parseMarkdownToEmailHtml, renderNewsletterHtml, renderNewsletterText };
