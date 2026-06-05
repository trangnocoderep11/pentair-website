import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dbPath = path.join(root, 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

// ─── Image mapping by product ────────────────────────────────────────────────

const maxi = {
  featuredImage: '/uploads/1780541986297-SOF-2026-00571-he-thong-loc-tong-pentair-softena-cs-maxi-phoi-canh-01.jpg',
  gallery: [
    '/uploads/1780541986297-SOF-2026-00571-he-thong-loc-tong-pentair-softena-cs-maxi-phoi-canh-01.jpg',
    '/uploads/1780541986366-SOF-2026-00571-he-thong-loc-tong-pentair-softena-cs-maxi-phoi-canh-02.jpg',
    '/uploads/1780541986437-SOF-2026-00571-he-thong-loc-tong-pentair-softena-cs-maxi-phoi-canh-03.jpg',
    '/uploads/1780541986514-SOF-2026-00571-he-thong-loc-tong-pentair-softena-cs-maxi-phoi-canh-04.jpg',
    '/uploads/1780541986575-SOF-2026-00571-he-thong-loc-tong-pentair-softena-cs-maxi-phoi-canh-05.jpg',
    '/uploads/1780541986668-SOF-2026-00571-he-thong-loc-tong-pentair-softena-cs-maxi-phoi-canh-06.jpg',
  ],
  productGallery: [
    '/uploads/1780541986736-SOF-2026-00571-he-thong-loc-tong-pentair-softena-cs-maxi-phoi-canh-a.webp',
    '/uploads/1780541986803-SOF-2026-00571-he-thong-loc-tong-pentair-softena-cs-maxi-phoi-canh-b.webp',
    '/uploads/1780541986862-SOF-2026-00571-he-thong-loc-tong-pentair-softena-cs-maxi-phoi-canh-c.webp',
  ],
  relatedProductIds: ['prod-maxi'],
};

const foleo = {
  featuredImage: '/uploads/1780543118634-SOF-2026-00571-he-thong-loc-tong-pentair-foleo-phoi-canh-01.jpg',
  gallery: [
    '/uploads/1780543118634-SOF-2026-00571-he-thong-loc-tong-pentair-foleo-phoi-canh-01.jpg',
    '/uploads/1780543118691-SOF-2026-00571-he-thong-loc-tong-pentair-foleo-phoi-canh-02.jpg',
    '/uploads/1780543118757-SOF-2026-00571-he-thong-loc-tong-pentair-foleo-phoi-canh-03__1_.jpg',
    '/uploads/1780543118826-SOF-2026-00571-he-thong-loc-tong-pentair-foleo-phoi-canh-03.jpg',
    '/uploads/1780543118874-SOF-2026-00571-he-thong-loc-tong-pentair-foleo-phoi-canh-05.jpg',
  ],
  productGallery: [
    '/uploads/1780543118894-SOF-2026-00571-he-thong-loc-tong-pentair-foleo-pro-max-phoi-canh-b.webp',
    '/uploads/1780543118909-SOF-2026-00571-he-thong-loc-tong-pentair-foleo-pro-max-phoi-canh-c.webp',
  ],
  relatedProductIds: ['post-1780482009590'],
};

const watertrust = {
  featuredImage: '/uploads/1780045414669-he-thong-loc-tong-pentair-watertrust-trongkhong-gian-noi-that-san-trong.jpeg',
  gallery: [
    '/uploads/1780045414669-he-thong-loc-tong-pentair-watertrust-trongkhong-gian-noi-that-san-trong.jpeg',
    '/uploads/1780045414435-he-thong-loc-tong-pentair-watertrust-trong-cac-khong-gian-01.webp',
    '/uploads/1780045414454-he-thong-loc-tong-pentair-watertrust-trong-cac-khong-gian-02.webp',
    '/uploads/1780045414467-he-thong-loc-tong-pentair-watertrust-trong-cac-khong-gian-03.webp',
    '/uploads/1780045414477-he-thong-loc-tong-pentair-watertrust-trong-cac-khong-gian-04.webp',
    '/uploads/1780045414488-he-thong-loc-tong-pentair-watertrust-trong-cac-khong-gian-05.webp',
    '/uploads/1780045414497-he-thong-loc-tong-pentair-watertrust-trong-cac-khong-gian-6.webp',
    '/uploads/1780045414508-he-thong-loc-tong-pentair-watertrust-trong-cac-khong-gian-07.webp',
    '/uploads/1780045414516-he-thong-loc-tong-pentair-watertrust-trong-cac-khong-gian-08.webp',
    '/uploads/1780045414525-he-thong-loc-tong-pentair-watertrust-trong-cac-khong-gian-09.webp',
    '/uploads/1780045414536-he-thong-loc-tong-pentair-watertrust-trong-cac-khong-gian-10.webp',
    '/uploads/1780045414545-he-thong-loc-tong-pentair-watertrust-trong-cac-khong-gian-11.webp',
    '/uploads/1780045414557-he-thong-loc-tong-pentair-watertrust-trong-cac-khong-gian-12.webp',
    '/uploads/1780045414567-he-thong-loc-tong-pentair-watertrust-trong-cac-khong-gian-13.webp',
    '/uploads/1780045414579-he-thong-loc-tong-pentair-watertrust-trong-cac-khong-gian-14.webp',
    '/uploads/1780045414591-he-thong-loc-tong-pentair-watertrust-trong-cac-khong-gian-15.webp',
    '/uploads/1780045414599-he-thong-loc-tong-pentair-watertrust-trong-cac-khong-gian-16.webp',
    '/uploads/1780045414612-he-thong-loc-tong-pentair-watertrust-trong-cac-khong-gian-17.webp',
    '/uploads/1780045414681-Ultra_realistic_luxury_architectural_visualization_202605221548.webp',
  ],
  productGallery: [],
  relatedProductIds: ['post-1780042445990'],
};

const midi = {
  featuredImage: '/uploads/1780544033198-SOF-2026-00571-he-thong-loc-tong-pentair-softena-cs-midi-phoi-canh-01.jpg',
  gallery: [
    '/uploads/1780544033198-SOF-2026-00571-he-thong-loc-tong-pentair-softena-cs-midi-phoi-canh-01.jpg',
    '/uploads/1780544033245-SOF-2026-00571-he-thong-loc-tong-pentair-softena-cs-midi-phoi-canh-03.jpg',
    '/uploads/1780544033303-SOF-2026-00571-he-thong-loc-tong-pentair-softena-cs-midi-phoi-canh-04.jpg',
  ],
  productGallery: [
    '/uploads/1780544033320-SOF-2026-00571-he-thong-loc-tong-pentair-softena-cs-midi-phoi-canh-a.webp',
  ],
  relatedProductIds: ['prod-midi'],
};

// ─── Apply to perspectives ────────────────────────────────────────────────────

const map = {
  'per-1':               maxi,
  'per-2':               foleo,
  'per-3':               watertrust,
  'per-1780544135256':   midi,
};

for (const p of db.perspectives) {
  const patch = map[p.id];
  if (!patch) continue;
  Object.assign(p, patch);
  console.log(`✓ ${p.id} — ${p.title}`);
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
console.log('\n✅  db.json updated');
