import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Mebley\'s Privacy Policy — how we collect, use, and protect your personal data. Your privacy is central to how we operate.',
  alternates: { canonical: 'https://mebley.com/privacy' },
  robots: { index: true, follow: false },
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8 md:p-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
            <span className="text-white text-lg">♥</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Mebley</h1>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h2>
        <p className="text-sm text-gray-500 mb-8">Last updated: March 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">1. Who We Are</h3>
            <p>Mebley is a global dating app designed to help people make meaningful connections. We are committed to protecting your privacy and handling your personal data responsibly and transparently.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">2. Data We Collect</h3>
            <p>We collect the following categories of data when you use Mebley:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li><strong>Account data:</strong> Email address, phone number, and password (encrypted)</li>
              <li><strong>Profile data:</strong> Name, age range, gender, location, nationality, bio, interests, relationship intent, and photos/videos you upload</li>
              <li><strong>Usage data:</strong> Profiles you view, like, or pass; matches; messages sent</li>
              <li><strong>Device data:</strong> IP address, browser type, device identifiers</li>
              <li><strong>Location data:</strong> General location (city/country) that you provide — we do not track your GPS continuously</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">3. Why We Collect Your Data</h3>
            <p>We use your data to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li>Create and manage your account</li>
              <li>Match you with compatible people based on your preferences</li>
              <li>Enable messaging and connections between users</li>
              <li>Improve the App and develop new features</li>
              <li>Detect and prevent fraud, abuse, and safety violations</li>
              <li>Send you important account and security notifications</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">4. How We Store Your Data</h3>
            <p>Your data is stored securely using industry-standard encryption at rest and in transit. Profile data is stored in Supabase (PostgreSQL), messages in MongoDB Atlas, and media files (photos/videos) in Amazon Web Services (AWS S3) with CloudFront CDN delivery. All providers are GDPR-compliant.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">5. Who We Share Your Data With</h3>
            <p>We do not sell your personal data. We only share data with:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li><strong>Other users:</strong> Your public profile (name, photos, bio, interests) is visible to matched or discovering users</li>
              <li><strong>Service providers:</strong> Supabase, MongoDB, AWS, Twilio (SMS verification) — only as needed to operate the App</li>
              <li><strong>Legal authorities:</strong> If required by law, court order, or to protect the safety of users</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">6. Your Rights</h3>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1.5">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Withdraw consent for data processing</li>
              <li>Object to or restrict certain types of processing</li>
              <li>Data portability (receive your data in a structured format)</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, contact us at <a href="mailto:crotchet.support@gmail.com" className="text-pink-500 hover:underline">crotchet.support@gmail.com</a>. We will respond within 30 days.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">7. Data Retention</h3>
            <p>We retain your data for as long as your account is active. If you delete your account, we delete your personal data within 30 days, except where we are required to retain it by law. Messages may be retained for up to 90 days for safety and abuse prevention purposes.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">8. Sensitive Data</h3>
            <p>Dating apps inherently involve sensitive personal data including sexual orientation and relationship preferences. You provide this data voluntarily. We treat it with the highest level of care and never share it with advertisers or third parties beyond what is necessary to operate the App.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">9. Children's Privacy</h3>
            <p>Mebley is strictly for users aged 18 and over. We do not knowingly collect data from anyone under 18. If we discover an account belongs to a minor, we will delete it immediately. If you believe a minor has created an account, please contact us.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">10. Cookies & Tracking</h3>
            <p>We use essential cookies to keep you logged in and to secure your session. We do not use advertising or tracking cookies. You can control cookies through your browser settings, but disabling essential cookies may affect App functionality.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">11. International Transfers</h3>
            <p>Mebley is a global app. Your data may be processed in countries outside your own, including the United States and the European Union. We ensure all transfers are protected by appropriate safeguards in accordance with applicable data protection law.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">12. Changes to This Policy</h3>
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or an in-app notification. Continued use of the App after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-3">13. Contact Us</h3>
            <p>For any privacy-related questions or requests, contact our support team at <a href="mailto:crotchet.support@gmail.com" className="text-pink-500 hover:underline">crotchet.support@gmail.com</a></p>
          </section>

        </div>
      </div>
    </div>
  )
}
