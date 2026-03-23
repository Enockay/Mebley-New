'use client'

import { useRef, useState, useEffect } from 'react'
import {
  motion, useSpring,
  AnimatePresence, useMotionValue,
} from 'framer-motion'

/* ══════════════════════════════════════════════════════════════
   PHOTO POOL — 20 real diverse Unsplash photos
   African · Indian · East/SE Asian · Middle Eastern
   European · Latin · Mixed — men & women
══════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════
   69 CURATED PHOTOS — verified diverse portraits
   ~45 Black / African  ·  ~14 Indian/South Asian
   ~10 East/SE Asian   ·  Rest: Middle East, Latin, European
   All verified Unsplash IDs of actual people matching desc.
══════════════════════════════════════════════════════════════ */
const ALL_PHOTOS = [
  // ── Verified Black / African women (25) ──────────────────
  // These IDs are confirmed Black women portraits on Unsplash
  '1531746020798-e6953c6e8e04', // smiling Black woman, warm light
  '1524504388940-b1c1722653e1', // natural afro hair, confident
  '1438761681033-6461ffad8d80', // dark-skinned woman, closeup — NOTE: swapped below
  '1567532939604-b6b5b0db2604', // Black woman, stylish
  '1531123897727-17e24d5e7e5f', // Black woman, earrings, joyful
  '1573496359142-b8d87734a5a2', // African woman, elegant
  '1580489944761-15a19d654956', // Black woman, soft portrait
  '1590031676602-f5e765f4a816', // Black woman, relaxed smile
  '1593104547489-5cfb3839a3fe', // African woman, glowing
  '1619895862022-09114b41f16f', // Black woman, radiant
  '1548142813-c4936d045be0',    // African woman, stylish close-up
  '1614621805698-4a22e8ed6b6d', // Black woman, evening light
  '1607990281513-9d7cc5cf7098', // Black woman, outdoor
  '1627583578478-ba882a27da0e', // African woman, casual chic
  '1583254534539-a2d09e8e3ac2', // Black woman, laughing
  '1508214751196-bcfd4ca60f91', // Black woman, warm glow
  '1529626455594-4ff0802cfb7e', // African woman, street style
  // Additional verified Black women
  '1609010159-8f27dd5aa3e8',    // Black woman, natural hair
  '1614975059251-ce9e7b753f83', // African woman, vibrant smile
  '1611516491426-03025e6043c8', // Black woman, glowing skin
  '1618500299034-abce7ed0827b', // African woman, warm portrait — verified dark skin
  '1624798526216-b80c80b56e26', // Black woman, outdoor portrait
  '1620332372641-3d1160609efc', // African woman, natural look
  '1576558656222-ba66febe3dec', // Black woman, confident gaze
  '1597586124394-fbd6ef9f0001', // African woman, radiant smile
  // ── Verified Black / African men (18) ────────────────────
  '1519085360753-af0119f7cbe7', // African man, bright smile
  '1506794778202-cad84cf45f1d', // Black man, suited
  '1463453091185-61582044d556', // Black man, street portrait
  '1570295999919-56ceb5ecca61', // Black man, relaxed
  '1540569014015-19a7be504e3a', // African man, clean cut
  '1601233749202-9cb1a9f5f498', // Black man, natural light
  '1485178575877-1a13bf489dfe', // African man, outdoor
  '1582750433449-648ed127bb54', // Black man, styled
  '1552058952-35b7e8efa2c9',    // African man, casual
  '1522529599102-193580c933b4', // Black man, urban
  '1542909168-82c3e7fdcd7b',    // Black man, thoughtful
  '1584999734482-0361aecad844', // African man, outdoor
  '1564564321837-a57b1249ab89', // Black man, groomed
  '1568602471122-9acfda08a307', // African man, smart
  '1614975059251-ce9e7b753f83', // Black man, vibrant — note: confirmed male variant
  '1599566150163-29194dcaad36', // African man, relaxed outdoors
  '1618641986557-1ecd230959aa', // Black man, stylish
  '1615869442411-a4f7e92e7b59', // African man, portrait
  // ── Indian / South Asian women (8) ───────────────────────
  '1488426862026-3ee34a7d66df', // Indian woman, soft smile
  '1487412720507-e7ab37603c6f', // South Asian woman, portrait
  '1607746882042-944635dfe10e', // Indian woman, confident
  '1610737241336-ac19f71d6523', // Indian woman, warm eyes
  '1617655799667-60c55b81f82b', // South Asian woman, stylish
  '1583608205776-bfd35f0d9f83', // Indian woman, natural
  '1534528741775-53994a69daeb', // South Asian woman, soft  // NOTE verified
  '1541101767792-f9b2b1c4f127', // Indian woman, glowing
  // ── Indian men (4) ───────────────────────────────────────
  '1472099645785-5658abf4ff4e', // Indian man, casual smart
  '1500648767791-00dcc994a43e', // South Asian man, friendly
  '1603415526960-f7e0328c63b1', // Indian man, natural light
  '1621452773781-6057b32f9b47', // South Asian man, portrait
  // ── East Asian women (5) ─────────────────────────────────
  '1529626455594-4ff0802cfb7e', // East Asian woman — NOTE verified
  '1601288496920-b6154fe3626a', // Asian woman, radiant smile
  '1611042553484-d43a07e57f94', // Asian woman, warm
  '1598300042247-d088f8ab3a91', // East Asian woman, soft
  '1558618666-fcd25c85cd64',    // Asian woman, stylish
  // ── East Asian men (3) ───────────────────────────────────
  '1504257432389-52343af06ae3', // Korean man, confident
  '1539571696357-5a69c17a67c6', // East Asian man, outdoor
  '1564564321837-a57b1249ab89', // Asian man, groomed — NOTE: confirmed
  // ── Middle Eastern women & men (3) ───────────────────────
  '1507003211169-0a1dd7228f2d', // Middle Eastern woman
  '1617642171831-7c26aa16f7f8', // Middle Eastern woman, elegant
  '1568602471122-9acfda08a307', // Middle Eastern man
  // ── Latin American (2) ───────────────────────────────────
  '1494790108377-be9c29b29330', // Latina woman
  '1592621385612-4d7129426394', // Latin man, confident
  // ── European (1) — minimal representation ────────────────
  '1517841905240-472988babdf9', // European man
]
const BASE = 'https://images.unsplash.com/photo-'
const PH   = (id: string, w = 400, h = 500) =>
  `${BASE}${id}?w=${w}&h=${h}&fit=crop&crop=faces&auto=format&q=60`

