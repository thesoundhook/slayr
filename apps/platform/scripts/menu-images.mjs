#!/usr/bin/env node
// ---------------------------------------------------------------------------
// menu-images.mjs
//
// Populates `menu_items.image_url` for every item missing an image.
// For each item it searches Wikimedia Commons (free-licence) for a matching
// photo, downloads it, uploads it to the public `event-images` bucket under
// `menu/<item_id>.<ext>`, and writes a timestamped migration with the
// resulting `UPDATE ... SET image_url` statements.
//
// No npm dependencies — uses Node 18+ global fetch.
//
// Usage:
//   SUPABASE_URL=https://sgawnnixhreaepkseaaf.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
//   node apps/platform/scripts/menu-images.mjs [--dry-run] [--force]
//
//   --dry-run  Source & validate images, print what it WOULD do; no upload, no SQL.
//   --force    Re-process items that already have an image_url too.
//
// The service-role key is read from the environment only; it is never logged.
// ---------------------------------------------------------------------------

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sgawnnixhreaepkseaaf.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DRY_RUN = process.argv.includes('--dry-run')
const FORCE = process.argv.includes('--force')
const BUCKET = 'event-images'
const CONCURRENCY = 2          // Wikimedia throttles bursts; keep this low
const REQUEST_SPACING_MS = 250 // polite delay before each Commons request
const MAX_RETRIES = 4
const UA = 'slayr-menu-image-fetcher/1.0 (events admin tooling)'

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// fetch with retry/backoff that honours HTTP 429 + Retry-After (Wikimedia).
async function politeFetch(url, opts = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, opts)
    if (res.status !== 429 && res.status < 500) return res
    if (attempt >= MAX_RETRIES) return res
    const retryAfter = Number(res.headers.get('retry-after'))
    const wait = retryAfter ? retryAfter * 1000 : Math.min(8000, 500 * 2 ** attempt)
    await sleep(wait)
  }
}

if (!SERVICE_KEY && !DRY_RUN) {
  console.error('✗ SUPABASE_SERVICE_ROLE_KEY is required (or pass --dry-run).')
  process.exit(1)
}

// --- Query overrides ───────────────────────────────────────────────────────
// Only for names that make poor raw search terms (mis-spellings, brand
// normalisation, or generic cocktail names). Everything else uses the name
// plus a category-derived suffix. Keyed by lowercased item name.
const QUERY_OVERRIDES = {
  // Premium alcohol — brand normalisation
  'calorossy': 'Carlo Rossi wine bottle',
  'belaire': 'Luc Belaire wine bottle',
  'drosty hof': 'Drostdy Hof wine bottle',
  'martell swift': 'Martell Blue Swift cognac',
  'martell vs': 'Martell VS cognac',
  'black label': 'Johnnie Walker Black Label',
  "william lawson": "William Lawson's whisky",
  'observatory': 'Observatory wine South Africa',
  'blue nun authentic white': 'Blue Nun wine bottle',
  'blue nun premium ice': 'Blue Nun wine bottle',
  'blue nun pink ice': 'Blue Nun wine bottle',
  'blue nun rose': 'Blue Nun rose wine',
  'blue nun gold': 'Blue Nun gold wine',
  'four cousins': 'Four Cousins wine',
  // Beers & malt
  'mistrout': 'Hero stout beer bottle',
  'plastic origin': 'Origin beer bottle',
  'peak hollandia': 'Peak evaporated milk',
  'hollandia': 'Hollandia yoghurt drink',
  'chivita': 'Chivita juice',
  'double black': 'beer bottle dark',
  'legend': 'Legend Extra Stout',
  'amstel': 'Amstel Malta drink',
  // Soft drinks
  'climax (can)': 'energy drink can',
  'black bullet': 'energy drink can',
  'origin beer': 'Origin herbal bitters bottle',
  'fayrouz': 'Fayrouz malt drink',
  'flying fish': 'Flying Fish flavoured drink',
  'coke': 'Coca-Cola can drink',
  'fanta': 'Fanta orange drink',
  'sprite': 'Sprite lemon drink',
  'monster': 'Monster Energy drink can',
  'budweiser': 'Budweiser beer can',
  'heineken': 'Heineken beer can',
  'gulder': 'Gulder lager beer',
  'goldberg': 'Goldberg lager beer',
  'castle lite': 'Castle Lite beer',
  'desperado': 'Desperados beer',
  'smirnoff ice (big)': 'Smirnoff Ice bottle',
  'malta guinness': 'Malta Guinness drink',
  'water': 'bottled water',
  // Cocktails (generic / brandless names — best-effort, may log a miss)
  'sex on the beach': 'Sex on the Beach cocktail',
  'long island iced tea': 'Long Island Iced Tea cocktail',
  'passion daiquiri': 'daiquiri cocktail',
  'mango daiquiri': 'mango daiquiri cocktail',
  'strawberry daiquiri': 'strawberry daiquiri cocktail',
  'screaming multiple orgasm': 'layered cocktail shot',
  'jagermeister pussy': 'jagermeister cocktail shot',
  'strawberry pussy': 'strawberry cocktail',
  "lady's delight": 'pink cocktail',
  'my lady': 'pink cocktail',
  'pink lady': 'Pink Lady cocktail drink',
  'margarita': 'margarita cocktail drink glass',
  'mojito': 'mojito cocktail drink',
  'motherfvcker': 'dark cocktail drink',
  'zombie': 'Zombie cocktail tiki',
  'mai tai': 'Mai Tai cocktail',
  // Non-alcoholic
  'chapman': 'Chapman drink Nigeria',
  'virgin colada': 'virgin pina colada mocktail',
  'safe sex on the beach': 'orange mocktail',
  'virgin lady': 'mocktail drink',
  // Dishes — Nigerian soups need precise terms
  'afang soup': 'Afang soup',
  'ofe nsala': 'white soup ofe nsala',
  'ogbono soup': 'Ogbono soup',
  'ewedu soup': 'Ewedu soup',
  'egusi soup': 'Egusi soup',
  'bitterleaf soup': 'bitterleaf soup ofe onugbu',
  'yam porridge / plantain porridge': 'yam porridge asaro',
  'sea food okra': 'okra soup seafood',
  'sea food okro (farmer\'s food)': 'okra soup seafood',
  'fisherman soup': 'seafood pepper soup',
  'kloft special (chef platter)': 'food platter assorted',
  'platter': 'food platter assorted',
  'golden yam': 'fried yam',
  'yamarita with egg sauce': 'fried yam egg sauce',
  'roasted plantain with sauce (add-on)': 'roasted plantain bole',
  'burger (beef or chicken)': 'chicken burger',
  'fillet croaker fish / chicken in lemon & butter sauce': 'fish fillet lemon butter sauce',
  // Extras
  'shisha': 'shisha hookah pipe',
}

