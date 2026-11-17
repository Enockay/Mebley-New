/**
 * Public site footer (review T4, S1, 4.5): current year, legal entity,
 * registered address once supplied, 18+ statement, how to use Mebley
 * (browser, no download) and social links that match the structured data.
 */
import { Facebook, Instagram, X as XIcon } from 'lucide-react'
import { PRODUCT_FACTS, SITE_FACTS } from '@/lib/site-facts'
import Logo from './Logo'

const COLS = [
  { head: 'Product', links: [['/#features', 'Features'], ['/#how', 'How it works'], ['/pricing', 'Pricing'], ['/faq', 'FAQ']] },
  { head: 'Safety', links: [['/safety', 'Safety centre'], ['/safety#verification', 'Verification'], ['/safety#guidelines', 'Community guidelines'], ['/safety#voice-data', 'Your voice data']] },
  { head: 'Company', links: [['/about', 'About'], ['/#stories', 'Stories'], ['/blog', 'Blog'], ['/contact', 'Contact']] },
  { head: 'Legal', links: [['/privacy', 'Privacy policy'], ['/terms', 'Terms of service']] },
] as const

const SOCIAL_ICONS = { Facebook, X: XIcon, Instagram } as const

export default function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="mk-footer">
      <div className="mk-container">
        <div className="mk-footer__top">
          <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
            <Logo />
            <p className="mk-small" style={{ margin: 0, maxWidth: 300 }}>
              Voice first dating for people who want something real.
            </p>
            <p className="mk-small" style={{ margin: 0, maxWidth: 300 }}>
              Mebley runs in your browser on any phone or computer. No download needed.
            </p>
          </div>
          <div className="mk-footer__cols">
            {COLS.map(col => (
              <nav key={col.head} aria-label={col.head}>
                <h2>{col.head}</h2>
                <ul>
                  {col.links.map(([href, label]) => (
                    <li key={href}><a href={href}>{label}</a></li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
        <div className="mk-footer__bottom">
          <p className="mk-footer__legal">
            © {year} {[SITE_FACTS.legalName, SITE_FACTS.registeredAddress].filter(Boolean).join(', ').replace(/\.?$/, '.')}{' '}
            Mebley is for adults aged {PRODUCT_FACTS.minimumAge} and over. Language: English (US).
          </p>
          <div className="mk-social">
            {SITE_FACTS.social.map(({ label, href }) => {
              const I = SOCIAL_ICONS[label as keyof typeof SOCIAL_ICONS]
              return (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`Mebley on ${label}`}>
                  <I size={18} strokeWidth={1.75} aria-hidden="true" />
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </footer>
  )
}
