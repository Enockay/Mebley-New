/**
 * FAQ content. Used by the home page (first six), /faq, and the FAQPage
 * structured data, so search engines see exactly what visitors see.
 * Answers must stay factual; they describe how the product works today.
 */
export type Faq = { q: string; a: string[]; link?: { href: string; label: string } }

export const FAQS: Faq[] = [
  {
    q: 'What is Mebley?',
    a: [
      'Mebley is a voice first dating service. Every profile can carry a 30 second voice note, so you hear someone before you match. Instead of a plain like you can send a Stitch, a like with a personal note, and your feed is ordered by shared values and intentions.',
    ],
  },
  {
    q: 'Is Mebley free?',
    a: [
      'Yes. Creating a profile, recording a voice note, getting verified, liking, matching and messaging your matches are free.',
      'Paid plans start at $5 a month and add monthly credits, see who liked you, unlimited likes and more. Credits pay for Stitches that become matches, Spotlight and Boosts.',
    ],
    link: { href: '/pricing', label: 'See all prices' },
  },
  {
    q: 'What is a Stitch?',
    a: [
      'A Stitch is a like with a note attached. It tells someone why you noticed them before you ever say hello. If the Stitch turns into a mutual match, 10 credits are used from each person.',
    ],
  },
  {
    q: 'Who can join, and how do you check?',
    a: [
      'Mebley is for adults aged 18 and over. You confirm your age range when you set up your profile and anyone under 18 cannot continue. You can also verify your profile with a selfie that is compared against your main photo. Verified profiles carry a badge. Accounts found to belong to anyone under 18 are removed.',
    ],
    link: { href: '/safety#verification', label: 'How verification works' },
  },
  {
    q: 'How does Mebley decide who I see first?',
    a: [
      'Your feed is ordered by your Intent Score: shared values, relationship intentions, interests and how people actually behave on Mebley. Members who use a paid Spotlight are visibly marked with a glowing ring, so you can always tell.',
    ],
  },
  {
    q: 'What happens to my voice note and photos?',
    a: [
      'Your voice note and photos appear on your profile inside Mebley, which only signed-in members can browse. You can re-record or remove them at any time from your profile. If you delete your account, your personal data, including recordings and photos, is deleted within 30 days unless the law requires us to keep it.',
    ],
    link: { href: '/safety#voice-data', label: 'Your voice data' },
  },
  {
    q: 'How do I pay?',
    a: [
      'Payments are processed securely by Paystack. You can pay by card or by mobile money, including M-Pesa. Prices are shown in US dollars and billed as the Kenyan shilling (KES) amount shown with each price; your bank converts it if needed.',
    ],
  },
  {
    q: 'How do I cancel a plan?',
    a: [
      'Plans are billed monthly and you can cancel at any time. When a plan ends, your account returns to Free and keeps your profile, matches and conversations.',
    ],
  },
  {
    q: 'Do I need to download an app?',
    a: [
      'No. Mebley runs in the browser on any modern phone, tablet or computer. On a phone you can add it to your home screen so it opens like an app.',
    ],
  },
  {
    q: 'How do I delete my account?',
    a: [
      'Go to your profile, open Settings and choose Delete account. Deletion is permanent and your personal data is removed within 30 days.',
    ],
  },
  {
    q: 'How do I report someone or stay safe?',
    a: [
      'Every profile and every chat has Block and Report. Reports are reviewed by our moderation team. Before meeting, read our guidance on meeting safely, and always meet in a public place.',
    ],
    link: { href: '/safety', label: 'Visit the Safety centre' },
  },
  {
    q: 'Which countries and languages?',
    a: [
      'Mebley is open to members in more than 40 countries, with active communities in cities such as Nairobi, Lagos, Mumbai, Dubai, London and Paris. The site and app are in English today; more languages are planned.',
    ],
  },
]

export function faqJsonLd(items: Faq[] = FAQS) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a.join(' ') },
    })),
  }
}