// Category name → search suffix appended to the item name when no override hits.
const CATEGORY_SUFFIX = {
  'Cocktails': 'cocktail',
  'Non-Alcoholic Drinks': 'drink',
  'African Dishes': 'Nigerian food',
  'Continental Dishes': 'food dish',
  'Additional Dishes': 'food dish',
  'Beers & Malt': 'bottle',
  'Soft Drinks & Energy Drinks': 'drink',
  'Premium Alcohol': 'bottle',
  'Extras': '',
}

// --- Supabase REST helpers ─────────────────────────────────────────────────
const restHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
}

async function fetchRows() {
  const filter = FORCE ? '' : '&image_url=is.null'
  const url = `${SUPABASE_URL}/rest/v1/menu_items?select=id,name,category_id${filter}`
  const res = await fetch(url, { headers: restHeaders })
  if (!res.ok) throw new Error(`menu_items fetch failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function fetchCategories() {
  const url = `${SUPABASE_URL}/rest/v1/menu_categories?select=id,name`
  const res = await fetch(url, { headers: restHeaders })
  if (!res.ok) throw new Error(`menu_categories fetch failed: ${res.status} ${await res.text()}`)
  const rows = await res.json()
  return Object.fromEntries(rows.map(r => [r.id, r.name]))
}

// --- Image sourcing (Wikimedia Commons) ─────────────────────────────────────
function buildQuery(name, categoryName) {
  const override = QUERY_OVERRIDES[name.toLowerCase()]
  if (override) return override
  const suffix = CATEGORY_SUFFIX[categoryName] ?? ''
  return suffix ? `${name} ${suffix}` : name
}

async function findCommonsImage(query) {
  const api = `https://commons.wikimedia.org/w/api.php?action=query&format=json` +
    `&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=6` +
    `&prop=imageinfo&iiprop=url|mime&iiurlwidth=800`
  await sleep(REQUEST_SPACING_MS)
  const res = await politeFetch(api, { headers: { 'User-Agent': UA } })
  if (!res.ok) return null
  const json = await res.json()
  const pages = Object.values(json?.query?.pages ?? {})
  if (!pages.length) return null

  // Score by how many query tokens appear in the file title (relevance),
  // tie-broken by Commons search rank. Blind top-rank picks too many
  // false positives for ambiguous names (e.g. "Margarita" the island).
  const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2)
  const score = (title) => {
    const t = (title || '').toLowerCase()
    return tokens.reduce((n, tok) => n + (t.includes(tok) ? 1 : 0), 0)
  }
  pages.sort((a, b) =>
    score(b.title) - score(a.title) || (a.index ?? 999) - (b.index ?? 999))

  for (const p of pages) {
    const info = p.imageinfo?.[0]
    if (!info) continue
    const mime = info.mime || ''
    if (mime !== 'image/jpeg' && mime !== 'image/png' && mime !== 'image/webp') continue // skip svg/tif/etc
    const ext = mime === 'image/jpeg' ? 'jpg' : mime === 'image/png' ? 'png' : 'webp'
    return { downloadUrl: info.thumburl || info.url, mime, ext, title: p.title }
  }
  return null
}

