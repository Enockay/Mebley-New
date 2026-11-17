#!/usr/bin/env node
/**
 * Renders the store screenshots and the demo video from the dev-only
 * /studio route (src/app/studio). Run with `npm run dev` going:
 *
 *   node scripts/render-media.mjs            # screenshots + video
 *   node scripts/render-media.mjs shots      # screenshots only
 *   node scripts/render-media.mjs video      # video only
 *
 * Needs playwright-core and a Playwright Chromium + ffmpeg install
 * (`npx playwright install chromium ffmpeg`). Set PLAYWRIGHT_CORE to the
 * package path if it is not installed in this project, FFMPEG to use a
 * different ffmpeg, and BASE_URL if the dev server is not on port 3000.
 *
 * Output:
 *   marketing-assets/store-screenshots/*.png   1290 x 2796 (iPhone 6.7")
 *   marketing-assets/video/mebley-demo-1080p.webm
 *   public/video/mebley-demo.webm              720p, used on the website
 *   public/video/mebley-demo-poster.jpg
 * After rendering, run scripts/upload-static-assets.mjs to push public/ to the CDN.
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const BASE = process.env.BASE_URL || 'http://localhost:3000'
const FPS = 30
const what = process.argv[2] || 'all'

const pw = await import(process.env.PLAYWRIGHT_CORE || 'playwright-core')
const chromium = pw.chromium || pw.default.chromium

function findFfmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG
  const cache = join(homedir(), process.platform === 'darwin' ? 'Library/Caches/ms-playwright' : '.cache/ms-playwright')
  const dirs = existsSync(cache) ? readdirSync(cache).filter(d => d.startsWith('ffmpeg-')).sort().reverse() : []
  for (const d of dirs) for (const f of ['ffmpeg-mac', 'ffmpeg-linux', 'ffmpeg-win64.exe']) {
    if (existsSync(join(cache, d, f))) return join(cache, d, f)
  }
  return 'ffmpeg'
}

/** The CDN does not have new files until they are uploaded, so serve /static/* from the dev server. */
async function newContext(browser, opts) {
  const ctx = await browser.newContext(opts)
  await ctx.route('**/*', route => {
    const u = new URL(route.request().url())
    if (u.origin !== new URL(BASE).origin && u.pathname.startsWith('/static/')) {
      return fetch(BASE + u.pathname.replace(/^\/static/, '')).then(async r =>
        route.fulfill({ status: r.status, headers: { 'content-type': r.headers.get('content-type') || 'application/octet-stream' }, body: Buffer.from(await r.arrayBuffer()) }))
    }
    return route.continue()
  })
  return ctx
}

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.images].map(img => img.complete ? null : new Promise(r => { img.onload = img.onerror = r })))
  })
}

const SHOT_NAMES = ['discover', 'voice-note', 'stitch', 'match', 'safety']

async function renderShots(browser) {
  const out = join(ROOT, 'marketing-assets/store-screenshots')
  mkdirSync(out, { recursive: true })
  const ctx = await newContext(browser, { viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 })
  const page = await ctx.newPage()
  for (let n = 1; n <= 5; n++) {
    await page.goto(`${BASE}/studio?shot=${n}`, { waitUntil: 'networkidle' })
    await settle(page)
    const file = join(out, `mebley-0${n}-${SHOT_NAMES[n - 1]}.png`)
    await page.screenshot({ path: file })
    console.log('shot', file)
  }
  await ctx.close()
}

function encoder(ffmpeg, file, scale) {
  const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', 'pipe:0',
    ...(scale ? ['-vf', `scale=${scale}`] : []),
    '-c:v', 'vp8', '-b:v', scale ? '1400k' : '2800k', '-crf', '8', '-qmin', '0', '-qmax', '40',
    '-deadline', 'good', '-cpu-used', '2', '-pix_fmt', 'yuv420p', '-an', file]
  const p = spawn(ffmpeg, args, { stdio: ['pipe', 'inherit', 'inherit'] })
  const done = new Promise((res, rej) => p.on('close', c => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`)))))
  return { stdin: p.stdin, done }
}

const write = (stream, buf) => new Promise(res => (stream.write(buf) ? res() : stream.once('drain', res)))

async function renderVideo(browser) {
  const ffmpeg = findFfmpeg()
  mkdirSync(join(ROOT, 'marketing-assets/video'), { recursive: true })
  mkdirSync(join(ROOT, 'public/video'), { recursive: true })
  const ctx = await newContext(browser, { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/studio?video=1`, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => typeof window.__seek === 'function')
  // Touch every scene once so lazy images are loaded before capture
  const duration = await page.evaluate(() => window.__duration)
  for (let t = 0; t < duration; t += 3) await page.evaluate(v => window.__seek(v), t)
  await settle(page)

  const hd = encoder(ffmpeg, join(ROOT, 'marketing-assets/video/mebley-demo-1080p.webm'))
  const web = encoder(ffmpeg, join(ROOT, 'public/video/mebley-demo.webm'), '1280:720')
  const frames = Math.round(duration * FPS)
  for (let f = 0; f < frames; f++) {
    await page.evaluate(v => window.__seek(v), f / FPS)
    const jpg = await page.screenshot({ type: 'jpeg', quality: 92 })
    await Promise.all([write(hd.stdin, jpg), write(web.stdin, jpg)])
    if (f % 150 === 0) console.log(`frame ${f}/${frames}`)
  }
  hd.stdin.end(); web.stdin.end()
  await Promise.all([hd.done, web.done])

  await page.evaluate(v => window.__seek(v), 8)
  await page.screenshot({ path: join(ROOT, 'public/video/mebley-demo-poster.jpg'), type: 'jpeg', quality: 85 })
  await ctx.close()
  for (const f of ['marketing-assets/video/mebley-demo-1080p.webm', 'public/video/mebley-demo.webm', 'public/video/mebley-demo-poster.jpg']) {
    console.log(f, Math.round(statSync(join(ROOT, f)).size / 1024), 'KB')
  }
}

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {})
try {
  if (what === 'all' || what === 'shots') await renderShots(browser)
  if (what === 'all' || what === 'video') await renderVideo(browser)
} finally {
  await browser.close()
}
