/**
 * Safety centre (review T3, 4.7, 4.11). Describes how the product works
 * today; keep in step with the moderation, verification and privacy code.
 */
import type { Metadata } from 'next'
import MarketingShell from '@/components/Marketing/MarketingShell'
import Icon, { type IconName } from '@/components/Marketing/Icon'
import { PRODUCT_FACTS } from '@/lib/site-facts'

export const metadata: Metadata = {
  title: 'Safety Centre: Verification, Reporting and Your Voice Data',
  description:
    'How Mebley keeps members safe: selfie verification, block and report, moderation, how voice notes and photos are stored and deleted, meeting safely and community guidelines.',
  alternates: { canonical: '/safety' },
  openGraph: { title: 'Mebley Safety Centre', url: '/safety', images: ['/opengraph-image'] },
}

const SECTIONS: { id: string; icon: IconName; title: string }[] = [
  { id: 'verification', icon: 'verified', title: 'Verification' },
  { id: 'reporting', icon: 'flag', title: 'Reporting and blocking' },
  { id: 'voice-data', icon: 'lock', title: 'Your voice data and privacy' },
  { id: 'meeting', icon: 'checkin', title: 'Meeting safely' },
  { id: 'guidelines', icon: 'users', title: 'Community guidelines' },
  { id: 'regional', icon: 'globe', title: 'Safety by region' },
]

const EMERGENCY = [
  ['Kenya', '999 or 112'],
  ['Nigeria', '112'],
  ['South Africa', '10111 (police), 112 from mobiles'],
  ['India', '112'],
  ['United Arab Emirates', '999'],
  ['United Kingdom', '999 or 112'],
  ['European Union', '112'],
  ['United States', '911'],
  ['Brazil', '190 (police)'],
  ['Indonesia', '112'],
]

function Heading({ id, icon, title }: { id: string; icon: IconName; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <span className="mk-icon-disc"><Icon name={icon} /></span>
      <h2 id={`${id}-title`} className="mk-h2">{title}</h2>
    </div>
  )
}