async function uploadToBucket(path, buffer, mime) {
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...restHeaders, 'Content-Type': mime, 'x-upsert': 'true' },
    body: buffer,
  })
  if (!res.ok) throw new Error(`upload ${path} failed: ${res.status} ${await res.text()}`)
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`
}

// --- Simple concurrency pool ────────────────────────────────────────────────
async function pool(items, limit, worker) {
  const results = new Array(items.length)
  let i = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++
      results[idx] = await worker(items[idx], idx)
    }
  })
  await Promise.all(runners)
  return results
}

// --- Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log(`→ project: ${SUPABASE_URL}${DRY_RUN ? '  (dry run)' : ''}`)
  const [rows, categories] = await Promise.all([fetchRows(), fetchCategories()])
  console.log(`→ ${rows.length} item(s) to process\n`)

  const updates = []
  const misses = []

  await pool(rows, CONCURRENCY, async (row) => {
    const catName = categories[row.category_id] || ''
    const query = buildQuery(row.name, catName)
    try {
      const found = await findCommonsImage(query)
      if (!found) { misses.push({ ...row, query }); console.log(`  ✗ no image  ${row.name}  ("${query}")`); return }

      const imgRes = await politeFetch(found.downloadUrl, { headers: { 'User-Agent': UA } })
      if (!imgRes.ok) { misses.push({ ...row, query }); console.log(`  ✗ dl ${imgRes.status}  ${row.name}`); return }
      const buffer = Buffer.from(await imgRes.arrayBuffer())

      if (DRY_RUN) {
        console.log(`  ✓ found     ${row.name}  (${(buffer.length / 1024).toFixed(0)}kb)  ← ${found.downloadUrl}`)
        return
      }

      const publicUrl = await uploadToBucket(`menu/${row.id}.${found.ext}`, buffer, found.mime)
      updates.push({ id: row.id, name: row.name, url: publicUrl })
      console.log(`  ✓ uploaded  ${row.name}`)
    } catch (err) {
      misses.push({ ...row, query, error: String(err.message || err) })
      console.log(`  ✗ error     ${row.name}: ${err.message || err}`)
    }
  })

  console.log(`\n→ ${updates.length} uploaded, ${misses.length} missed`)

  if (!DRY_RUN && updates.length) {
    const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) // YYYYMMDDHHMMSS
    const here = dirname(fileURLToPath(import.meta.url))
    const outPath = resolve(here, `../supabase/migrations/${ts}_menu_item_images.sql`)
    const sql = [
      `-- Auto-generated by menu-images.mjs on ${new Date().toISOString()}.`,
      `-- Sets menu_items.image_url to Wikimedia Commons photos uploaded to the event-images bucket.`,
      ``,
      `BEGIN;`,
      ...updates.map(u =>
        `UPDATE public.menu_items SET image_url = '${u.url}' WHERE id = '${u.id}'; -- ${u.name.replace(/'/g, "''")}`),
      `COMMIT;`,
      ``,
    ].join('\n')
    mkdirSync(dirname(outPath), { recursive: true })
    writeFileSync(outPath, sql)
    console.log(`→ wrote migration: ${outPath}`)
  }

  if (misses.length) {
    console.log(`\nItems with no image (fill manually or tweak QUERY_OVERRIDES, then re-run):`)
    for (const m of misses) console.log(`  - ${m.name}  [${m.id}]  query="${m.query}"`)
  }
}

main().catch(err => { console.error('✗ fatal:', err); process.exit(1) })
