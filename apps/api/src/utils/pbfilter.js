// Translate PocketBase-style filter strings (e.g. `owner = "x" && status = "a" || status = "b"`)
// into Prisma `where` objects. Field names are converted from snake_case to the
// Prisma camelCase using the INPUT field map. Relation traversal (e.g. `user.email`,
// `assigned_country.code`) is supported via simple FK "through" hints passed by the route.

const OP_TO_PRISMA = {
	'=': (v) => v,
	'!=': (v) => ({ not: v }),
	'>': (v) => ({ gt: v }),
	'<': (v) => ({ lt: v }),
	'>=': (v) => ({ gte: v }),
	'<=': (v) => ({ lte: v }),
	'~': (v) => ({ contains: String(v) }),
	'!~': (v) => ({ not: { contains: String(v) } }),
};

function splitTopLevel(str, sep) {
	const parts = [];
	let depth = 0;
	let cur = '';
	let i = 0;
	while (i < str.length) {
		const ch = str[i];
		if (ch === '(') depth++;
		else if (ch === ')') depth--;
		const matches = str.startsWith(sep, i);
		if (matches && depth === 0) {
			parts.push(cur.trim());
			cur = '';
			i += sep.length;
			continue;
		}
		cur += ch;
		i++;
	}
	parts.push(cur.trim());
	return parts.filter(Boolean);
}

function parsePredicate(raw) {
	let s = raw.trim().replace(/^\(|\)$/g, '').trim();
	const m = s.match(/^([A-Za-z0-9_.]+)\s*(!?=|>=|<=|>|<|~)\s*(.+)$/);
	if (!m) return null;
	const field = m[1];
	const op = m[2];
	let value = m[3].trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
	if (value === 'true') value = true;
	else if (value === 'false') value = false;
	else if (value !== '' && Number.isFinite(Number(value)) && !/^0/.test(value)) value = Number(value);
	return { field, op, value };
}

function setNested(where, keyPath, value) {
	let target = where;
	for (let i = 0; i < keyPath.length - 1; i++) {
		const seg = keyPath[i];
		if (!target[seg] || typeof target[seg] !== 'object') target[seg] = {};
		target = target[seg];
	}
	target[keyPath[keyPath.length - 1]] = value;
}

function buildAnd(predicates, translateField) {
	const where = {};
	for (const p of predicates) {
		const trimmed = p.trim();
		if (trimmed.startsWith('(') && trimmed.includes('||')) {
			const inner = trimmed.replace(/^\(|\)$/g, '');
			const sub = parsePbFilter(inner, translateField);
			if (sub?.OR?.length) {
				where.OR = [...(where.OR || []), ...sub.OR];
			}
			continue;
		}
		const node = parsePredicate(p);
		if (!node) continue;
		const result = translateField(node);
		if (!result) continue;
		const [keyPath, value] = result;
		if (!keyPath || !keyPath.length) continue;
		const opFn = OP_TO_PRISMA[node.op];
		setNested(where, keyPath, opFn ? opFn(value) : value);
	}
	return where;
}

/**
 * Parse a PB filter string into a Prisma where object.
 * @param {string} filter - e.g. `owner = "x" && status = "active"`
 * @param {function} translateField - (predicate) => [keyPathArray, value] | null
 */
export function parsePbFilter(filter, translateField) {
	if (!filter || typeof filter !== 'string') return undefined;
	const orGroups = splitTopLevel(filter, '||');
	const conditions = [];
	for (const grp of orGroups) {
		const predicates = splitTopLevel(grp, '&&');
		conditions.push(buildAnd(predicates, translateField));
	}
	if (conditions.length === 1) {
		const lone = conditions[0];
		return Object.keys(lone).length ? lone : undefined;
	}
	return { OR: conditions.filter((c) => Object.keys(c).length) };
}

/**
 * Default field translator using the model input map (snake->camel).
 * Dotted relation lookups use `via`: { 'assigned_country': { field: 'assignedCountry' } }.
 * Returns [ [prismaKey...,], value ] so the caller can nest relation objects.
 */
export function defaultTranslate(fieldMap, via = {}) {
	return (predicate) => {
		const field = predicate.field;
		if (field.includes('.')) {
			const segments = field.split('.');
			let head = segments.shift();
			const v = via[head];
			// Also allow mapping via the input map (e.g. `employee_role.user.email`).
			if (!v) return null;
			head = v.field;
			const tail = segments
				.map((seg) => fieldMap[seg] ?? seg)
				.join('.')
				.split('.');
			return [[head, ...tail], predicate.value];
		}
		const camel = fieldMap[field] ?? field;
		if (camel === undefined || camel === null) return null;
		return [[camel], predicate.value];
	};
}