export default function SafetyPage() {
  return (
    <MarketingShell>
      <section className="mk-page-hero">
        <div className="mk-container">
          <p className="mk-label" style={{ margin: 0 }}>Safety centre</p>
          <h1 className="mk-hero-title" style={{ maxWidth: 860 }}>Meeting someone new should feel safe.</h1>
          <p className="mk-lead" style={{ margin: 0 }}>
            How Mebley verifies members, how to report and block, what happens to your voice note and photos, and how to meet safely wherever you are.
          </p>
          <nav aria-label="On this page" className="mk-toc" style={{ marginBlockStart: 8 }}>
            {SECTIONS.map(s => <a key={s.id} href={`#${s.id}`}>{s.title}</a>)}
          </nav>
        </div>
      </section>

      <div className="mk-container" style={{ marginBlockStart: 32 }}>
        <div className="mk-callout" role="note">
          <Icon name="info" />
          <p><strong>In immediate danger?</strong> Contact local emergency services first. Numbers for our main markets are listed under <a href="#regional" style={{ color: 'var(--coral-200)' }}>Safety by region</a>.</p>
        </div>
      </div>

      <section id="verification" className="mk-section mk-anchor" aria-labelledby="verification-title">
        <div className="mk-container mk-prose">
          <Heading {...SECTIONS[0]} />
          <p>Every member confirms they are {PRODUCT_FACTS.minimumAge} or older when they set up a profile. Anyone who says they are under {PRODUCT_FACTS.minimumAge} cannot continue, and accounts found to belong to a minor are removed.</p>
          <p><strong>Selfie verification.</strong> You take a live selfie in the app. It is compared automatically with the main photo on your profile. When they match, your profile shows a verified badge. Our team reviews cases the automatic check cannot decide.</p>
          <p>A badge tells you the person in the photos is the person using the account. It does not tell you everything about them, so keep using your judgement.</p>
        </div>
      </section>

      <section id="reporting" className="mk-section mk-section--alt mk-anchor" aria-labelledby="reporting-title">
        <div className="mk-container mk-prose">
          <Heading {...SECTIONS[1]} />
          <p><strong>Block</strong> someone from their profile or from your chat with them. They disappear from your Discover feed and they are not notified. You can block and report in one step.</p>
          <p><strong>Report</strong> a profile or conversation for fake photos, harassment, scams, requests for money, hate, underage users or anything that makes you uncomfortable. Reports are confidential and reviewed by our moderation team, who can warn, restrict or remove accounts.</p>
          <p>Never send money, gift cards or crypto to someone you have not met. Report anyone who asks.</p>
        </div>
      </section>

      <section id="voice-data" className="mk-section mk-anchor" aria-labelledby="voice-data-title">
        <div className="mk-container mk-prose">
          <Heading {...SECTIONS[2]} />
          <p>Your voice note, photos and verification selfie are personal data. In many countries, including under the GDPR, the UK and Kenyan data protection acts, India&rsquo;s DPDP Act and Brazil&rsquo;s LGPD, they receive extra protection.</p>
          <ul>
            <li><strong>Who hears your voice note.</strong> It plays on your profile inside Mebley, which only signed-in members can browse.</li>
            <li><strong>Your control.</strong> Re-record or delete your voice note and photos at any time from your profile.</li>
            <li><strong>Deletion.</strong> If you delete your account, your personal data, including recordings, photos and selfies, is deleted within {PRODUCT_FACTS.dataDeletionDays} days, unless the law requires us to keep it.</li>
            <li><strong>Messages.</strong> May be kept for up to {PRODUCT_FACTS.messageRetentionDays} days after deletion to investigate abuse reports.</li>
          </ul>
          <p>Full details are in our <a href="/privacy">privacy policy</a>.</p>
        </div>
      </section>

      <section id="meeting" className="mk-section mk-section--alt mk-anchor" aria-labelledby="meeting-title">
        <div className="mk-container mk-prose">
          <Heading {...SECTIONS[3]} />
          <ol>
            <li><strong>Talk first.</strong> Use voice messages or a video call in Mebley before meeting. It is the easiest way to confirm someone is who they say.</li>
            <li><strong>Meet in public.</strong> Choose a busy caf&eacute;, restaurant or venue for the first few dates. Never meet at a home.</li>
            <li><strong>Tell a friend.</strong> Share who you are meeting, where and when, and check in with them during and after.</li>
            <li><strong>Arrange your own transport.</strong> Keep control of how you arrive and leave, and keep your phone charged.</li>
            <li><strong>Keep personal details private</strong> until you trust someone: home address, workplace, finances.</li>
            <li><strong>Leave whenever you want.</strong> You owe no one an explanation. Report anyone who pressures you.</li>
          </ol>
        </div>
      </section>

      <section id="guidelines" className="mk-section mk-anchor" aria-labelledby="guidelines-title">
        <div className="mk-container mk-prose">
          <Heading {...SECTIONS[4]} />
          <p>Mebley is for people looking for genuine connection. To keep it that way, members agree to:</p>
          <ul>
            <li>Be themselves: real photos, real age, one account.</li>
            <li>Be respectful: no harassment, threats, hate or discrimination based on race, ethnicity, nationality, religion, gender, sexual orientation, disability or age.</li>
            <li>Respect consent: no unsolicited sexual content, and no sharing someone else&rsquo;s photos or messages.</li>
            <li>Keep it honest: no scams, requests for money, spam or commercial promotion.</li>
            <li>Keep it adult: members must be {PRODUCT_FACTS.minimumAge} or older.</li>
          </ul>
          <p>Breaking these rules can lead to a warning, restricted features or a permanent ban. The full rules are in our <a href="/terms">terms of service</a>.</p>
        </div>
      </section>

      <section id="regional" className="mk-section mk-section--alt mk-anchor" aria-labelledby="regional-title">
        <div className="mk-container mk-prose">
          <Heading {...SECTIONS[5]} />
          <p>Laws and norms differ between countries. In some places same-sex relationships are criminalised, and people have been targeted through dating apps. If that applies where you live: avoid showing your face in your first photo, do not share identifying details early, verify people by video before meeting, and meet only in places you trust.</p>
          <div className="mk-table-wrap" style={{ marginBlockStart: 8 }}>
            <table className="mk-table" style={{ minWidth: 0 }}>
              <caption className="mk-sr">Emergency numbers</caption>
              <thead><tr><th scope="col">Country or region</th><th scope="col">Emergency number</th></tr></thead>
              <tbody>
                {EMERGENCY.map(([c, n]) => <tr key={c}><th scope="row">{c}</th><td>{n}</td></tr>)}
              </tbody>
            </table>
          </div>
          <p className="mk-small">Numbers were checked in November 2026. If you are travelling, confirm the local number when you arrive.</p>
        </div>
      </section>
    </MarketingShell>
  )
}
