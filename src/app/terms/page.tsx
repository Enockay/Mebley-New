import type { Metadata } from 'next'
import { Heart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Mebley\'s Terms of Service — the rules and guidelines for using our dating platform. Read before creating your account.',
  alternates: { canonical: 'https://mebley.com/terms' },
  robots: { index: true, follow: false },
}

export default function TermsPage() {
  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', padding:'48px 16px', fontFamily:"'DM Sans', -apple-system, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');`}</style>

      <div style={{ maxWidth:760, margin:'0 auto', background:'white', borderRadius:24, boxShadow:'0 1px 3px rgba(0,0,0,0.06),0 8px 40px rgba(0,0,0,0.08)', overflow:'hidden' }}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#f43f5e,#e11d48)', padding:'40px 48px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <div style={{ width:44,height:44,background:'rgba(255,255,255,0.2)',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center' }}>
              <span style={{ fontSize:22 }}>♥</span>
            </div>
            <span style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, color:'white' }}>Mebley</span>
          </div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:36, fontWeight:700, color:'white', margin:'0 0 8px', lineHeight:1.2 }}>Terms of Service</h1>
          <p style={{ color:'rgba(255,255,255,0.8)', fontSize:14, margin:0 }}>Last updated: March 2026 · Version 1.0</p>
        </div>

        {/* Content */}
        <div style={{ padding:'48px 48px', lineHeight:1.8, color:'#374151' }}>

          {/* Intro */}
          <div style={{ background:'#fff7f7', border:'1px solid #fecdd3', borderRadius:16, padding:'20px 24px', marginBottom:40 }}>
            <p style={{ margin:0, fontSize:14, color:'#be123c', lineHeight:1.7 }}>
              <strong>Welcome to Mebley.</strong> Please read these Terms of Service carefully before using our platform.
              By creating an account or using Mebley, you agree to be legally bound by these terms.
              If you do not agree, please do not use our services.
            </p>
          </div>

          <Section n="1" title="Who We Are">
            <p>Mebley ("the Platform", "we", "us", or "our") is a global online dating and social connection service that enables adults to create profiles, discover compatible people, and build meaningful relationships. Mebley operates as a technology platform connecting users worldwide.</p>
            <p>For questions or support, contact us at <a href="mailto:crotchet.support@gmail.com" style={{ color:'#f43f5e', textDecoration:'none', fontWeight:600 }}>crotchet.support@gmail.com</a>.</p>
          </Section>

          <Section n="2" title="Eligibility & Age Requirement">
            <p>To use Mebley you must:</p>
            <ul>
              <li>Be at least <strong>18 years of age</strong></li>
              <li>Have the legal capacity to enter into a binding agreement</li>
              <li>Not be prohibited from using the services under applicable laws of your country</li>
              <li>Not be a previously banned Mebley user</li>
            </ul>
            <p>By creating an account, you represent and warrant that all of the above is true. We take the safety of minors extremely seriously. Accounts found to belong to users under 18 will be permanently terminated without notice, and we reserve the right to report such activity to relevant authorities.</p>
          </Section>

          <Section n="3" title="Your Account">
            <p>When you create a Mebley account, you agree to:</p>
            <ul>
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and update your information to keep it accurate and complete</li>
              <li>Keep your password confidential and not share it with anyone</li>
              <li>Notify us immediately at <a href="mailto:crotchet.support@gmail.com" style={{ color:'#f43f5e', textDecoration:'none' }}>crotchet.support@gmail.com</a> if you suspect unauthorised access</li>
              <li>Be responsible for all activity that occurs under your account</li>
            </ul>
            <p>You may not create more than one account. Duplicate accounts may be permanently terminated.</p>
          </Section>

          <Section n="4" title="Acceptable Use">
            <p>Mebley is designed to help people make genuine connections. You agree not to use Mebley to:</p>
            <ul>
              <li>Harass, abuse, stalk, threaten, bully, or intimidate any user</li>
              <li>Post false, misleading, defamatory, or fraudulent information</li>
              <li>Impersonate any person or entity, or misrepresent your identity or affiliation</li>
              <li>Upload or share explicit, pornographic, or sexually exploitative content</li>
              <li>Solicit money, financial information, or gifts from other users</li>
              <li>Promote, facilitate, or engage in sex work, trafficking, or exploitation of any kind</li>
              <li>Engage in discriminatory behaviour based on race, ethnicity, nationality, religion, gender, sexual orientation, disability, or age</li>
              <li>Use automated bots, scrapers, or scripts to interact with the platform</li>
              <li>Reverse engineer, decompile, or attempt to extract source code</li>
              <li>Distribute spam, phishing links, malware, or unsolicited commercial messages</li>
              <li>Collect or harvest personal data of other users without their consent</li>
              <li>Violate any applicable local, national, or international law or regulation</li>
              <li>Engage in or facilitate any form of fraud or scamming</li>
            </ul>
            <p>Violations of these rules may result in immediate account termination and, where required by law, reporting to relevant authorities.</p>
          </Section>

          <Section n="5" title="Content You Post">
            <p>You retain full ownership of all content you post on Mebley, including photos, videos, messages, and profile information ("User Content"). By posting User Content, you grant Mebley a limited, non-exclusive, worldwide, royalty-free licence to:</p>
            <ul>
              <li>Display your content to other users as part of normal platform operation</li>
              <li>Store your content on our secure servers and CDN infrastructure</li>
              <li>Process your content for safety and moderation purposes</li>
            </ul>
            <p>This licence ends when you delete your content or your account. We do not sell your content or use it for advertising purposes.</p>
            <p>You are solely responsible for the content you post. By posting, you confirm that:</p>
            <ul>
              <li>You own the content or have the right to share it</li>
              <li>The content does not infringe any third-party intellectual property rights</li>
              <li>The content complies with these Terms and all applicable laws</li>
            </ul>
          </Section>

          <Section n="6" title="Matching, Discovery & Algorithm">
            <p>Mebley uses a proprietary algorithmic matching system that considers profile completeness, stated preferences, location, shared interests, relationship intent, and platform activity to suggest compatible users.</p>
            <p>We do not guarantee:</p>
            <ul>
              <li>That you will find a match or romantic partner</li>
              <li>The accuracy, completeness, or suitability of any match suggestion</li>
              <li>The conduct or intentions of any user you encounter on the platform</li>
            </ul>
            <p>Mebley is a platform for meeting people. We are not responsible for what happens between users on or off the platform. Always exercise personal safety and good judgment when meeting people online or in person.</p>
          </Section>

          <Section n="7" title="Safety & Reporting">
            <p>Your safety is our priority. Mebley provides tools to report, block, and flag users. We review all reports and take appropriate action, which may include warnings, temporary suspension, or permanent termination.</p>
            <p>If you experience harassment, threats, or illegal conduct from another user, please report it in-app and, where necessary, to your local law enforcement. In cases involving immediate danger, always contact emergency services first.</p>
            <p>Mebley cooperates fully with law enforcement investigations as required by applicable law.</p>
          </Section>

          <Section n="8" title="Premium Features & Monetisation">
            <p>Mebley may offer paid features including but not limited to profile boosts, virtual gifts, and premium subscriptions ("Premium Features"). By purchasing Premium Features, you agree that:</p>
            <ul>
              <li>All purchases are final unless required by applicable consumer protection law</li>
              <li>Virtual items and credits have no monetary value and cannot be transferred or exchanged for real currency</li>
              <li>Subscription plans auto-renew unless cancelled before the renewal date</li>
              <li>Prices may vary by region and are subject to local taxes</li>
            </ul>
            <p>We reserve the right to modify, suspend, or discontinue any Premium Features at any time with reasonable notice.</p>
          </Section>

          <Section n="9" title="Privacy & Data Protection">
            <p>Your privacy matters deeply to us. Our collection, use, and protection of your personal data is described in detail in our <a href="/privacy" style={{ color:'#f43f5e', textDecoration:'none', fontWeight:600 }}>Privacy Policy</a>, which forms part of these Terms.</p>
            <p>Key commitments:</p>
            <ul>
              <li>We use industry-standard encryption to protect your data</li>
              <li>We never sell your personal data to third parties</li>
              <li>We process your data only as described in our Privacy Policy</li>
              <li>You have the right to access, correct, and delete your data at any time</li>
            </ul>
            <p>For GDPR, CCPA, or other data subject requests, contact us at <a href="mailto:crotchet.support@gmail.com" style={{ color:'#f43f5e', textDecoration:'none' }}>crotchet.support@gmail.com</a>.</p>
          </Section>

          <Section n="10" title="Intellectual Property">
            <p>All content, design, code, trademarks, and branding of Mebley are owned by or licensed to us and are protected by applicable intellectual property laws. You may not copy, reproduce, modify, or distribute any part of the platform without our prior written consent.</p>
          </Section>

          <Section n="11" title="Account Suspension & Termination">
            <p>We may suspend or permanently terminate your account without prior notice if:</p>
            <ul>
              <li>You violate these Terms of Service</li>
              <li>We determine your conduct is harmful to other users or the platform</li>
              <li>We are required to do so by law or legal process</li>
              <li>Your account has been inactive for an extended period</li>
            </ul>
            <p>You may delete your account at any time from your profile settings. Upon deletion, your profile will be removed from discovery and your personal data will be handled in accordance with our Privacy Policy and applicable data retention obligations.</p>
          </Section>

          <Section n="12" title="Disclaimer of Warranties">
            <p>Mebley is provided "as is" and "as available" without warranties of any kind, express or implied. To the fullest extent permitted by applicable law, we disclaim all warranties including but not limited to:</p>
            <ul>
              <li>Merchantability and fitness for a particular purpose</li>
              <li>Uninterrupted, error-free, or secure operation of the platform</li>
              <li>Accuracy or reliability of any content on the platform</li>
            </ul>
          </Section>

          <Section n="13" title="Limitation of Liability">
            <p>To the maximum extent permitted by applicable law, Mebley and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform, including but not limited to:</p>
            <ul>
              <li>Personal injury or property damage</li>
              <li>Emotional distress or loss of enjoyment</li>
              <li>Loss of data, profits, or revenue</li>
              <li>Conduct of third parties, including other users</li>
            </ul>
            <p>Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability, so some of the above may not apply to you. In such cases, our liability is limited to the maximum extent permitted by law.</p>
          </Section>

          <Section n="14" title="Governing Law & Dispute Resolution">
            <p>These Terms are governed by applicable law. We encourage you to contact us first to resolve any dispute informally at <a href="mailto:crotchet.support@gmail.com" style={{ color:'#f43f5e', textDecoration:'none' }}>crotchet.support@gmail.com</a>. We will make every reasonable effort to resolve disputes within 30 days.</p>
            <p>For disputes that cannot be resolved informally, both parties agree to attempt mediation before pursuing formal legal action.</p>
            <p>Nothing in these Terms limits your rights as a consumer under applicable local law.</p>
          </Section>

          <Section n="15" title="Changes to These Terms">
            <p>We may update these Terms from time to time. When we make significant changes, we will:</p>
            <ul>
              <li>Update the "Last updated" date at the top of this page</li>
              <li>Notify you via email or in-app notification</li>
              <li>Give you a reasonable period to review changes before they take effect</li>
            </ul>
            <p>Continued use of Mebley after changes take effect constitutes your acceptance of the updated Terms.</p>
          </Section>

          <Section n="16" title="Contact Us">
            <p>If you have any questions about these Terms of Service, please contact our support team:</p>
            <div style={{ background:'#fff7f7', border:'1px solid #fecdd3', borderRadius:14, padding:'18px 22px', marginTop:12 }}>
              <p style={{ margin:'0 0 4px', fontWeight:600, color:'#be123c' }}>Mebley Support</p>
              <p style={{ margin:0, fontSize:14, color:'#374151' }}>
                <a href="mailto:crotchet.support@gmail.com" style={{ color:'#f43f5e', textDecoration:'none', fontWeight:600 }}>crotchet.support@gmail.com</a>
              </p>
            </div>
          </Section>

        </div>

        {/* Footer */}
        <div style={{ background:'#fafafa', borderTop:'1px solid #f1f5f9', padding:'24px 48px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <p style={{ fontSize:12, color:'#94a3b8', margin:0 }}>© 2026 Mebley. All rights reserved.</p>
          <div style={{ display:'flex', gap:20 }}>
            <a href="/privacy" style={{ fontSize:12, color:'#f43f5e', textDecoration:'none', fontWeight:600 }}>Privacy Policy</a>
            <a href="/auth" style={{ fontSize:12, color:'#94a3b8', textDecoration:'none' }}>Back to App</a>
          </div>
        </div>

      </div>
    </div>
  )
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom:36 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
        <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,#f43f5e,#e11d48)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <span style={{ fontSize:11, fontWeight:700, color:'white' }}>{n}</span>
        </div>
        <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:600, color:'#0f172a', margin:0 }}>{title}</h3>
      </div>
      <div style={{ paddingLeft:40 }}>
        <style>{`
          .terms-content p { margin: 0 0 14px; font-size: 14px; color: #374151; line-height: 1.8; }
          .terms-content ul { margin: 0 0 14px; padding-left: 20px; }
          .terms-content li { font-size: 14px; color: #374151; line-height: 1.8; margin-bottom: 4px; }
          .terms-content strong { color: #0f172a; }
        `}</style>
        <div className="terms-content">{children}</div>
      </div>
    </div>
  )
}
