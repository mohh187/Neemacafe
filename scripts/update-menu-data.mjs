import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envCandidates = [
  path.join(__dirname, '.env'),
  path.join(process.cwd(), '.env')
];

let envLoaded = false;
for (const candidate of envCandidates) {
  try {
    await fs.access(candidate);
    dotenv.config({ path: candidate });
    envLoaded = true;
    break;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

if (!envLoaded) {
  dotenv.config();
}

const menuDataFile = process.env.MENU_DATA_FILE || 'menu-data.js';
const uploadMapPath = path.join(process.cwd(), 'scripts', 'upload-map.json');

const rawMap = await fs.readFile(uploadMapPath, 'utf8');
const uploadMap = JSON.parse(rawMap);

const byRelative = new Map();
const byBase = new Map();

for (const entry of uploadMap) {
  const normalizedLocal = entry.local.replace(/\\/g, '/');
  const trimmed = normalizedLocal.replace(/^\.\//, '');
  byRelative.set(trimmed.toLowerCase(), entry.url);
  byRelative.set(normalizedLocal.toLowerCase(), entry.url);

  const baseName = path.basename(normalizedLocal).toLowerCase();
  const withoutExt = baseName.replace(/\.(png|jpe?g|webp)$/i, '');
  if (!byBase.has(withoutExt)) {
    byBase.set(withoutExt, entry.url);
  }
}

let text = await fs.readFile(menuDataFile, 'utf8');

const imgRegex = /https?:\/\/[^"'\s]+\.(?:png|jpe?g|webp)|(?:\.\.?\/)?[^"'\s]+\.(?:png|jpe?g|webp)/gi;

let replacements = 0;

text = text.replace(imgRegex, (match) => {
  const cleaned = match.replace(/^["']|["']$/g, '');
  const noQuery = cleaned.split(/[?#]/)[0];
  const normalized = noQuery.replace(/\\/g, '/');
  const trimmed = normalized.replace(/^\.\//, '').toLowerCase();

  const direct = byRelative.get(trimmed) || byRelative.get(normalized.toLowerCase());
  if (direct) {
    replacements += 1;
    return direct;
  }

  const baseName = path.basename(trimmed);
  const withoutExt = baseName.replace(/\.(png|jpe?g|webp)$/i, '');
  const fromBase = byBase.get(withoutExt.toLowerCase());
  if (fromBase) {
    replacements += 1;
    return fromBase;
  }

  return match;
});

await fs.writeFile(menuDataFile, text);
console.log(`Updated ${menuDataFile} with ${replacements} replacements.`);
