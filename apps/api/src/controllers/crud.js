import logger from '../utils/logger.js';
import { mapInput, mapRecord, FIELD_MODELS } from '../utils/fields.js';
import { parsePbFilter, defaultTranslate } from '../utils/pbfilter.js';

// Build a set of CRUD route handlers for a Prisma model.
// `model` is the Prisma delegate (e.g. prisma.event).
// opts:
//   - modelName: string              — snake_case model key for field mapping (REQUIRED for mapping)
//   - publicList: boolean          — allow GET / without auth (default true)
//   - publicGet: boolean           — allow GET /:id without auth (default true)
//   - listGuard / createGuard / updateGuard / deleteGuard: middleware fn
//   - orderBy: object              — default ordering for list
//   - where: (req) => object       — inject extra filters for list/get
//   - include: object              — prisma include for relations
//   - preCreate: (req) => data     — transform/create payload before write
//   - preUpdate: (req) => data     — transform/update payload before write
//   - searchable: [string]         — fields to LIKE-search via ?q=
//   - restrict: array              — fields (Prisma camelCase) stripped from create/update (guards)
//   - filterMap: object            — snake_case -> camel_case input map for filter/sort
//   - filterVia: object            — dotted relation hints for filter translation
export function crudController(model, opts = {}) {
	const {
		modelName,
		publicList = true,
		publicGet = true,
		listGuard,
		createGuard,
		updateGuard,
		deleteGuard,
		orderBy = undefined,
		where: whereFn,
		include,
		preCreate,
		preUpdate,
		searchable = [],
		restrict = [],
		filterMap,
		filterVia,
	} = opts;

	const map = mapInput;
	const fieldMap = filterMap || (modelName ? FIELD_MODELS[modelName] : null);
	const via = filterVia || {};

	function stripRestricted(data) {
		if (!restrict.length || !data) return data;
		const copy = { ...data };
		for (const key of restrict) delete copy[key];
		return copy;
	}

	// Convert PB `sort=field,-field2` to a Prisma orderBy.
	function toOrderBy(sort) {
		if (!sort) return orderBy;
		const order = [];
		for (const part of String(sort).split(',')) {
			if (!part.trim()) continue;
			const desc = part.startsWith('-');
			const name = (desc ? part.slice(1) : part).trim();
			let mapped = fieldMap?.[name];
			if (!mapped) {
				if (name === 'created') mapped = 'createdAt';
				else if (name === 'updated') mapped = 'updatedAt';
				else mapped = name;
			}
			order.push({ [mapped]: desc ? 'desc' : 'asc' });
		}
		return order.length ? order : orderBy;
	}

	const translate = defaultTranslate(fieldMap, via);

	function toWhere(req, allowFilter = true) {
		const base = whereFn ? whereFn(req) : undefined;
		let merged = base || {};
		if (allowFilter && req.query?.filter) {
			const parsed = parsePbFilter(req.query.filter, translate);
			if (parsed) {
				merged = { ...merged, ...parsed };
			}
		}
		return merged;
	}

	function mapItem(item) {
		return modelName ? mapRecord(modelName, item) : item;
	}

	async function list(req, res) {
		try {
			const where = toWhere(req);
			const q = req.query?.q;
			if (q && searchable.length) {
				const or = searchable.map((field) => ({
					[field]: { contains: String(q) },
				}));
				if (where && Object.keys(where).length) {
					where.OR = [...(where.OR || []), ...or];
				} else {
					where.OR = [...(where.OR || []), ...or];
				}
			}
			const sort = toOrderBy(req.query?.sort);
			const page = Math.max(1, parseInt(req.query?.page || '1', 10));
			const perPageRaw = parseInt(req.query?.perPage || req.query?.per_page || '200', 10);
			const perPage = Math.min(500, Number.isFinite(perPageRaw) && perPageRaw > 0 ? perPageRaw : 200);

			const skip = (page - 1) * perPage;
			const take = perPage;
			const [items, total] = await Promise.all([
				model.findMany({ where, orderBy: sort, include, skip, take }),
				model.count({ where }),
			]);
			res.json({
				page,
				perPage,
				totalItems: total,
				items: items.map(mapItem),
				totalPages: Math.max(1, Math.ceil(total / perPage)),
			});
		} catch (err) {
			logger.error(`${model?.name || 'model'} list failed`, err.message);
			res.status(500).json({ error: 'Could not list records.' });
		}
	}

	async function get(req, res) {
		try {
			const where = { id: req.params.id, ...(whereFn ? whereFn(req) : {}) };
			const item = await model.findUnique({ where, include });
			if (!item) return res.status(404).json({ error: 'Record not found.' });
			res.json(mapItem(item));
		} catch (err) {
			logger.error(`${model?.name || 'model'} get failed`, err.message);
			res.status(500).json({ error: 'Could not fetch record.' });
		}
	}

	function httpError(err) {
		return { status: err?.status || 500, message: err?.message || 'Request failed.' };
	}

	async function create(req, res) {
		try {
			let data = map(modelName, req.body || {});
			data = stripRestricted(data);
			if (preCreate) data = await preCreate(req, data);
			const item = await model.create({ data });
			res.status(201).json(mapItem(item));
		} catch (err) {
			logger.error(`${model?.name || 'model'} create failed`, err.message);
			const { status, message } = httpError(err);
			res.status(status).json({ error: message });
		}
	}

	async function update(req, res) {
		try {
			let data = map(modelName, req.body || {});
			data = stripRestricted(data);
			if (preUpdate) data = await preUpdate(req, data);
			const item = await model.update({ where: { id: req.params.id }, data });
			res.json(mapItem(item));
		} catch (err) {
			logger.error(`${model?.name || 'model'} update failed`, err.message);
			const { status, message } = httpError(err);
			if (status === 404) {
				res.status(404).json({ error: 'Record not found or could not be updated.' });
			} else {
				res.status(status).json({ error: message });
			}
		}
	}

	async function remove(req, res) {
		try {
			await model.delete({ where: { id: req.params.id } });
			res.status(204).end();
		} catch (err) {
			logger.error(`${model?.name || 'model'} delete failed`, err.message);
			res.status(404).json({ error: 'Record not found.' });
		}
	}

	return { list, get, create, update, remove, opts };
}

// Wire a crudController result into a router with guard-aware middleware.
export function registerCrudRoutes(router, controller, { base = '' } = {}) {
	const { list, get, create, update, remove, opts } = controller;
	const { publicList, publicGet, listGuard, createGuard, updateGuard, deleteGuard } = opts;

	const harness = (guard, handler) => (guard ? [guard, handler] : [handler]);

	if (publicList) router.get(base || '/', list);
	else router.get(base || '/', listGuard, list);

	if (publicGet) router.get(`${base}/:id`, get);
	else router.get(`${base}/:id`, listGuard, get);

	router.post(base || '/', ...harness(createGuard, create));
	router.put(`${base}/:id`, ...harness(updateGuard, update));
	router.patch(`${base}/:id`, ...harness(updateGuard, update));
	router.delete(`${base}/:id`, ...harness(deleteGuard, remove));
}
