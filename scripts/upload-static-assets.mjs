import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname, relative, sep } from 'path'
import { config } from 'dotenv'

config({ path: new URL('../.env', import.meta.url).pathname })

const MIME = {
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif':  'image/gif',
  '.webm': 'video/webm',
  '.mp4':  'video/mp4',
}

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const publicDir = new URL('../public', import.meta.url).pathname
const bucket    = process.env.AWS_S3_BUCKET

// Recurse so responsive renditions in public/img/ are uploaded too.
function walk(dir) {
  return readdirSync(dir).flatMap(f => {
    const full = join(dir, f)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}
const files = walk(publicDir)
  .filter(f => MIME[extname(f).toLowerCase()])
  .map(f => relative(publicDir, f).split(sep).join('/'))

console.log(`Uploading ${files.length} files to s3://${bucket}/static/\n`)

for (const file of files) {
  const ext         = extname(file).toLowerCase()
  const contentType = MIME[ext]
  const body        = readFileSync(join(publicDir, file))
  const key         = `static/${file}`

  try {
    await s3.send(new PutObjectCommand({
      Bucket:       bucket,
      Key:          key,
      Body:         body,
      ContentType:  contentType,
      CacheControl: 'public,max-age=31536000,immutable',
    }))
    console.log(`  ✓ ${key}`)
  } catch (err) {
    console.error(`  ✗ ${key}: ${err.message}`)
  }
}

console.log('\nDone.')
