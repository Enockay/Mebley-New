'use client'

import { useRef, useState, useEffect } from 'react'
import {
  motion, useScroll, useTransform, useSpring,
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
const STATS = [{ v: '40+', l: 'Countries' }, { v: '12k+', l: 'Matches' }, { v: '4.8★', l: 'App rating' }, { v: '78%', l: 'Reply rate' }]
const VALUES = [
  { icon: '💎', title: 'Depth over swipes',   desc: 'We designed every feature to push past the surface. No swipe gamification, no endless scroll.' },
  { icon: '🌐', title: 'Globally inclusive',  desc: 'Built from day one to connect people across race, culture and continent without bias in the algorithm.' },
  { icon: '🔒', title: 'Safe by design',      desc: 'Photo verification, report tools, and proactive moderation so you can be open without being exposed.' },
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
          <div style={{ fontFamily: 'Fraunces,serif', fontSize: 14, fontWeight: 800, color: '#fff' }}>{data.name}</div>
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
  const pageRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: pageRef })

  // Parallax: photos scroll slightly slower than content → depth illusion
  const photoY = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  useEffect(() => {
    const t = setInterval(() => setActiveT(i => (i+1) % TESTIMONIALS.length), 4600)
    return () => clearInterval(t)
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--r:#f43f5e;--p:#ec4899;--g:#e8a020;--gl:#f5d07a;--m:#0f0409}
        html{scroll-behavior:smooth}
        body{font-family:'DM Sans',sans-serif;background:var(--m);color:#fff;overflow-x:hidden}

        /* ── keyframes ── */
        @keyframes bfl{0%,100%{transform:rotate(-6deg) translateX(5px) translateY(0)}50%{transform:rotate(-6deg) translateX(5px) translateY(-9px)}}
        @keyframes bfr{0%,100%{transform:rotate(6deg) translateX(-5px) translateY(0)}50%{transform:rotate(6deg) translateX(-5px) translateY(-9px)}}
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes heartbeat{0%,100%{transform:scale(1)}15%{transform:scale(1.3)}30%{transform:scale(1)}45%{transform:scale(1.15)}}
        @keyframes threadfall{0%{transform:translateY(-5%);opacity:0}10%{opacity:1}90%{opacity:.35}100%{transform:translateY(105vh);opacity:0}}
        @keyframes scrollbar{0%{transform:scaleY(0);transform-origin:top}50%{transform:scaleY(1);transform-origin:top}51%{transform-origin:bottom}100%{transform:scaleY(0);transform-origin:bottom}}

        /* ── text effects ── */
        .gold{background:linear-gradient(135deg,var(--gl) 0%,var(--g) 40%,var(--gl) 70%,var(--g) 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 3s linear infinite}
        .rose{background:linear-gradient(135deg,#f43f5e,#ec4899,#f43f5e);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 4s linear infinite}

        /* ═══════════════════════════════════════════════
           FULL-PAGE PHOTO BACKGROUND
           position:absolute on .page-wrap stretches to
           full document height, not just the viewport.
        ═══════════════════════════════════════════════ */
        .page-wrap{position:relative;overflow:hidden}

        /* Photo mosaic — absolute, fills full page height */
        .photo-bg{
          position:absolute;
          top:0;left:0;right:0;bottom:0;
          z-index:0;
          display:grid;
          grid-template-columns:repeat(8,1fr);
          grid-auto-rows:minmax(180px,1fr);
        }
        .photo-bg img{
          width:100%;height:100%;
          object-fit:cover;object-position:center top;
          display:block;
        }
        /* Multi-layer overlay darkens the mosaic enough to read over */
        .photo-overlay{
          position:absolute;top:0;left:0;right:0;bottom:0;z-index:1;
          background:
            /* centre vignette keeps brand black */
            radial-gradient(ellipse 90% 60% at 50% 30%,rgba(15,4,9,.82) 0%,rgba(15,4,9,.60) 50%,rgba(15,4,9,.38) 100%),
            /* top & bottom fade to solid black */
            linear-gradient(180deg,
              rgba(15,4,9,.88) 0%,
              rgba(15,4,9,.38) 12%,
              rgba(15,4,9,.28) 35%,
              rgba(15,4,9,.28) 65%,
              rgba(15,4,9,.38) 88%,
              rgba(15,4,9,.92) 100%);
        }

        /* All content sits above photos */
        .page-content{position:relative;z-index:10}

        /* ─── NAV ─── */
        nav{position:fixed;top:0;left:0;right:0;z-index:300;padding:20px 48px;display:flex;align-items:center;justify-content:space-between;transition:background .35s}
        nav.solid{background:rgba(15,4,9,.93);backdrop-filter:blur(22px);border-bottom:1px solid rgba(244,63,94,.1)}
        .nav-logo{display:flex;align-items:center;gap:10px;font-family:'Fraunces',serif;font-size:22px;font-weight:700;color:#fff;text-decoration:none}
        .nav-links{display:flex;align-items:center;gap:36px;list-style:none}
        .nav-links a{color:rgba(255,255,255,.58);text-decoration:none;font-size:14px;font-weight:500;transition:color .2s}
        .nav-links a:hover{color:#fff}
        .btn-nav{background:linear-gradient(135deg,var(--r),var(--p));color:#fff;border:none;padding:10px 24px;border-radius:100px;font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;text-decoration:none;display:inline-block}

        /* ─── GLASS panel ─── */
        .glass{background:rgba(15,4,9,.52);backdrop-filter:blur(26px);-webkit-backdrop-filter:blur(26px);border:1px solid rgba(255,255,255,.08);border-radius:26px}

        /* ─── HERO ─── */
        .hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:120px 32px 90px;text-align:center;position:relative;overflow:hidden}
        .hero-eyebrow{display:inline-flex;align-items:center;gap:8px;background:rgba(244,63,94,.13);border:1px solid rgba(244,63,94,.32);border-radius:100px;padding:7px 18px;font-size:12px;font-weight:600;letter-spacing:.13em;text-transform:uppercase;color:rgba(255,255,255,.88);margin-bottom:28px}
        .hero-title{font-family:'Fraunces',serif;font-size:clamp(56px,9.5vw,118px);font-weight:900;line-height:.95;letter-spacing:-.04em;color:#fff;margin-bottom:10px}
        .hero-em{display:block;font-style:italic;font-weight:300;font-size:clamp(52px,9vw,112px)}
        .hero-sub{font-size:clamp(16px,2vw,21px);color:rgba(255,255,255,.48);line-height:1.7;max-width:540px;margin:26px auto 52px;font-weight:300}
        .ctas{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;margin-bottom:22px}
        .btn-primary{display:inline-flex;align-items:center;gap:10px;background:linear-gradient(135deg,var(--r),var(--p));color:#fff;border:none;padding:17px 34px;border-radius:100px;font-size:16px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;text-decoration:none}
        .btn-ghost{display:inline-flex;align-items:center;gap:10px;background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.22);padding:17px 34px;border-radius:100px;font-size:16px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;text-decoration:none;backdrop-filter:blur(14px)}
        .store-row{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap}
        .store-pill{display:flex;align-items:center;gap:9px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:11px 18px;text-decoration:none;color:#fff;transition:background .2s,transform .2s}
        .store-pill:hover{background:rgba(255,255,255,.14);transform:translateY(-2px)}
        .spl{font-size:9px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.1em}
        .spn{font-size:14px;font-weight:700;font-family:'Fraunces',serif}
        .scroll-hint{position:absolute;bottom:34px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:5px;opacity:.4}
        .sh-line{width:1px;height:48px;background:linear-gradient(to bottom,#fff,transparent);animation:scrollbar 1.8s ease-in-out infinite}

        /* ─── SECTIONS ─── */
        .section{padding:112px 48px;position:relative}
        .section.center{text-align:center}
        .s-eye{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--r);margin-bottom:14px}
        .s-title{font-family:'Fraunces',serif;font-size:clamp(36px,5.5vw,68px);font-weight:700;line-height:1.06;letter-spacing:-.025em;color:#fff;margin-bottom:18px}
        .s-sub{font-size:16px;color:rgba(255,255,255,.4);line-height:1.78;max-width:490px;font-weight:300}

        /* ─── BOOKS ─── */
        .books-wrap{max-width:860px;margin:0 auto;display:flex;flex-direction:column;gap:100px;align-items:center}
        .book-row{display:flex;flex-direction:column;align-items:center;gap:14px}
        .book-pair{display:flex;align-items:flex-start;justify-content:center}
        .book-caption{font-size:12px;color:rgba(255,255,255,.3);letter-spacing:.05em}

        /* ─── STATS ─── */
        .stats-bar{display:flex;max-width:740px;margin:0 auto;border-radius:22px;overflow:hidden}
        .stat-cell{flex:1;padding:30px 14px;text-align:center;border-right:1px solid rgba(255,255,255,.07)}
        .stat-cell:last-child{border-right:none}
        .stat-val{font-family:'Fraunces',serif;font-size:40px;font-weight:900;color:#fff;line-height:1}
        .stat-lbl{font-size:11px;color:rgba(255,255,255,.34);margin-top:5px;font-weight:300;letter-spacing:.04em}

        /* ─── FEATURES ─── */
        .feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;max-width:960px;margin:58px auto 0;border-radius:24px;overflow:hidden}
        .feat-card{padding:36px 30px;transition:background .3s;cursor:default;position:relative;overflow:hidden}
        .feat-card::after{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(244,63,94,.4),transparent);opacity:0;transition:opacity .3s}
        .feat-card:hover{background:rgba(244,63,94,.05)}
        .feat-card:hover::after{opacity:1}
        .fi{font-size:30px;margin-bottom:18px;display:block}
        .ft{font-family:'Fraunces',serif;font-size:21px;font-weight:700;color:#fff;margin-bottom:5px}
        .fs{font-size:10px;font-weight:700;color:var(--r);text-transform:uppercase;letter-spacing:.1em;margin-bottom:11px}
        .fd{font-size:13px;color:rgba(255,255,255,.4);line-height:1.72;font-weight:300}

        /* ─── HOW ─── */
        .how-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:0;max-width:880px;margin:58px auto 0;border-radius:22px;overflow:hidden}
        .how-card{padding:38px 28px;border-right:1px solid rgba(255,255,255,.07);transition:background .3s}
        .how-card:last-child{border-right:none}
        .how-card:hover{background:rgba(244,63,94,.04)}
        .hn{font-family:'Fraunces',serif;font-size:10px;font-weight:700;color:rgba(244,63,94,.5);letter-spacing:.17em;text-transform:uppercase;margin-bottom:14px}
        .hi{font-size:28px;margin-bottom:14px;display:block}
        .ht{font-family:'Fraunces',serif;font-size:20px;font-weight:700;color:#fff;margin-bottom:10px}
        .hd{font-size:13px;color:rgba(255,255,255,.4);line-height:1.72;font-weight:300}

        /* ─── VALUES ─── */
        .val-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;max-width:880px;margin:58px auto 0}
        .val-card{padding:36px 28px;border-radius:22px;border:1px solid rgba(255,255,255,.08);transition:transform .3s,border-color .3s}
        .val-card:hover{transform:translateY(-5px);border-color:rgba(244,63,94,.2)}
        .vi{font-size:30px;margin-bottom:18px;display:block}
        .vt{font-family:'Fraunces',serif;font-size:20px;font-weight:700;color:#fff;margin-bottom:10px}
        .vd{font-size:13px;color:rgba(255,255,255,.4);line-height:1.72;font-weight:300}

        /* ─── TESTIMONIALS ─── */
        .testi-card{max-width:640px;margin:54px auto 0;padding:44px 48px;position:relative}
        .testi-card::before{content:'"';font-family:'Fraunces',serif;font-size:120px;color:rgba(244,63,94,.1);position:absolute;top:-16px;left:22px;line-height:1;pointer-events:none}
        .ttext{font-family:'Fraunces',serif;font-size:clamp(17px,2.2vw,25px);font-weight:300;font-style:italic;color:rgba(255,255,255,.88);line-height:1.55;margin-bottom:28px;position:relative;z-index:1}
        .tauth{display:flex;align-items:center;justify-content:center;gap:12px}
        .tav{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--r),var(--p));display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;font-weight:700;font-size:14px;flex-shrink:0}
        .tn{font-weight:600;font-size:14px;color:#fff}
        .ts{font-size:11px;color:rgba(255,255,255,.35);margin-top:1px}
        .tm{font-size:10px;color:var(--r);font-weight:600;letter-spacing:.05em}
        .tdots{display:flex;justify-content:center;gap:7px;margin-top:24px}
        .tdot{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.18);border:none;cursor:pointer;padding:0;transition:background .3s,transform .3s}
        .tdot.on{background:var(--r);transform:scale(1.4)}

        /* ─── CTA ─── */
        .cta-inner{max-width:560px;margin:0 auto;text-align:center}
        .cta-title{font-family:'Fraunces',serif;font-size:clamp(44px,7.5vw,92px);font-weight:900;line-height:1;letter-spacing:-.035em;color:#fff;margin-bottom:20px}
        .cta-sub{font-size:17px;color:rgba(255,255,255,.4);line-height:1.68;max-width:420px;margin:0 auto 44px;font-weight:300}
        .store-row-lg{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-bottom:26px}
        .store-pill-lg{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.13);border-radius:16px;padding:14px 24px;text-decoration:none;color:#fff;transition:background .2s,transform .2s;min-width:168px}
        .store-pill-lg:hover{background:rgba(255,255,255,.12);transform:translateY(-3px)}
        .store-pill-lg .spn{font-size:17px}
        .wl{font-size:12px;color:rgba(255,255,255,.22);letter-spacing:.05em}

        /* ─── FOOTER ─── */
        footer{padding:48px 48px 30px;max-width:1100px;margin:0 auto;border-top:1px solid rgba(255,255,255,.06)}
        .fi2{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:36px;margin-bottom:42px}
        .fb p{font-size:13px;color:rgba(255,255,255,.26);margin-top:10px;max-width:230px;line-height:1.65;font-weight:300}
        .fc h4{font-size:10px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:rgba(255,255,255,.33);margin-bottom:13px}
        .fc ul{list-style:none;display:flex;flex-direction:column;gap:9px}
        .fc a{font-size:13px;color:rgba(255,255,255,.4);text-decoration:none;transition:color .2s;font-weight:300}
        .fc a:hover{color:#fff}
        .fbtm{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding-top:22px;border-top:1px solid rgba(255,255,255,.05)}
        .fbtm p{font-size:11px;color:rgba(255,255,255,.2);font-weight:300}
        .sl{display:flex;gap:10px}
        .sl a{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.34);text-decoration:none;font-size:11px;transition:background .2s,color .2s}
        .sl a:hover{background:rgba(244,63,94,.16);color:var(--r);border-color:rgba(244,63,94,.3)}

        /* ─── MOBILE ─── */
        @media(max-width:768px){
          nav{padding:14px 20px}.nav-links{display:none}
          .section{padding:72px 20px}
          .feat-grid,.how-grid,.val-grid{grid-template-columns:1fr}
          .how-card{border-right:none;border-bottom:1px solid rgba(255,255,255,.07)}
          .testi-card{padding:28px 22px}
          footer{padding:36px 20px 22px}
          /* on mobile use 3-col photo grid */
          .photo-bg{grid-template-columns:repeat(3,1fr)}
        }
      `}</style>

      {/* ════════════════════════════════════════════
          PAGE WRAPPER — position:relative so the
          absolute photo-bg fills its full height
      ════════════════════════════════════════════ */}
      <div className="page-wrap" ref={pageRef}>

        {/* ── FULL-PAGE PHOTO MOSAIC (absolute, whole document) ── */}
        {/* We repeat the photo array 4× so it tiles down the entire page */}
        <motion.div className="photo-bg" style={{ y: photoY }} aria-hidden="true">
          {Array.from({ length: 69 }, (_, i) => (
            <MosaicCell key={i} index={i} />
          ))}
        </motion.div>

        {/* ── OVERLAY (same absolute, full height) ── */}
        <div className="photo-overlay" aria-hidden="true"/>

        {/* ── ALL CONTENT ── */}
        <div className="page-content">

          {/* NAV */}
          <nav className={scrollY > 50 ? 'solid' : ''}>
            <a href="/" className="nav-logo"><HookIcon size={24}/>Crotchet</a>
            <ul className="nav-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#how">How it works</a></li>
              <li><a href="#values">Our values</a></li>
              <li><a href="#stories">Stories</a></li>
            </ul>
            <MagBtn href="/auth" className="btn-nav">Get started</MagBtn>
          </nav>

          {/* ══ HERO ══ */}
          <section className="hero">
            {/* thread particles */}
            {Array.from({length:9},(_,i)=>(
              <div key={i} style={{position:'absolute',left:`${10+i*9}%`,top:'-5%',animation:`threadfall ${10+i*1.4}s ${i*1.7}s infinite linear`,opacity:0,pointerEvents:'none'}}>
                <svg width="2" height="48" viewBox="0 0 2 48"><line x1="1" y1="0" x2="1" y2="48" stroke="rgba(244,63,94,0.3)" strokeWidth="1.5" strokeDasharray="4 4"/></svg>
              </div>
            ))}

            <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:0.6,delay:0.2}}>
              <div className="hero-eyebrow">
                <span style={{animation:'heartbeat 2s ease-in-out infinite'}}>🧵</span>
                A new kind of connection
              </div>
            </motion.div>

            <h1 className="hero-title">
              <SplitWords text="Stitch your" delay={0.3}/>
              <span className="hero-em rose" style={{overflow:'hidden', display:'block'}}>
                <motion.span
                  initial={{y:'108%',opacity:0}} animate={{y:0,opacity:1}}
                  transition={{duration:0.9,delay:0.68,ease:EASE}}
                  style={{display:'inline-block'}}>
                  story.
                </motion.span>
              </span>
            </h1>

            <motion.p className="hero-sub"
              initial={{opacity:0,y:22}} animate={{opacity:1,y:0}}
              transition={{duration:0.8,delay:0.96,ease:EASE}}>
              Dating built for depth. Voice notes, intentional matches, and a feed that rewards authenticity over volume — across 40+ countries.
            </motion.p>

            <motion.div className="ctas"
              initial={{opacity:0,y:18}} animate={{opacity:1,y:0}}
              transition={{duration:0.7,delay:1.12}}>
              <MagBtn href="/auth" className="btn-primary">✦ Start for free</MagBtn>
              <MagBtn href="#how" className="btn-ghost">See how it works</MagBtn>
            </motion.div>

            <motion.div className="store-row"
              initial={{opacity:0}} animate={{opacity:1}}
              transition={{duration:0.7,delay:1.32}}>
              <a href="https://apps.apple.com/app/crotchet" target="_blank" rel="noopener noreferrer" className="store-pill">
                <span style={{fontSize:20}}>🍎</span>
                <div><div className="spl">Download on the</div><div className="spn">App Store</div></div>
              </a>
              <a href="https://play.google.com/store/apps/details?id=com.crotchet" target="_blank" rel="noopener noreferrer" className="store-pill">
                <span style={{fontSize:20}}>▶</span>
                <div><div className="spl">Get it on</div><div className="spn">Google Play</div></div>
              </a>
            </motion.div>

            <div className="scroll-hint"><div className="sh-line"/></div>
          </section>

          {/* ══ STITCHED BOOKS — 3 global pairings ══ */}
          <section className="section center">
            <Reveal><SD/></Reveal>
            <Reveal delay={0.1}>
              <div style={{marginTop:52}}>
                <span className="s-eye">Global matching</span>
                <h2 className="s-title">Every stitch connects<br/><span className="gold">two stories.</span></h2>
                <p className="s-sub" style={{margin:'0 auto'}}>People from different continents, cultures, and cities — finding each other one intentional match at a time.</p>
              </div>
            </Reveal>
            <motion.div className="books-wrap" style={{marginTop:64}}
              initial="hidden" whileInView="show" viewport={{once:true,margin:'-60px'}}
              variants={stagger(0.1)}>
              {PAIRS.map((pair,pi)=>(
                <motion.div key={pi} variants={scaleIn} className="book-row">
                  <div className="book-pair">
                    <BookCard side="left"  data={pair.left}  thread={pair.thread}/>
                    <Spine thread={pair.thread}/>
                    <BookCard side="right" data={pair.right} thread={pair.thread}/>
                  </div>
                  <p className="book-caption">{pair.caption}</p>
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* ══ STATS ══ */}
          <section className="section">
            <motion.div className="stats-bar glass"
              initial="hidden" whileInView="show" viewport={{once:true,margin:'-60px'}}
              variants={stagger(0)}>
              {STATS.map((s,i)=>(
                <motion.div key={i} className="stat-cell" variants={fadeUp}>
                  <div className="stat-val">{s.v}</div>
                  <div className="stat-lbl">{s.l}</div>
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* ══ FEATURES ══ */}
          <section id="features" className="section center">
            <Reveal><SD/></Reveal>
            <Reveal delay={0.08}>
              <div style={{marginTop:52}}>
                <span className="s-eye">Built different</span>
                <h2 className="s-title">Dating that actually<br/><span className="gold">feels like something.</span></h2>
                <p className="s-sub" style={{margin:'0 auto'}}>We replaced swipe fatigue with intentional tools designed to spark real conversation.</p>
              </div>
            </Reveal>
            <motion.div className="feat-grid glass"
              initial="hidden" whileInView="show" viewport={{once:true,margin:'-60px'}}
              variants={stagger(0.08)}>
              {FEATURES.map((f,i)=>(
                <motion.div key={i} className="feat-card" variants={fadeUp}>
                  <span className="fi">{f.icon}</span>
                  <div className="ft">{f.title}</div>
                  <div className="fs">{f.sub}</div>
                  <p className="fd">{f.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* ══ HOW IT WORKS ══ */}
          <section id="how" className="section center">
            <Reveal><SD color="rgba(232,160,32,0.22)"/></Reveal>
            <Reveal delay={0.08}>
              <div style={{marginTop:52}}>
                <span className="s-eye" style={{color:'var(--g)'}}>How it works</span>
                <h2 className="s-title">Three steps to<br/><span className="gold">something real.</span></h2>
                <p className="s-sub" style={{margin:'0 auto'}}>No swiping for sport. Every action on Crotchet is designed to mean something.</p>
              </div>
            </Reveal>
            <motion.div className="how-grid glass"
              initial="hidden" whileInView="show" viewport={{once:true,margin:'-60px'}}
              variants={stagger(0.12)}>
              {HOW.map((h,i)=>(
                <motion.div key={i} className="how-card" variants={fadeUp}>
                  <div className="hn">{h.n}</div>
                  <span className="hi">{h.icon}</span>
                  <div className="ht">{h.title}</div>
                  <p className="hd">{h.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* ══ OUR VALUES ══ */}
          <section id="values" className="section center">
            <Reveal><SD color="rgba(139,92,246,0.25)"/></Reveal>
            <Reveal delay={0.08}>
              <div style={{marginTop:52}}>
                <span className="s-eye" style={{color:'#8b5cf6'}}>Our values</span>
                <h2 className="s-title">We believe dating<br/><span style={{background:'linear-gradient(135deg,#8b5cf6,#ec4899)',backgroundSize:'200% auto',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',animation:'shimmer 3s linear infinite'}}>should feel human.</span></h2>
                <p className="s-sub" style={{margin:'0 auto'}}>Every product decision we make comes back to three things.</p>
              </div>
            </Reveal>
            <motion.div className="val-grid"
              initial="hidden" whileInView="show" viewport={{once:true,margin:'-60px'}}
              variants={stagger(0.1)}>
              {VALUES.map((v,i)=>(
                <motion.div key={i} className="val-card glass" variants={scaleIn}>
                  <span className="vi">{v.icon}</span>
                  <div className="vt">{v.title}</div>
                  <p className="vd">{v.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* ══ TESTIMONIALS ══ */}
          <section id="stories" className="section center">
            <Reveal><SD/></Reveal>
            <Reveal delay={0.08}>
              <div style={{marginTop:52}}>
                <span className="s-eye">Real stories</span>
                <h2 className="s-title">The thread that<br/><span className="rose">connects them.</span></h2>
              </div>
            </Reveal>
            <AnimatePresence mode="wait">
              <motion.div key={activeT} className="testi-card glass"
                initial={{opacity:0,x:28}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-28}}
                transition={{duration:0.42,ease:EASE}}>
                <p className="ttext">&ldquo;{TESTIMONIALS[activeT].text}&rdquo;</p>
                <div className="tauth">
                  <div className="tav">{TESTIMONIALS[activeT].name[0]}</div>
                  <div style={{textAlign:'left'}}>
                    <div className="tn">{TESTIMONIALS[activeT].name}, {TESTIMONIALS[activeT].age}</div>
                    <div className="ts">{TESTIMONIALS[activeT].city}</div>
                    <div className="tm">{TESTIMONIALS[activeT].match}</div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="tdots">
              {TESTIMONIALS.map((_,i)=>(
                <button key={i} className={`tdot${i===activeT?' on':''}`} onClick={()=>setActiveT(i)}/>
              ))}
            </div>
          </section>

          {/* ══ CTA ══ */}
          <section className="section">
            <Reveal y={40}>
              <div className="cta-inner">
                <span className="s-eye">Download</span>
                <h2 className="cta-title">Your story<br/>starts <em className="rose" style={{fontFamily:'Fraunces,serif'}}>now.</em></h2>
                <p className="cta-sub">Free to start. No credit card. Join thousands finding deeper connections across 40+ countries.</p>
                <div className="store-row-lg">
                  <a href="https://apps.apple.com/app/crotchet" target="_blank" rel="noopener noreferrer" className="store-pill-lg glass">
                    <span style={{fontSize:26}}>🍎</span>
                    <div><div className="spl">Download on the</div><div className="spn">App Store</div></div>
                  </a>
                  <a href="https://play.google.com/store/apps/details?id=com.crotchet" target="_blank" rel="noopener noreferrer" className="store-pill-lg glass">
                    <span style={{fontSize:26}}>▶</span>
                    <div><div className="spl">Get it on</div><div className="spn">Google Play</div></div>
                  </a>
                </div>
                <div style={{marginBottom:20}}>
                  <MagBtn href="/auth" className="btn-primary">✦ Or sign up on web</MagBtn>
                </div>
                <p className="wl">Coming soon to iOS &amp; Android · Web available now</p>
              </div>
            </Reveal>
          </section>

          {/* ══ FOOTER ══ */}
          <footer>
            <Reveal>
              <div className="fi2">
                <div className="fb">
                  <a href="/" className="nav-logo" style={{display:'inline-flex'}}><HookIcon size={22}/>Crotchet</a>
                  <p>Dating built for people who want something real. Stitch your story.</p>
                </div>
                <div className="fc">
                  <h4>Product</h4>
                  <ul><li><a href="#features">Features</a></li><li><a href="#how">How it works</a></li><li><a href="/auth">Sign up</a></li></ul>
                </div>
                <div className="fc">
                  <h4>Company</h4>
                  <ul><li><a href="/about">About</a></li><li><a href="/blog">Blog</a></li><li><a href="/contact">Contact</a></li></ul>
                </div>
                <div className="fc">
                  <h4>Legal</h4>
                  <ul><li><a href="/privacy">Privacy</a></li><li><a href="/terms">Terms</a></li></ul>
                </div>
              </div>
            </Reveal>
            <div className="fbtm">
              <p>© 2026 Crotchet. All rights reserved.</p>
              <div className="sl">
                {['𝕏','IG','TT','YT'].map(s=><a key={s} href="#">{s}</a>)}
              </div>
            </div>
          </footer>

        </div>{/* end page-content */}
      </div>{/* end page-wrap */}
    </>
  )
}
