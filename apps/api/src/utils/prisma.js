import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import pkg from '@prisma/client';
import logger from './logger.js';

const PrismaClient = pkg.PrismaClient || pkg?.default?.PrismaClient || pkg;

// Load apps/api/.env regardless of process cwd (monorepo root vs package dir).
const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const envPath = path.join(apiRoot, '.env');
if (fs.existsSync(envPath)) {
	try {
		process.loadEnvFile(envPath);
	} catch (_) {
		/* ignore */
	}
}

// The mariadb driver's `uri` option is unreliable (it hangs on this MySQL 8
// instance), so parse the DATABASE_URL into an explicit config object.
export function parseConnectionString() {
	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) {
		logger.error('DATABASE_URL is not set. Prisma cannot connect.');
		return null;
	}
	try {
		const url = new URL(connectionString);
		return {
			host: url.hostname,
			port: url.port ? Number(url.port) : 3306,
			user: url.username,
			password: url.password,
			database: url.pathname.replace(/^\//, ''),
			// Force utf8mb4 so non-ASCII content (e.g. £, é) round-trips cleanly.
			charset: 'utf8mb4',
			connectionLimit: 10,
			acquireTimeout: 30000,
		};
	} catch (e) {
		logger.error('Failed to parse DATABASE_URL', e);
		return null;
	}
}

export function createPrismaClient() {
	const config = parseConnectionString();
	const adapter = config ? new PrismaMariaDb(config) : undefined;
	const options = {
		log: ['warn', 'error'],
	};
	if (adapter) {
		options.adapter = adapter;
	}
	return new PrismaClient(options);
}

const prisma = createPrismaClient();

export default prisma;
export { prisma };