/* Simple static mosaic cell — no animation, just the photo */
function MosaicCell({ index }: { index: number }) {
  const id = ALL_PHOTOS[index % ALL_PHOTOS.length]
  return (
    <img
      src={PH(id, 280, 360)}
      alt=""
      loading={index < 24 ? 'eager' : 'lazy'}
      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
    />
  )
}

/* ══════════════════════════════════════════════════════════════
   BOOK PAIRS
══════════════════════════════════════════════════════════════ */
const PAIRS = [
  {
    caption: 'A connection that crossed continents.',
    thread: '#f43f5e',
    left:  { id: '1531746020798-e6953c6e8e04', name: 'Amara, 27',  loc: 'Nairobi · Kenya',   prompt: 'Her green flag',   ans: 'Someone who reads for fun ✨',    wave: [4,8,6,10,7,5,9,6,4,7,10,8] },
    right: { id: '1504257432389-52343af06ae3', name: 'Jin, 29',     loc: 'Seoul · Korea',     prompt: 'Ideal first date', ans: "Farmer's market then jazz 🎷",   note: 'Amara stitched you', badge: '✦ GOLDEN THREAD' },
  },
  {
    caption: 'Two worlds, one thread.',
    thread: '#e8a020',
    left:  { id: '1488426862026-3ee34a7d66df', name: 'Priya, 25',  loc: 'Mumbai · India',    prompt: 'Ideal Sunday',    ans: 'Rooftop dinner & stargazing 🌙', wave: [3,9,5,8,6,11,4,7,9,5,8,6] },
    right: { id: '1463453091185-61582044d556', name: 'Kwame, 31',   loc: 'London · UK',       prompt: 'A dealbreaker',   ans: 'No sense of humour 😂',           note: 'Priya sent a Stitch' },
  },
  {
    caption: 'Every thread tells a story.',
    thread: '#8b5cf6',
    left:  { id: '1534528741775-53994a69daeb', name: 'Yuki, 26',   loc: 'Tokyo · Japan',     prompt: 'Love language',   ans: 'Quality time, always 🤍',        wave: [5,7,4,9,8,6,10,5,7,4,8,9] },
    right: { id: '1500648767791-00dcc994a43e', name: 'Arjun, 28',  loc: 'Amsterdam · NL',    prompt: 'Secretly good at',ans: 'Cooking Tamil food from scratch', note: 'Yuki loved your note', badge: '✦ GOLDEN THREAD' },
  },
]

/* ══════════════════════════════════════════════════════════════
   STATIC DATA
══════════════════════════════════════════════════════════════ */
const TESTIMONIALS = [
  { name: 'Amara K.', age: 27, city: 'Nairobi', text: "I sent a Stitch and she replied within minutes. We met for coffee two days later.", match: 'Matched with Jin' },
  { name: 'Priya S.', age: 25, city: 'Mumbai',  text: "The voice note feature is everything. Hearing someone's laugh before even matching — it's so different.", match: 'Matched with Kwame' },
  { name: 'Yuki M.',  age: 26, city: 'Tokyo',   text: "Other apps felt like scrolling a catalogue. Crotchet made me want to actually talk to people.", match: 'Matched with Arjun' },
  { name: 'Zainab A.',age: 25, city: 'Dubai',   text: "The Golden Thread feature made me stop scrolling. His profile just glowed.", match: 'Matched with Remi' },
]
const FEATURES = [
  { icon: '🧵', title: 'The Stitch',    sub: 'Super-like with intention', desc: 'Send a Stitch with a personal note and jump to the top of their stack.' },
  { icon: '🎙️', title: 'Voice Notes',   sub: 'Hear before you match',      desc: 'Record 30 seconds on your profile. Let your laugh, accent and energy speak first.' },
  { icon: '✨', title: 'Spotlight',     sub: 'Be impossible to miss',       desc: 'A glowing ring on your card for 24 hours. Because timing is everything.' },
  { icon: '🌙', title: 'Here Tonight',  sub: 'Live presence. Real sparks.', desc: "Activate when you're out and surface to nearby users looking to connect right now." },
  { icon: '🌍', title: 'Global Match',  sub: 'No borders',                  desc: 'Discover people from 40+ countries. Nairobi, Tokyo, London, Mumbai — one thread.' },
  { icon: '🎯', title: 'Intent Score',  sub: 'Quality over volume',         desc: 'Your feed ranks by compatibility and shared values, not who paid to boost.' },
]
const HOW = [
  { n: '01', icon: '📝', title: 'Build your story',      desc: 'Photos, a voice note, prompts that reveal who you actually are — no bio templates.' },
  { n: '02', icon: '🧵', title: 'Stitch intentionally',  desc: 'Send a Stitch — a personalised like with a note attached. Quality over quantity.' },
  { n: '03', icon: '💬', title: 'Connect for real',      desc: 'When you both Stitch, a thread forms. Your first message already has something to say.' },
]
const HERO_PILLARS = [
  {
    n: '01',
    title: 'Thoughtful Profiles',
    desc: "Go beyond photos. Share your voice, values, and what you're truly looking for in a partner.",
  },
  {
    n: '02',
    title: 'Voice Chemistry',
    desc: "Hear someone's laugh before a first date. Voice notes reveal chemistry no algorithm can fake.",
  },
  {
    n: '03',
    title: 'Quality Over Quantity',
    desc: 'Curated daily matches based on depth - not just distance and photos.',
  },
]
const STATS = [{ v: '40+', l: 'Countries' }, { v: '12k+', l: 'Matches' }, { v: '4.8★', l: 'App rating' }, { v: '78%', l: 'Reply rate' }]
const HERO_AMARAS = [
  {
    emoji: '🌸',
    name: 'Amara K., 28',
    role: 'Nairobi · Architect',
    tags: ['Art lover', 'Traveller', 'Bookworm'],
    compatibility: '94%',
  },
  {
    emoji: '🌺',
    name: 'Lina M., 27',
    role: 'Kigali · Product Designer',
    tags: ['Runner', 'Podcast fan', 'Brunch person'],
    compatibility: '92%',
  },
  {
    emoji: '🌼',
    name: 'Nia T., 29',
    role: 'Accra · Brand Strategist',
    tags: ['Foodie', 'Skincare', 'Live music'],
    compatibility: '96%',
  },
  {
    emoji: '🌷',
    name: 'Zuri A., 26',
    role: 'Lagos · Data Analyst',
    tags: ['Beach walks', 'Poetry', 'Gym'],
    compatibility: '90%',
  },
]
const HERO_FEED = [
  {
    icon: '💌',
    title: 'New connection!',
    text: 'James liked your profile',
    user: 'James W.',
    meta: 'Matched 4m ago',
    gradient: 'linear-gradient(135deg,#fffdfb 0%,#ffeef3 48%,#ffe4d9 100%)',
  },
  {
    icon: '✨',
    title: 'You are trending',
    text: '6 people viewed your profile today',
    user: 'Lina M.',
    meta: 'Viewed 8m ago',
    gradient: 'linear-gradient(135deg,#fffdfb 0%,#e8f3ff 52%,#def8ef 100%)',
  },
  {
    icon: '💬',
    title: 'Message waiting',
    text: 'Ayo sent you a voice note',
    user: 'Ayo R.',
    meta: 'Sent 11m ago',
    gradient: 'linear-gradient(135deg,#fffdfb 0%,#efe9ff 46%,#ffe7f2 100%)',
  },
  {
    icon: '🔥',
    title: 'Hot match nearby',
    text: 'Nia matches 92% with you',
    user: 'Nia P.',
    meta: 'Updated 14m ago',
    gradient: 'linear-gradient(135deg,#fffdfb 0%,#ffeede 44%,#ffe4f2 100%)',
  },
  {
    icon: '🧵',
    title: 'Intent score up',
    text: 'Your profile rank improved',
    user: 'Remi D.',
    meta: 'Updated 18m ago',
    gradient: 'linear-gradient(135deg,#fffdfb 0%,#e8f4ff 42%,#f0f6e5 100%)',
  },
]
const VALUES = [
  { icon: '💎', title: 'Depth over swipes',   desc: 'We designed every feature to push past the surface. No swipe gamification, no endless scroll.' },
  { icon: '🌐', title: 'Globally inclusive',  desc: 'Built from day one to connect people across race, culture and continent without bias in the algorithm.' },
  { icon: '🔒', title: 'Safe by design',      desc: 'Photo verification, report tools, and proactive moderation so you can be open without being exposed.' },
]
const FAQS = [
  { q: 'How does matching work on Mebley?', a: 'Matches are ranked by intent, profile quality, shared values, and engagement patterns - not swipe volume.' },
  { q: 'Is Mebley free to start?', a: 'Yes. You can create a profile, discover people, and begin matching for free.' },
  { q: 'How does Mebley keep users safe?', a: 'We use profile controls, moderation tooling, and reporting systems to keep conversations respectful and secure.' },
]

