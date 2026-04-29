import { NextRequest, NextResponse } from 'next/server'

const GIPHY_BASE = 'https://api.giphy.com/v1/gifs'
const TENOR_BASE = 'https://tenor.googleapis.com/v2'
const LIMIT      = 16

type GifItem = { id: string; url: string; title: string; provider: 'giphy' | 'tenor' }

function mapGiphy(data: any[]): GifItem[] {
  return (data ?? []).map(item => ({
    id:       item.id,
    url:      item.images?.fixed_height_small?.url || item.images?.downsized_small?.url || item.images?.original?.url || '',
    title:    item.title ?? '',
    provider: 'giphy',
  }))
}

function mapTenor(data: any[]): GifItem[] {
  return (data ?? []).map(item => {
    const mf  = item.media_formats ?? {}
    const url = mf.tinygif?.url || mf.gif?.url || mf.mediumgif?.url || mf.nanogif?.url || mf.mp4?.url || ''
    return { id: item.id, url, title: item.content_description ?? '', provider: 'tenor' }
  })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q        = searchParams.get('q')?.trim() ?? ''
  const trending = !q

  const giphyKey = process.env.GIPHY_API_KEY || process.env.NEXT_PUBLIC_GIPHY_API_KEY
  const tenorKey = process.env.TENOR_API_KEY  || process.env.NEXT_PUBLIC_TENOR_API_KEY || 'LIVDSRZULELA'

  // ── Try Giphy first ──────────────────────────────────────────
  if (giphyKey) {
    try {
      const url  = trending
        ? `${GIPHY_BASE}/trending?api_key=${giphyKey}&limit=${LIMIT}&rating=g`
        : `${GIPHY_BASE}/search?api_key=${giphyKey}&q=${encodeURIComponent(q)}&limit=${LIMIT}&rating=g`
      const res  = await fetch(url, { next: { revalidate: 60 } })
      if (res.ok) {
        const json = await res.json()
        const gifs = mapGiphy(json.data)
        if (gifs.length > 0) return NextResponse.json({ gifs })
      }
    } catch { /* fall through to Tenor */ }
  }

  // ── Tenor fallback ────────────────────────────────────────────
  try {
    const url = trending
      ? `${TENOR_BASE}/featured?key=${tenorKey}&limit=${LIMIT}&media_filter=basic&client_key=mebley`
      : `${TENOR_BASE}/search?key=${tenorKey}&q=${encodeURIComponent(q)}&limit=${LIMIT}&media_filter=basic&client_key=mebley`
    const res  = await fetch(url, { next: { revalidate: 60 } })
    if (res.ok) {
      const json = await res.json()
      return NextResponse.json({ gifs: mapTenor(json.results) })
    }
  } catch { /* ignore */ }

  return NextResponse.json({ gifs: [] })
}
