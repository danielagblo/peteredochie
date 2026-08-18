import { spawn, execSync } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isWin = os.platform() === 'win32';
const binName = isWin ? 'pocketbase.exe' : 'pocketbase';
const binPath = path.join(__dirname, binName);

// 1. Load environment variables from apps/api/.env
const apiEnvPath = path.join(__dirname, '..', 'api', '.env');
if (fs.existsSync(apiEnvPath)) {
	try {
		const envContent = fs.readFileSync(apiEnvPath, 'utf8');
		for (const line of envContent.split(/\r?\n/)) {
			const trimmed = line.trim();
			if (trimmed && !trimmed.startsWith('#')) {
				const parts = trimmed.split('=');
				const key = parts[0].trim();
				const val = parts.slice(1).join('=').trim();
				if (key && !process.env[key]) {
					process.env[key] = val;
				}
			}
		}
	} catch (err) {
		console.warn('Warning: Failed to read API .env file:', err.message);
	}
}

// 2. Set default fallbacks if environment variables are not defined
process.env.PB_SUPERUSER_EMAIL = process.env.PB_SUPERUSER_EMAIL || 'admin@example.com';
process.env.PB_SUPERUSER_PASSWORD = process.env.PB_SUPERUSER_PASSWORD || '1234567890';
process.env.PB_ENCRYPTION_KEY = process.env.PB_ENCRYPTION_KEY || 'pb_encryption_key_32_characters_';

function downloadFile(url, dest) {
	return new Promise((resolve, reject) => {
		const file = fs.createWriteStream(dest);
		https.get(url, (response) => {
			if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
				return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
			}
			if (response.statusCode !== 200) {
				return reject(new Error(`Failed to download: Status ${response.statusCode}`));
			}
			response.pipe(file);
			file.on('finish', () => {
				file.close(resolve);
			});
		}).on('error', (err) => {
			fs.unlink(dest, () => {});
			reject(err);
		});
	});
}

async function ensurePocketBase() {
	if (fs.existsSync(binPath)) {
		return;
	}

	console.log(`PocketBase binary not found at ${binPath}. Attempting to auto-download...`);
	
	let version = '0.39.8';
	try {
		const verContent = fs.readFileSync(path.join(__dirname, '.pocketbase-version'), 'utf8').trim();
		if (verContent) version = verContent;
	} catch (e) {
		// Ignore, fallback to default
	}

	const platform = os.platform();
	const arch = os.arch();
	let pbPlatform = '';
	let pbArch = 'amd64';

	if (arch === 'arm64') {
		pbArch = 'arm64';
	}

	if (platform === 'win32') {
		pbPlatform = 'windows';
	} else if (platform === 'darwin') {
		pbPlatform = 'darwin';
	} else if (platform === 'linux') {
		pbPlatform = 'linux';
	} else {
		throw new Error(`Unsupported OS platform: ${platform}`);
	}

	const zipName = `pocketbase_${version}_${pbPlatform}_${pbArch}.zip`;
	const url = `https://github.com/pocketbase/pocketbase/releases/download/v${version}/${zipName}`;
	const zipPath = path.join(__dirname, zipName);

	console.log(`Downloading PocketBase v${version} from ${url}...`);
	await downloadFile(url, zipPath);
	console.log('Download complete. Extracting...');

	try {
		if (platform === 'win32') {
			execSync(`tar -xf "${zipPath}" -C "${__dirname}"`, { stdio: 'inherit' });
		} else {
			execSync(`unzip -o "${zipPath}" -d "${__dirname}"`, { stdio: 'inherit' });
			execSync(`chmod +x "${binPath}"`, { stdio: 'inherit' });
		}
		console.log('Extraction complete.');
	} catch (err) {
		console.error('Failed to extract zip archive using system tools:', err);
		throw err;
	} finally {
		try {
			fs.unlinkSync(zipPath);
		} catch (e) {}
	}
}

async function main() {
	try {
		await ensurePocketBase();
	} catch (err) {
		console.error('Failed to ensure PocketBase binary is present:', err);
		process.exit(1);
	}

	const args = process.argv.slice(2);
	const child = spawn(binPath, args, { stdio: 'inherit' });

	child.on('close', (code) => {
		process.exit(code || 0);
	});
}

main();