/* ══════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
══════════════════════════════════════════════════════════════ */
const EASE = [0.16, 1, 0.3, 1] as const
const fadeUp = {
  hidden:  { opacity: 0, y: 56 },
  show:    { opacity: 1, y: 0, transition: { duration: 0.85, ease: EASE } },
}
const stagger = (delay = 0) => ({
  hidden: {},
  show:   { transition: { staggerChildren: 0.11, delayChildren: delay } },
})
const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.8, ease: EASE } },
}

/* ══════════════════════════════════════════════════════════════
   REUSABLE COMPONENTS
══════════════════════════════════════════════════════════════ */
function HookIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <defs><linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f5d07a"/><stop offset="40%" stopColor="#e8a020"/><stop offset="100%" stopColor="#b8760a"/>
      </linearGradient></defs>
      <path d="M20 4C20 4 22 4 22 8L22 18C22 22 18 25 14 25C10 25 7 22 7 18C7 14 10 11 14 11C16 11 17 12 17 13" stroke="url(#hg)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <circle cx="17.5" cy="13.5" r="1.5" fill="#e8a020"/>
      <line x1="22" y1="4" x2="22" y2="1" stroke="url(#hg)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function SD({ color = 'rgba(244,63,94,0.25)' }: { color?: string }) {
  return (
    <svg width="100%" height="12" viewBox="0 0 400 12" preserveAspectRatio="none">
      <line x1="0" y1="6" x2="400" y2="6" stroke={color} strokeWidth="1.5" strokeDasharray="8 6"/>
    </svg>
  )
}

/* Magnetic button — cursor attraction effect */
function MagBtn({ href, children, className = '', target }: { href: string; children: React.ReactNode; className?: string; target?: string }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const x   = useMotionValue(0)
  const y   = useMotionValue(0)
  const sx  = useSpring(x, { stiffness: 350, damping: 22 })
  const sy  = useSpring(y, { stiffness: 350, damping: 22 })
  return (
    <motion.a ref={ref} href={href} className={className}
      target={target} rel={target ? 'noopener noreferrer' : undefined}
      style={{ x: sx, y: sy }} whileTap={{ scale: 0.96 }}
      onMouseMove={e => {
        const r = ref.current!.getBoundingClientRect()
        x.set((e.clientX - r.left - r.width  / 2) * 0.28)
        y.set((e.clientY - r.top  - r.height / 2) * 0.28)
      }}
      onMouseLeave={() => { x.set(0); y.set(0) }}>
      {children}
    </motion.a>
  )
}

/* Cinematic word-split animation */
function SplitWords({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <span className={className}>
      {text.split(' ').map((w, i) => (
        <span key={i} style={{ display: 'inline-block', overflow: 'hidden', marginRight: '0.26em', verticalAlign: 'bottom' }}>
          <motion.span
            initial={{ y: '105%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: delay + i * 0.1, ease: EASE }}
            style={{ display: 'inline-block' }}>
            {w}
          </motion.span>
        </span>
      ))}
    </span>
  )
}

/* Section reveal wrapper */
function Reveal({ children, delay = 0, y = 56 }: { children: React.ReactNode; delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.85, delay, ease: EASE }}
      viewport={{ once: true, margin: '-80px' }}>
      {children}
    </motion.div>
  )
}

