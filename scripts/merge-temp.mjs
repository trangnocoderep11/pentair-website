import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dbPath   = path.join(root, 'db.json');
const tempPath = path.join(root, 'temp.json');

const db   = JSON.parse(fs.readFileSync(dbPath,   'utf-8'));
const temp = JSON.parse(fs.readFileSync(tempPath, 'utf-8'));

let added = 0, updated = 0;

for (const [key, incoming] of Object.entries(temp)) {
  if (!Array.isArray(incoming)) continue;
  if (!db[key]) db[key] = [];

  for (const item of incoming) {
    const idx = db[key].findIndex(x => x.id === item.id);
    if (idx >= 0) {
      db[key][idx] = item;
      updated++;
    } else {
      db[key].push(item);
      added++;
    }
  }
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
console.log(`✅  merged: +${added} added, ~${updated} updated → db.json`);
