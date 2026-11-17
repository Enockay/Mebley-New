/**
 * scripts/optimize-images.mjs
 *
 * Generates responsive AVIF + WebP renditions of the marketing photography into
 * public/img/. The marketing pages reference these files through
 * src/components/Marketing/ResponsiveImage.tsx.
 *
 *   node scripts/optimize-images.mjs
 *
 * Re-run whenever a source photograph changes, then upload with
 *   node scripts/upload-static-assets.mjs
 * so the CDN (NEXT_PUBLIC_CDN_URL) serves the same files.
 *
 * Widths never exceed the source width. Supply 2400 px originals to get a
 * 2400 px rendition for large desktop screens.
 */
import sharp from 'sharp'
import { mkdirSync, statSync } from 'fs'
import { join } from 'path'

const root = new URL('..', import.meta.url).pathname
const src = (f) => join(root, 'public', f)
const outDir = join(root, 'public', 'img')
mkdirSync(outDir, { recursive: true })

/** name → { file, widths, crop? } — keep in sync with IMAGES in ResponsiveImage.tsx */
const JOBS = {
  hero:          { file: 'hero-bg.png',     widths: [480, 960, 1440] },
  auth:          { file: 'auth-bg.png',     widths: [640, 1024, 1536] },
  safety:        { file: 'hero-bg-5.png',   widths: [480, 960, 1400] },
  cta:           { file: 'hero-bg-3.png',   widths: [480, 960, 1400] },
  listening:     { file: 'bg-features.jpg', widths: [480, 960, 1440] },
  'profile-amara': { file: 'bg-features.jpg', widths: [360, 720], crop: { left: 560, top: 0, width: 560, height: 780 } },
  'story-1':     { file: 'couple-2.jpg',    widths: [160, 320], crop: { left: 200, top: 60,  width: 900, height: 900 } },
  'story-2':     { file: 'couple-1.jpg',    widths: [160, 320], crop: { left: 450, top: 50,  width: 900, height: 900 } },
  'story-3':     { file: 'couple-4.jpg',    widths: [160, 320], crop: { left: 250, top: 120, width: 900, height: 900 } },
}

let total = 0
for (const [name, job] of Object.entries(JOBS)) {
  for (const w of job.widths) {
    let img = sharp(src(job.file))
    if (job.crop) img = img.extract(job.crop)
    img = img.resize({ width: w, withoutEnlargement: true })
    for (const [ext, opts] of [['avif', { quality: 50, effort: 6 }], ['webp', { quality: 72 }]]) {
      const out = join(outDir, `${name}-${w}.${ext}`)
      await img.clone().toFormat(ext, opts).toFile(out)
      const kb = statSync(out).size / 1024
      total += kb
      console.log(`${name}-${w}.${ext}`.padEnd(30), `${kb.toFixed(0)} KB`)
    }
  }
}
console.log(`\nTotal written: ${(total / 1024).toFixed(2)} MB`)