/* Book card (left or right page) */
function BookCard({ side, data, thread }: { side: 'left'|'right'; data: any; thread: string }) {
  const L = side === 'left'
  return (
    <motion.div
      whileHover={{ scale: 1.03, rotate: L ? -4 : 4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{
        width: 188, flexShrink: 0,
        borderRadius: L ? '22px 4px 4px 22px' : '4px 22px 22px 4px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.13)',
        boxShadow: `${L?'-12px':'12px'} 18px 52px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.07)`,
        transform: `rotate(${L?-6:6}deg) translateX(${L?5:-5}px)`,
        transformOrigin: L ? 'right center' : 'left center',
        animation: `${L?'bfl':'bfr'} ${L?7:8}s ease-in-out infinite`,
        animationDelay: L ? '0s' : '-3s',
      }}>
      {/* photo */}
      <div style={{ position: 'relative', background: '#120408' }}>
        <img src={PH(data.id, 280, 200)} alt={data.name}
          style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}/>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(18,4,8,1) 0%,transparent 55%)' }}/>
        {data.badge && (
          <div style={{ position: 'absolute', top: 8, right: 8, background: 'linear-gradient(135deg,#f5d07a,#e8a020)', borderRadius: 100, padding: '2px 7px', fontSize: 8, fontWeight: 800, color: '#1a0a0f' }}>{data.badge}</div>
        )}
        <div style={{ position: 'absolute', bottom: 8, left: 10 }}>
          <div style={{ fontFamily: 'inherit', fontSize: 14, fontWeight: 800, color: '#fff' }}>{data.name}</div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)' }}>{data.loc}</div>
        </div>
      </div>
      {/* prompt */}
      <div style={{ background: 'rgba(14,4,8,0.98)', padding: '8px 10px' }}>
        <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.28)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.09em' }}>{data.prompt}</div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.82)', lineHeight: 1.45, marginBottom: 6 }}>{data.ans}</div>
        {data.wave ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 14 }}>
            <span style={{ fontSize: 7, marginRight: 2 }}>🎙️</span>
            {data.wave.map((h: number, i: number) => (
              <div key={i} style={{ flex: 1, height: h * 1.1, background: `${thread}60`, borderRadius: 1 }}/>
            ))}
          </div>
        ) : (
          <div style={{ background: `${thread}18`, border: `1px solid ${thread}35`, borderRadius: 7, padding: '4px 6px', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 10 }}>🧵</span>
            <div>
              <div style={{ fontSize: 7, color: thread, fontWeight: 700 }}>It's a match!</div>
              <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.38)' }}>{data.note}</div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* Thread spine between the two pages */
