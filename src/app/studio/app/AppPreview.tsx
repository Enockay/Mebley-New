'use client'
/** Renders the signed-in app screens with sample data (dev only). */
import { useState } from 'react'
import AppFrame from '@/components/App/AppFrame'
import DiscoverView from '@/components/App/DiscoverView'
import { FRAME, PEOPLE } from './fixtures'
import MatchesPage from '@/app/matches/page'
import ProfilePage from '@/app/profile/page'
import LikesPage from '@/app/likes/page'

export default function AppPreview({ screen }: { screen: string }) {
  const [selected, setSelected] = useState(PEOPLE[0].id)
  const [full, setFull] = useState<string | null>(screen === 'profile' ? PEOPLE[0].id : null)
  const noop = () => {}

  if (screen === 'discover' || screen === 'profile') {
    return (
      <AppFrame preview={FRAME} previewPath="/browse">
        <DiscoverView
          people={PEOPLE}
          selectedId={selected}
          subtitle="12 people match your filters near Nairobi"
          mode="cards"
          onMode={noop}
          chips={{ age: false, ageLabel: '18–30', near: false, nearKm: 25, serious: true, verified: false, online: false, filterCount: 0 }}
          onToggleChip={noop}
          onOpenFilters={noop}
          busy={false}
          loading={false}
          error={null}
          onRetry={noop}
          hasMore={false}
          loadingMore={false}
          onLoadMore={noop}
          fullProfileId={full}
          onOpenFullProfile={p => setFull(p?.id ?? null)}
          onLike={noop}
          onPass={noop}
          onStitch={noop}
          onMessage={noop}
          onReport={noop}
          onSelect={p => setSelected(p.id)}
        />
      </AppFrame>
    )
  }
  // Real pages; the screenshot script stubs /api/auth/me and the data APIs.
  if (screen === 'chats' || screen === 'chat') {
    return <AppFrame previewPath="/matches" bareMobile={screen === 'chat'}><MatchesPage /></AppFrame>
  }
  if (screen === 'me') return <AppFrame previewPath="/profile"><ProfilePage /></AppFrame>
  if (screen === 'likes') return <AppFrame previewPath="/likes"><LikesPage /></AppFrame>
  return <p style={{ padding: 40 }}>Unknown screen: {screen}</p>
}
