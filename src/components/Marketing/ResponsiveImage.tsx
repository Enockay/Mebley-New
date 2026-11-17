/**
 * Serves the AVIF/WebP renditions produced by scripts/optimize-images.mjs
 * with width descriptors (review issue F1). Add new images to both files.
 */
import { cdnUrl } from '@/lib/cdn'

export const IMAGES = {
  hero: [480, 960, 1440],
  safety: [480, 960, 1400],
  cta: [480, 960, 1400],
  listening: [480, 960, 1440],
  'profile-amara': [360, 720],
  'story-1': [160, 320],
  'story-2': [160, 320],
  'story-3': [160, 320],
} as const

export type ImageName = keyof typeof IMAGES

type Props = {
  name: ImageName
  alt: string
  sizes: string
  priority?: boolean
  className?: string
  width?: number
  height?: number
}

export default function ResponsiveImage({ name, alt, sizes, priority = false, className, width, height }: Props) {
  const widths = IMAGES[name]
  const set = (ext: string) => widths.map(w => `${cdnUrl(`/img/${name}-${w}.${ext}`)} ${w}w`).join(', ')
  const fallback = cdnUrl(`/img/${name}-${widths[Math.min(1, widths.length - 1)]}.webp`)
  return (
    <picture>
      <source type="image/avif" srcSet={set('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={set('webp')} sizes={sizes} />
      <img
        src={fallback}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
      />
    </picture>
  )
}
