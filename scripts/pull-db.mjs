import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Strip the ?options=... param that PgBouncer rejects
const rawUrl = process.env.DATABASE_URL || '';
const cleanUrl = rawUrl.replace(/[?&]options=[^&]*/g, '').replace(/[?&]$/, '');

if (!cleanUrl) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

console.log('[pull-db] Connecting to Supabase...');

const pool = new pg.Pool({
  connectionString: cleanUrl,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10_000,
  query_timeout: 15_000,
});

async function q(sql, params = []) {
  const { rows } = await pool.query(sql, params);
  return rows;
}

function toCamel(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = v;
  }
  return out;
}

try {
  // ── users ──────────────────────────────────────────────────────────
  const usersRaw = await q(`
    SELECT id, username, password_hash, email, role,
           two_factor_enabled, two_factor_secret
    FROM public.users
    ORDER BY id
  `);
  const users = usersRaw.map(r => ({
    id: r.id,
    username: r.username,
    passwordHash: r.password_hash,
    email: r.email,
    role: r.role,
    twoFactorEnabled: r.two_factor_enabled ?? false,
    ...(r.two_factor_secret ? { twoFactorSecret: r.two_factor_secret } : {}),
  }));
  console.log(`[pull-db] users: ${users.length}`);

  // ── terms ──────────────────────────────────────────────────────────
  const termsRaw = await q(`
    SELECT id, name, slug, taxonomy, description, parent_id, meta
    FROM public.terms
    ORDER BY id
  `);
  const terms = termsRaw.map(r => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    taxonomy: r.taxonomy,
    ...(r.description ? { description: r.description } : {}),
    ...(r.parent_id ? { parentId: r.parent_id } : {}),
    ...(r.meta && Object.keys(r.meta).length ? { meta: r.meta } : {}),
  }));
  console.log(`[pull-db] terms: ${terms.length}`);

  // ── posts ──────────────────────────────────────────────────────────
  const postsRaw = await q(`
    SELECT id, title, slug, content, excerpt, type, status,
           author_id, featured_image, menu_order, meta, terms,
           created_at, updated_at, published_at
    FROM public.posts
    ORDER BY menu_order, created_at
  `);
  const posts = postsRaw.map(r => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    content: r.content,
    excerpt: r.excerpt,
    type: r.type,
    status: r.status,
    authorId: r.author_id,
    featuredImage: r.featured_image,
    menuOrder: r.menu_order ?? 0,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : r.updated_at,
    ...(r.published_at != null
      ? { published_at: r.published_at instanceof Date ? r.published_at.toISOString() : r.published_at }
      : {}),
    meta: r.meta ?? {},
    terms: r.terms ?? [],
  }));
  console.log(`[pull-db] posts: ${posts.length}`);

  // ── options ────────────────────────────────────────────────────────
  const optionsRaw = await q(`
    SELECT id, option_name, option_value
    FROM public.options
    WHERE option_name != 'cms_database_backup'
    ORDER BY id
  `);
  const options = optionsRaw.map(r => {
    // option_value was stored as JSON.stringify({ id, optionName, optionValue })
    // try to unwrap that format; fall back to raw
    let val = r.option_value;
    if (val && typeof val === 'object' && 'optionName' in val && 'optionValue' in val) {
      return { id: r.id, optionName: val.optionName, optionValue: val.optionValue };
    }
    return { id: r.id, optionName: r.option_name, optionValue: val };
  });
  console.log(`[pull-db] options: ${options.length}`);

  // ── submissions ────────────────────────────────────────────────────
  const subsRaw = await q(`
    SELECT id, name, email, phone, message, status,
           source, product_id, created_at, meta
    FROM public.submissions
    ORDER BY created_at DESC
  `);
  const submissions = subsRaw.map(r => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    message: r.message,
    status: r.status ?? 'unread',
    ...(r.source ? { source: r.source } : {}),
    ...(r.product_id ? { productId: r.product_id } : {}),
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    ...(r.meta && Object.keys(r.meta).length ? { meta: r.meta } : {}),
  }));
  console.log(`[pull-db] submissions: ${submissions.length}`);

  // ── videos ─────────────────────────────────────────────────────────
  const videosRaw = await q(`
    SELECT id, title, url, thumbnail, description, sort_order, created_at
    FROM public.videos
    ORDER BY sort_order, created_at
  `).catch(() => {
    console.warn('[pull-db] videos table not found, using empty array');
    return [];
  });
  const videos = videosRaw.map(r => ({
    id: r.id,
    title: r.title,
    slug: r.id ?? '',
    description: r.description ?? '',
    videoUrl: r.url ?? '',
    thumbnail: r.thumbnail ?? '',
    category: 'introduction',
    duration: '',
    isFeatured: true,
    status: 'published',
    sortOrder: r.sort_order ?? 0,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    updatedAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  }));
  console.log(`[pull-db] videos: ${videos.length}`);

  // ── perspectives ───────────────────────────────────────────────────
  const perspRaw = await q(`
    SELECT id, title, slug, excerpt, content, featured_image,
           status, image_url, link, space_type, gallery,
           product_gallery, related_product_ids, is_featured,
           sort_order, created_at, updated_at
    FROM public.perspectives
    ORDER BY sort_order, created_at
  `).catch(() => {
    console.warn('[pull-db] perspectives table not found, using empty array');
    return [];
  });
  const perspectives = perspRaw.map(r => ({
    id: r.id,
    title: r.title ?? '',
    slug: r.slug ?? '',
    excerpt: r.excerpt ?? '',
    content: r.content ?? '',
    featuredImage: r.featured_image ?? '',
    spaceType: r.space_type ?? '',
    gallery: r.gallery ?? [],
    productGallery: r.product_gallery ?? [],
    relatedProductIds: r.related_product_ids ?? [],
    isFeatured: r.is_featured ?? false,
    status: r.status ?? 'published',
    sortOrder: r.sort_order ?? 0,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : r.updated_at,
  }));
  console.log(`[pull-db] perspectives: ${perspectives.length}`);

  // ── media_folders ──────────────────────────────────────────────────
  const foldersRaw = await q(`
    SELECT id, name, parent_id, created_at
    FROM public.media_folders
    ORDER BY created_at
  `).catch(() => {
    console.warn('[pull-db] media_folders table not found, using empty array');
    return [];
  });
  const mediaFolders = foldersRaw.map(r => ({
    id: r.id,
    name: r.name,
    ...(r.parent_id ? { parentId: r.parent_id } : {}),
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  }));
  console.log(`[pull-db] mediaFolders: ${mediaFolders.length}`);

  // ── media_items ────────────────────────────────────────────────────
  const itemsRaw = await q(`
    SELECT id, folder_id, filename, url, mime_type, size,
           width, height, alt, created_at
    FROM public.media_items
    ORDER BY created_at
  `).catch(() => {
    console.warn('[pull-db] media_items table not found, using empty array');
    return [];
  });
  const mediaItems = itemsRaw.map(r => ({
    id: r.id,
    ...(r.folder_id ? { folderId: r.folder_id } : {}),
    url: r.url ?? '',
    mimeType: r.mime_type ?? 'image/jpeg',
    ...(r.filename ? { filename: r.filename } : {}),
    ...(r.size ? { size: r.size } : {}),
    ...(r.alt ? { altText: r.alt } : {}),
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    updatedAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  }));
  console.log(`[pull-db] mediaItems: ${mediaItems.length}`);

  // ── assemble & write ───────────────────────────────────────────────
  const dbJson = {
    users,
    terms,
    posts,
    options,
    submissions,
    videos,
    perspectives,
    mediaFolders,
    mediaItems,
  };

  const outPath = path.join(__dirname, '..', 'db.json');
  fs.writeFileSync(outPath, JSON.stringify(dbJson, null, 2), 'utf-8');
  console.log(`[pull-db] ✅ db.json updated (${JSON.stringify(dbJson).length} bytes)`);

} catch (err) {
  console.error('[pull-db] ❌ Error:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
