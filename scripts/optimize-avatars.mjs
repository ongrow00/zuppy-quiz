/**
 * Gera WebP 128×128 para a pilha social (static/avatars/zuppy_*).
 * Usa o PNG se existir; senão reprocessa o .webp atual.
 */
import sharp from 'sharp';
import { existsSync, renameSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const dir = path.join(root, 'static', 'avatars');

const bases = ['zuppy_1', 'zuppy_2', 'zuppy_3', 'zuppy_4'];

for (const base of bases) {
	const png = path.join(dir, `${base}.png`);
	const webpIn = path.join(dir, `${base}.webp`);
	const input = existsSync(png) ? png : webpIn;
	if (!existsSync(input)) {
		console.warn('skip (missing source):', base);
		continue;
	}
	const out = path.join(dir, `${base}.webp`);
	const tmp = path.join(dir, `${base}.webp.tmp`);
	await sharp(input).resize(128, 128, { fit: 'cover' }).webp({ quality: 82 }).toFile(tmp);
	renameSync(tmp, out);
	console.log('wrote', path.relative(root, out));
}