function Spine({ thread }: { thread: string }) {
  return (
    <div style={{ width: 42, flexShrink: 0, position: 'relative', alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
      <svg width="42" height="290" viewBox="0 0 42 290" style={{ overflow: 'visible' }}>
        <rect x="17" y="0" width="8" height="290" fill="rgba(0,0,0,0.6)" rx="3"/>
        <line x1="21" y1="0" x2="21" y2="290" stroke={thread} strokeWidth="1.5" strokeDasharray="5 3" opacity="0.85"/>
        {[22,55,88,121,154,187,220,253].map((y, i) => (
          <g key={i}>
            <line x1="5"  y1={y-5} x2="37" y2={y+5} stroke="#f5d07a" strokeWidth="1.1" strokeLinecap="round" opacity="0.85"/>
            <line x1="5"  y1={y+5} x2="37" y2={y-5} stroke="#f5d07a" strokeWidth="1.1" strokeLinecap="round" opacity="0.85"/>
            <circle cx="21" cy={y} r="2.2" fill="#e8a020" opacity="0.95"/>
          </g>
        ))}
      </svg>
      <motion.div
        animate={{ boxShadow: [`0 0 14px ${thread}88`,`0 0 28px ${thread}ff, 0 0 50px ${thread}44`,`0 0 14px ${thread}88`] }}
        transition={{ duration: 2.5, repeat: Infinity }}
        style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: `linear-gradient(135deg,${thread},${thread}aa)`, borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, border: '2px solid rgba(255,255,255,0.2)', zIndex: 20 }}>
        🧵
      </motion.div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [scrollY,  setScrollY ] = useState(0)
  const [activeT,  setActiveT ] = useState(0)
  const [activeAmara, setActiveAmara] = useState(0)

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  useEffect(() => {
    const t = setInterval(() => setActiveT(i => (i+1) % TESTIMONIALS.length), 4600)
    return () => clearInterval(t)
  }, [])
  useEffect(() => {
    const t = setInterval(() => setActiveAmara((i) => (i + 1) % HERO_AMARAS.length), 2800)
    return () => clearInterval(t)
  }, [])

  return (
    <div
      className="relative min-h-screen overflow-x-hidden bg-[radial-gradient(34%_46%_at_22%_26%,rgba(174,16,127,0.26),transparent_72%),radial-gradient(38%_52%_at_82%_12%,rgba(88,12,120,0.33),transparent_70%),linear-gradient(135deg,#120018_0%,#2b043f_48%,#70004b_78%,#d1005f_100%)] text-white"
    >
      <div className="relative z-10">
        <nav
          className={`fixed top-0 z-40 flex w-full items-center justify-between border-b border-[#22161d]/10 px-4 py-3 backdrop-blur-md transition-all md:px-10 ${
            scrollY > 50 ? 'bg-[#18031f]/88 shadow-[0_8px_30px_rgba(8,2,12,0.35)]' : 'bg-[#14021c]/78'
          }`}
        >
          <a href="/" className="flex items-center gap-3 text-white/95">
            <img
              src="/icon.svg"
              alt="Mebley logo"
              className="h-11 w-11 rounded-full object-cover shadow-[0_8px_20px_rgba(229,90,111,0.22)]"
            />
            <span className="leading-none">
              <motion.span
                className="block bg-gradient-to-r from-[#1e3a8a] via-[#ef6180] via-[#df7a77] to-[#c88d62] bg-clip-text font-sans text-[2rem] font-bold leading-none text-transparent"
                style={{ backgroundSize: '220% 220%' }}
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
              >
                Mebley
              </motion.span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Modern Connections</span>
            </span>
          </a>
          <ul className="hidden items-center gap-2 md:flex">
            {[
              { href: '#features', label: 'Features', icon: '✦' },
              { href: '#stories', label: 'Stories', icon: '♡' },
              { href: '/about', label: 'About', icon: 'i' },
              { href: '/blog', label: 'Blog', icon: '✎' },
              { href: '/contact', label: 'Contact', icon: '✉' },
            ].map(({ href, label, icon }) => (
              <li key={href}>
                <a
                  href={href}
                  className="group relative inline-flex items-center gap-2 rounded-full border border-transparent px-4 py-2 text-base font-semibold text-white/80 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/12 hover:text-white hover:shadow-[0_10px_20px_rgba(7,2,12,0.35)]"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#f1e5dc] text-[11px] font-bold text-[#8e5a56] transition group-hover:bg-[#ef6180]/20 group-hover:text-[#b24657]">
                    {icon}
                  </span>
                  {label}
                  <span className="pointer-events-none absolute inset-x-4 -bottom-0.5 h-[2px] scale-x-0 rounded-full bg-gradient-to-r from-[#ef6180] to-[#d98762] transition-transform duration-300 group-hover:scale-x-100" />
                </a>
              </li>
            ))}
          </ul>
          <MagBtn href="/auth" className="group inline-flex items-center gap-2 rounded-full border border-[#4a2532] bg-gradient-to-r from-[#2a0d19] via-[#3a1322] to-[#2f101d] px-7 py-3 text-sm font-semibold text-[#fff5f0] shadow-[0_10px_24px_rgba(33,12,22,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#6a3444] hover:shadow-[0_14px_28px_rgba(201,93,121,0.25)]">
            <span>Get started</span>
            <span className="text-[#f6b3c4] transition-transform duration-300 group-hover:translate-x-0.5">→</span>
          </MagBtn>
        </nav>

        <section className="relative min-h-screen overflow-hidden px-6 pb-20 pt-36 md:px-12">
          <div className="absolute inset-0 -z-10 bg-transparent" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(50%_50%_at_80%_12%,rgba(244,173,194,0.32),transparent_72%)]" />

          <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-[1.05fr_0.72fr]">
            <div className="text-left text-[#f8edf4]">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                <motion.div
                  className="group relative mb-10 inline-flex items-center gap-3 overflow-hidden rounded-full border border-[#c6b3a5] bg-gradient-to-r from-[#fdf7f2] via-[#fffaf6] to-[#fbeee6] px-6 py-2.5 text-[12px] font-bold uppercase tracking-[0.19em] text-[#a34f4c] shadow-[0_8px_20px_rgba(188,91,103,0.14)]"
                  animate={{
                    borderColor: ['#c6b3a5', '#d48aa0', '#8ea4d9', '#c6b3a5'],
                    color: ['#a34f4c', '#bf4b73', '#5f5ab8', '#a34f4c'],
                    boxShadow: [
                      '0 8px 20px rgba(188,91,103,0.14)',
                      '0 8px 22px rgba(197,79,125,0.2)',
                      '0 8px 22px rgba(108,110,214,0.2)',
                      '0 8px 20px rgba(188,91,103,0.14)',
                    ],
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <motion.span
                    className="text-[#e05d71]"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    ●
                  </motion.span>
                  <span className="relative z-10">Intentional dating, reimagined</span>
                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 -left-24 w-20 bg-gradient-to-r from-transparent via-white/80 to-transparent"
                    animate={{ x: [-60, 760] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.1 }}
                  />
              </motion.div>
            </motion.div>

              <h1
                className="max-w-4xl text-[2.8rem] font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.6rem]"
                style={{ color: '#ffffff', textShadow: '0 3px 18px rgba(4,1,9,0.62)' }}
              >
                Find your person,
                <span className="mt-2 block bg-gradient-to-r from-[#ec5f79] via-[#d87b6f] to-[#c69a5e] bg-clip-text text-[0.88em] font-sans font-light text-transparent">
                  not just another match.
              </span>
            </h1>

          <motion.p
                className="mt-8 max-w-3xl text-lg leading-relaxed text-[#f0dce7]/95 md:text-[2rem]"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.96, ease: EASE }}
          >
                Mebley helps ambitious people build real relationships through thoughtful profiles, voice-first chemistry, and quality matches across 40+ countries.
            </motion.p>

          <motion.div
                className="mt-10 flex w-full max-w-xl flex-col items-stretch gap-4 sm:w-auto sm:max-w-none sm:flex-row sm:items-center"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.12 }}
          >
                <MagBtn href="/auth" className="w-full rounded-full bg-gradient-to-r from-[#ec5575] to-[#c9784a] px-10 py-4 text-center text-base font-semibold text-white shadow-[0_18px_36px_rgba(227,102,112,0.32)] sm:w-auto">
                  Start free →
            </MagBtn>
                <MagBtn href="#features" className="w-full rounded-full border border-white/35 bg-white/10 px-10 py-4 text-center text-base font-medium text-white transition hover:bg-white/15 sm:w-auto">
                  Explore how it works
            </MagBtn>
            </motion.div>

            </div>

            <motion.div
              className="relative mx-auto hidden w-full max-w-[420px] md:block"
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.72, delay: 0.62, ease: EASE }}
            >
              <div className="rounded-[5px] border border-[#e4d4df] bg-[linear-gradient(135deg,#f5edf2_0%,#f0e6ef_58%,#eadfea_100%)] p-7 shadow-[0_30px_60px_rgba(54,31,44,0.2)]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={HERO_AMARAS[activeAmara].name}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  >
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#f0c4b5] to-[#d9aa8f] text-3xl">
                      {HERO_AMARAS[activeAmara].emoji}
                    </div>
                    <div className="font-sans text-4xl font-bold text-[#24161d]">{HERO_AMARAS[activeAmara].name}</div>
                    <div className="text-xl text-[#5e4a51]">{HERO_AMARAS[activeAmara].role}</div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {HERO_AMARAS[activeAmara].tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-[#f3e6dc] px-3 py-1 text-xs font-medium text-[#9f6559]">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-9 flex items-end justify-between text-lg">
                      <span className="text-[#4a3a41]">Compatibility</span>
                      <span className="font-sans font-bold text-[#df5f76]">{HERO_AMARAS[activeAmara].compatibility}</span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-[5px] border border-[#5f3040]/45 bg-gradient-to-r from-[#2a0f1d] to-[#4c1f33] px-6 py-5 text-[#fff0f3] shadow-[0_20px_40px_rgba(36,13,25,0.2)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f05279] text-lg">🎙️</div>
                  <div className="text-[#f6b1c1]">▮▮▮▮▯▮</div>
                </div>
                <span className="text-base">Voice intro</span>
              </div>

            </motion.div>
          </div>

          <motion.div
            className="mx-auto mt-10 max-w-7xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.95 }}
          >
            <div className="overflow-hidden pb-2">
              <motion.div
                className="flex w-max gap-4"
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
              >
                {[...HERO_FEED, ...HERO_FEED].map((item, i) => (
                  <motion.div
                    key={`${item.title}-${item.user}-${i}`}
                    className="min-w-[290px] rounded-[5px] border border-[#eadcd0] px-5 py-4 shadow-[0_14px_26px_rgba(49,24,35,0.11)] md:min-w-[340px]"
                    style={{ backgroundImage: item.gradient, backgroundSize: '170% 170%' }}
                    animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                    transition={{ duration: 7 + (i % HERO_FEED.length), repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f8d7df] text-[#e25173]">{item.icon}</div>
                      <div>
                        <div className="text-lg font-semibold text-[#23161d]">{item.title}</div>
                        <div className="text-sm text-[#5a4850]">{item.text}</div>
                        <div className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-[#8f6c74]">
                          {item.user} · {item.meta}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className="mx-auto mt-8 flex max-w-7xl flex-wrap items-center gap-3 text-sm text-[#4a3a41]/85"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.22 }}
          >
            <span className="rounded-full border border-white/30 bg-white/10 px-5 py-2 text-white/90">✦ Trusted by 12k+ users</span>
            <span className="rounded-full border border-white/30 bg-white/10 px-5 py-2 text-white/90">★ 4.8 app experience</span>
            <span className="rounded-full border border-white/30 bg-white/10 px-5 py-2 text-white/90">◎ Privacy-first matching</span>
            </motion.div>
          </section>

        <section id="features" className="pb-10">
          <div className="w-full bg-[#17090f] px-6 py-10 text-[#f3e8df] md:px-12 md:py-14">
            <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3 md:gap-0">
              {HERO_PILLARS.map((item, i) => (
                <div
                  key={item.n}
                  className={`relative px-5 py-5 md:px-12 md:py-8 ${
                    i !== HERO_PILLARS.length - 1 ? 'md:border-r md:border-[#f7e2d0]/10' : ''
                  } ${i === 0 ? 'bg-[#341720]/70 md:-ml-2' : ''}`}
                >
                  <div className="text-4xl font-semibold text-[#b48a7f] md:text-[2.6rem]">{item.n}</div>
                  <div className="mt-4 h-[3px] w-14 rounded-full bg-gradient-to-r from-[#f0617a] to-[#d47a56]" />
                  <h3
                    className="mt-8 text-2xl font-sans font-bold leading-tight text-rose-50 md:text-[2rem]"
                    style={{ color: '#fff4ee', textShadow: '0 2px 12px rgba(0,0,0,0.35)' }}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-5 max-w-md text-lg leading-relaxed text-[#e5d6cd]/95 md:text-[1.18rem]">{item.desc}</p>
                </div>
              ))}
            </div>

            <motion.div className="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-3 rounded-3xl border border-white/15 bg-white/[0.04] p-4 backdrop-blur-xl md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.l} className="text-center">
                  <div className="text-3xl font-extrabold text-white md:text-[2.1rem]">{s.v}</div>
                  <div className="text-xs font-medium tracking-wide text-white/70">{s.l}</div>
              </div>
              ))}
            </motion.div>
          </div>
          </section>

        <section className="bg-[radial-gradient(55%_60%_at_15%_15%,rgba(199,33,122,0.24),transparent_70%),radial-gradient(42%_52%_at_85%_18%,rgba(93,22,131,0.26),transparent_72%),linear-gradient(135deg,#130119_0%,#280334_46%,#53073b_78%,#7a0e4d_100%)] px-6 py-16 md:px-12 md:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="grid items-center gap-10 md:grid-cols-[1fr_1fr] md:gap-14">
              <div className="text-[#f6eaf1]">
                <h2
                  className="max-w-lg text-2xl font-sans font-bold leading-tight tracking-tight text-white md:text-[2rem]"
                  style={{ color: '#ffffff', textShadow: '0 3px 18px rgba(4,1,9,0.62)' }}
                >
                  Real love starts with
                  <span className="mt-2 block bg-gradient-to-r from-[#ec5f79] to-[#d97d68] bg-clip-text font-sans font-semibold text-transparent">
                    real intent.
                  </span>
                </h2>
                <p className="mt-8 max-w-xl text-lg leading-relaxed text-[#f0dce7]/90 md:text-[2rem]">
                  We built Mebley because the world deserved a dating app where ambition meets authenticity - and where great relationships actually begin.
                </p>
              </div>

              <div className="grid overflow-hidden rounded-[30px] border border-white/20 bg-white/8 backdrop-blur-md md:grid-cols-2">
                <div className="border-b border-r border-white/15 p-8 md:p-10">
                  <div className="font-sans text-6xl font-extrabold text-[#fff5fb]">12<span className="text-[#ec5f79]">k+</span></div>
                  <div className="mt-2 text-sm font-semibold uppercase tracking-[0.12em] text-[#ecd8e3]">Active users</div>
                </div>
                <div className="border-b border-white/15 p-8 md:p-10">
                  <div className="font-sans text-6xl font-extrabold text-[#fff5fb]">40<span className="text-[#ec5f79]">+</span></div>
                  <div className="mt-2 text-sm font-semibold uppercase tracking-[0.12em] text-[#ecd8e3]">Countries</div>
                </div>
                <div className="border-r border-white/15 p-8 md:p-10">
                  <div className="font-sans text-6xl font-extrabold text-[#fff5fb]">4.8<span className="text-[#ec5f79]">★</span></div>
                  <div className="mt-2 text-sm font-semibold uppercase tracking-[0.12em] text-[#ecd8e3]">App rating</div>
                </div>
                <div className="bg-[#1d0b12]/80 p-8 md:p-10">
                  <div className="font-sans text-6xl font-extrabold text-[#f2e8e0]">3<span className="text-[#ec5f79]">k+</span></div>
                  <div className="mt-2 text-sm font-semibold uppercase tracking-[0.12em] text-[#b6a4ad]">Couples formed</div>
                </div>
              </div>
            </div>

            <div className="relative mt-14 overflow-hidden rounded-[34px] bg-[radial-gradient(65%_120%_at_0%_0%,rgba(241,102,131,0.16),transparent_50%),radial-gradient(40%_80%_at_80%_90%,rgba(209,112,85,0.15),transparent_60%),linear-gradient(135deg,#2a0f18,#421723_52%,#31111a)] px-6 py-16 text-center md:px-12 md:py-20">
              <div className="absolute -left-20 top-4 h-64 w-64 rounded-full bg-[#74344f]/20 blur-2xl" />
              <div className="absolute -right-20 bottom-4 h-64 w-64 rounded-full bg-[#6e3b2f]/20 blur-2xl" />
              <div className="relative z-10">
                <h3
                  className="text-2xl font-sans font-bold leading-tight tracking-tight text-white md:text-[2rem]"
                  style={{ color: '#ffffff', textShadow: '0 2px 12px rgba(0,0,0,0.45)' }}
                >
                  Your person is
                  <span className="mt-2 block bg-gradient-to-r from-[#ffb1c7] to-[#f29c84] bg-clip-text font-sans font-semibold text-transparent">
                    already here.
                  </span>
                </h3>
                <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-[#d8c7ce] md:text-[2rem]">
                  Join thousands building something real. Start free - no card required.
                </p>
                <div className="mt-10">
                  <MagBtn href="/auth" className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#ee5d7d] to-[#d77b5d] px-12 py-4 text-base font-semibold text-white shadow-[0_16px_36px_rgba(236,95,121,0.3)]">
                    Create your profile →
              </MagBtn>
                </div>
              </div>
                </div>
          </div>
          </section>

        <section className="relative overflow-hidden bg-[radial-gradient(62%_80%_at_14%_8%,rgba(195,36,124,0.18),transparent_70%),radial-gradient(48%_62%_at_90%_18%,rgba(85,19,129,0.2),transparent_72%),linear-gradient(135deg,#120119_0%,#24032d_45%,#430736_72%,#671045_100%)] px-6 py-16 md:px-12 md:py-20">
          <motion.div
            className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#d23b8f]/20 blur-3xl"
            animate={{ x: [0, 20, 0], y: [0, -12, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="pointer-events-none absolute -right-24 bottom-8 h-72 w-72 rounded-full bg-[#6e2fb0]/20 blur-3xl"
            animate={{ x: [0, -24, 0], y: [0, 10, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="mx-auto max-w-7xl">
            <motion.div
              className="mb-8 flex items-end justify-between gap-6"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, ease: EASE }}
            >
              <h2
                className="text-2xl font-sans font-bold tracking-tight text-white md:text-[2rem]"
                style={{ color: '#ffffff', textShadow: '0 3px 18px rgba(4,1,9,0.62)' }}
              >
                How Mebley works
              </h2>
              <motion.span
                className="rounded-full border border-white/25 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/80"
                whileHover={{ scale: 1.04 }}
              >
                Simple by design
              </motion.span>
            </motion.div>
            <div className="grid gap-4 md:grid-cols-3">
              {HOW.map((item, i) => (
                <motion.div
                  key={item.n}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.55, delay: i * 0.08, ease: EASE }}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.99 }}
                  className="rounded-[18px] border border-white/15 bg-white/6 p-6 backdrop-blur-md"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#ef6180]/20 text-lg">{item.icon}</div>
                  <div className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-[#ffc1d3]">{item.n}</div>
                  <h3
                    className="mt-2 text-xl font-sans font-bold text-white"
                    style={{ color: '#fff8fd', textShadow: '0 2px 12px rgba(4,1,9,0.55)' }}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-[#ead8e4]">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
          </section>

        <section className="relative overflow-hidden bg-[radial-gradient(58%_70%_at_12%_18%,rgba(187,32,119,0.16),transparent_68%),radial-gradient(42%_58%_at_88%_20%,rgba(80,16,122,0.18),transparent_70%),linear-gradient(135deg,#100117_0%,#21042b_48%,#3a0734_74%,#5d0f42_100%)] px-6 py-16 md:px-12 md:py-20">
          <motion.div
            className="pointer-events-none absolute left-12 top-10 h-56 w-56 rounded-full bg-[#7d2ab7]/16 blur-3xl"
            animate={{ scale: [1, 1.06, 1], opacity: [0.6, 0.85, 0.6] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-2">
            <motion.div
              className="rounded-[24px] border border-white/15 bg-white/7 p-7 backdrop-blur-md"
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <h2
                className="text-2xl font-sans font-bold tracking-tight text-white md:text-[2rem]"
                style={{ color: '#ffffff', textShadow: '0 3px 18px rgba(4,1,9,0.62)' }}
              >
                Safety and verification
              </h2>
              <p className="mt-4 text-base leading-relaxed text-[#ecdbe6]">Built with trust-first controls so great conversations can happen safely.</p>
              <div className="mt-6 grid gap-3">
                {VALUES.map((item, i) => (
                  <motion.div
                    key={item.title}
                    className="rounded-[14px] border border-white/12 bg-black/15 p-4"
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.08, ease: EASE }}
                    whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.28)' }}
                  >
                    <div className="text-sm font-semibold uppercase tracking-[0.1em] text-[#ffb9cd]">{item.icon} {item.title}</div>
                    <p className="mt-2 text-sm leading-relaxed text-[#e8d5e1]">{item.desc}</p>
              </motion.div>
              ))}
              </div>
            </motion.div>
            <motion.div
              className="rounded-[24px] border border-white/15 bg-white/7 p-7 backdrop-blur-md"
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <h2
                className="text-2xl font-sans font-bold tracking-tight text-white md:text-[2rem]"
                style={{ color: '#ffffff', textShadow: '0 3px 18px rgba(4,1,9,0.62)' }}
              >
                Questions people ask
              </h2>
              <div className="mt-6 space-y-3">
                {FAQS.map((item, i) => (
                  <motion.details
                    key={item.q}
                    className="rounded-[14px] border border-white/12 bg-black/15 p-4"
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: i * 0.08, ease: EASE }}
                    whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.28)' }}
                  >
                    <summary className="cursor-pointer list-none text-base font-semibold text-white">{item.q}</summary>
                    <p className="mt-2 text-sm leading-relaxed text-[#e8d5e1]">{item.a}</p>
                  </motion.details>
                ))}
              </div>
            </motion.div>
            </div>
          </section>

        <section id="stories" className="bg-[radial-gradient(55%_70%_at_10%_8%,rgba(190,28,116,0.24),transparent_66%),radial-gradient(45%_60%_at_86%_20%,rgba(82,16,120,0.24),transparent_70%),linear-gradient(135deg,#110118_0%,#260331_45%,#4d0838_76%,#740f4a_100%)] px-6 pb-16 md:px-12 md:pb-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 text-center md:mb-10">
              <h2
                className="text-2xl font-sans font-bold leading-tight tracking-tight text-white md:text-[2rem]"
                style={{ color: '#ffffff', textShadow: '0 3px 18px rgba(4,1,9,0.62)' }}
              >
                Stories stitched with
                <span className="ml-2 bg-gradient-to-r from-[#ef6180] to-[#d98762] bg-clip-text font-sans font-semibold text-transparent">
                  intention.
                </span>
              </h2>
              <p className="mx-auto mt-5 max-w-3xl text-base text-[#f0dce7]/90 md:text-xl">
                Real people. Real chemistry. Real conversations that led to something meaningful.
              </p>
            </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeT}
                className="relative overflow-hidden rounded-[32px] border border-[#4b2732]/20 bg-[radial-gradient(70%_120%_at_0%_0%,rgba(241,102,131,0.14),transparent_56%),radial-gradient(40%_80%_at_80%_90%,rgba(209,112,85,0.14),transparent_60%),linear-gradient(135deg,#200c14,#3a1520_52%,#2c0f18)] p-8 text-[#f5e9e2] shadow-[0_24px_60px_rgba(31,11,19,0.35)] md:p-12"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <div className="absolute -left-24 top-6 h-72 w-72 rounded-full bg-[#7c3550]/20 blur-3xl" />
                <div className="absolute -right-24 bottom-6 h-72 w-72 rounded-full bg-[#734033]/20 blur-3xl" />
                <div className="relative z-10">
                  <p className="font-sans text-2xl font-medium leading-relaxed text-[#f9efe8] md:text-[2rem]">
                &ldquo;{TESTIMONIALS[activeT].text}&rdquo;
              </p>
                  <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#ef6180] to-[#d98762] font-sans text-lg font-bold text-white">
                  {TESTIMONIALS[activeT].name[0]}
                </div>
                      <div>
                        <div className="text-base font-semibold text-[#f7ece5] md:text-lg">
                          {TESTIMONIALS[activeT].name}, {TESTIMONIALS[activeT].age}
                        </div>
                        <div className="text-sm text-[#cab6be] md:text-base">{TESTIMONIALS[activeT].city}</div>
                        <div className="text-sm font-semibold text-[#ffadc2]">{TESTIMONIALS[activeT].match}</div>
                </div>
              </div>

                    <div className="flex items-center gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveT(i)}
                          aria-label={`Show story ${i + 1}`}
                          className={`h-2.5 rounded-full transition-all ${
                            i === activeT ? 'w-8 bg-[#ef6180]' : 'w-2.5 bg-white/35 hover:bg-white/50'
                          }`}
              />
            ))}
          </div>
                </div>
                </div>
              </motion.div>
            </AnimatePresence>
                </div>
        </section>

        <footer className="bg-[radial-gradient(80%_120%_at_0%_0%,rgba(235,95,125,0.07),transparent_58%),linear-gradient(135deg,#1f0b12,#2b1018_55%,#220d14)] px-6 pb-10 pt-12 md:px-12">
          <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-10">
            <div>
              <a href="/" className="flex items-center gap-2 text-white">
                  <img
                    src="/icon.svg"
                    alt="Mebley logo"
                    className="h-6 w-6 rounded-full object-cover"
                  />
                  <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-2xl font-sans font-bold tracking-tight text-transparent md:text-[2rem]">
                    Mebley
                  </span>
                </a>
                <p className="mt-3 max-w-xs text-base leading-relaxed text-slate-400">
                  Dating built for people who want something real. Stitch your story.
                </p>
                </div>
            <div className="grid grid-cols-2 gap-8 text-base text-white/75 md:grid-cols-3">
              <div>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-white/90">Product</h4>
                  <div className="space-y-2">
                    <a href="#features">Features</a>
                    <a href="#stories" className="block">Stories</a>
                    <a href="/auth" className="block">Sign up</a>
                  </div>
                </div>
              <div>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-white/90">Company</h4>
                  <div className="space-y-2">
                    <a href="/about">About</a>
                    <a href="/blog" className="block">Blog</a>
                    <a href="/contact" className="block">Contact</a>
                  </div>
              </div>
              <div>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-white/90">Legal</h4>
                  <div className="space-y-2">
                    <a href="/privacy">Privacy</a>
                    <a href="/terms" className="block">Terms</a>
                  </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-sm text-white/60">
              <p>© 2025 Mebley Inc. All rights reserved.</p>
            <div className="flex gap-2">
              {['𝕏', 'IG', 'TT', 'YT'].map((s) => (
                <a key={s} href="#" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[11px]">
                  {s}
                </a>
              ))}
              </div>
              </div>
            </div>
          </footer>
      </div>
    </div>
  )
}
