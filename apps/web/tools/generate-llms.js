#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __file = path.resolve(fileURLToPath(import.meta.url));

const CLEAN_CONTENT_REGEX = {
	comments: /\/\*[\s\S]*?\*\/|\/\/.*$/gm,
	templateLiterals: /`[\s\S]*?`/g,
	strings: /'[^']*'|"[^"]*"/g,
	jsxExpressions: /\{.*?\}/g,
	htmlEntities: {
		quot: /&quot;/g,
		amp: /&amp;/g,
		lt: /&lt;/g,
		gt: /&gt;/g,
		apos: /&apos;/g
	}
};

const EXTRACTION_REGEX = {
	// `element={<Page />}` puts a `>` inside the tag, so the attribute scan has
	// to step over brace groups instead of stopping at the first `>`.
	route: /<Route\s+(?:[^>{]|\{[^}]*\})*\/?>/g,
	path: /path=["']([^"']+)["']/,
	element: /element=\{([\s\S]*)\}/,
	elementComponent: /<(\w+)/g,
	helmet: /<Helmet[^>]*?>([\s\S]*?)<\/Helmet>/i,
	helmetTest: /<Helmet[\s\S]*?<\/Helmet>/i,
	title: /<title[^>]*?>\s*(.*?)\s*<\/title>/i,
	description: /<meta\s+name=["']description["']\s+content=["'](.*?)["']/i
};

function cleanContent(content) {
	return content
		.replace(CLEAN_CONTENT_REGEX.comments, '')
		.replace(CLEAN_CONTENT_REGEX.templateLiterals, '""')
		.replace(CLEAN_CONTENT_REGEX.strings, '""');
}

function cleanText(text) {
	if (!text) return text;

	return text
		.replace(CLEAN_CONTENT_REGEX.jsxExpressions, '')
		.replace(CLEAN_CONTENT_REGEX.htmlEntities.quot, '"')
		.replace(CLEAN_CONTENT_REGEX.htmlEntities.amp, '&')
		.replace(CLEAN_CONTENT_REGEX.htmlEntities.lt, '<')
		.replace(CLEAN_CONTENT_REGEX.htmlEntities.gt, '>')
		.replace(CLEAN_CONTENT_REGEX.htmlEntities.apos, "'")
		.trim();
}

function extractRoutes(appJsxPath) {
	if (!fs.existsSync(appJsxPath)) return new Map();

	try {
		const content = fs.readFileSync(appJsxPath, 'utf8');
		const routes = new Map();
		const routeMatches = [...content.matchAll(EXTRACTION_REGEX.route)];

		for (const match of routeMatches) {
			const routeTag = match[0];
			const pathMatch = routeTag.match(EXTRACTION_REGEX.path);
			const elementMatch = routeTag.match(EXTRACTION_REGEX.element);
			const isIndex = routeTag.includes('index');

			if (elementMatch) {
				// A guarded route reads `element={<ProtectedRoute><SettingsPage /></ProtectedRoute>}`,
				// so the page is the innermost component rather than the first one.
				const componentNames = [...elementMatch[1].matchAll(EXTRACTION_REGEX.elementComponent)];
				const componentName = componentNames.at(-1)?.[1];

				if (!componentName) continue;

				let routePath;

				if (isIndex) {
					routePath = '/';
				} else if (pathMatch) {
					routePath = pathMatch[1].startsWith('/') ? pathMatch[1] : `/${pathMatch[1]}`;
				}

				routes.set(componentName, routePath);
			}
		}

		return routes;
	} catch (error) {
		return new Map();
	}
}

// Recurse through the pages tree collecting React files, skipping any directory
// named "admin" so the internal admin pages are never listed/exposed in llms.txt.
const EXCLUDED_DIRS = new Set(['admin']);

function findReactFiles(dir) {
	const results = [];
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (!EXCLUDED_DIRS.has(entry.name)) {
				results.push(...findReactFiles(full));
			}
		} else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
			results.push(full);
		}
	}
	return results;
}

function extractHelmetData(content, filePath, routes) {
	const cleanedContent = cleanContent(content);

	if (!EXTRACTION_REGEX.helmetTest.test(cleanedContent)) {
		return null;
	}

	const helmetMatch = content.match(EXTRACTION_REGEX.helmet);
	if (!helmetMatch) return null;

	const helmetContent = helmetMatch[1];
	const titleMatch = helmetContent.match(EXTRACTION_REGEX.title);
	const descMatch = helmetContent.match(EXTRACTION_REGEX.description);

	const title = cleanText(titleMatch?.[1]);
	const description = cleanText(descMatch?.[1]);

	const fileName = path.basename(filePath, path.extname(filePath));
	const url = routes.size && routes.has(fileName)
		? routes.get(fileName)
		: generateFallbackUrl(fileName);

	return {
		url,
		title: title || 'Untitled Page',
		description: description || 'No description available'
	};
}

function generateFallbackUrl(fileName) {
	const cleanName = fileName.replace(/Page$/, '').toLowerCase();
	return cleanName === 'app' ? '/' : `/${cleanName}`;
}

function generateLlmsTxt(pages) {
	const sortedPages = pages.sort((a, b) => a.title.localeCompare(b.title));
	const pageEntries = sortedPages.map(page =>
		`- [${page.title}](${page.url}): ${page.description}`
	).join('\n');

	return `## Pages\n${pageEntries}`;
}

function ensureDirectoryExists(dirPath) {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
	}
}

function processPageFile(filePath, routes) {
	try {
		const content = fs.readFileSync(filePath, 'utf8');
		return extractHelmetData(content, filePath, routes);
	} catch (error) {
		console.error(`❌ Error processing ${filePath}:`, error.message);
		return null;
	}
}

function main() {
	const pagesDir = path.join(process.cwd(), 'src', 'pages');
	const appJsxPath = path.join(process.cwd(), 'src', 'App.jsx');

	let pages = [];

	if (!fs.existsSync(pagesDir)) {
		pages.push(processPageFile(appJsxPath, new Map()))
		pages = pages.filter(Boolean);
	} else {
		const routes = extractRoutes(appJsxPath);
		const reactFiles = findReactFiles(pagesDir);

		pages = reactFiles
			.map(filePath => processPageFile(filePath, routes))
			.filter(Boolean);
	}

	if (pages.length === 0) {
		console.error('❌ No pages with Helmet components found!');
		process.exit(1);
	}


	const llmsTxtContent = generateLlmsTxt(pages);
	const outputPath = path.join(process.cwd(), 'public', 'llms.txt');

	ensureDirectoryExists(path.dirname(outputPath));
	fs.writeFileSync(outputPath, llmsTxtContent, 'utf8');
}

// Compare resolved absolute paths so this check works on Windows too where
// import.meta.url is file:/// while argv[1] uses backslashes.
const isMainModule =
	path.resolve(process.argv[1] || '.') === __file;

if (isMainModule) {
	main();
}
