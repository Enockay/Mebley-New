import { redirect } from 'next/navigation'

/** Discover lives at /browse since the 2026 redesign. */
export default function DiscoverPage() {
  redirect('/browse')
}
