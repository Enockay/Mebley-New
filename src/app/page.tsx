'use client'

import { useState, useEffect, useRef } from 'react'

function ThreadParticle({ delay, x, duration }: { delay: number; x: number; duration: number }) {
  return (
    <div style={{ position: 'absolute', left: `${x}%`, top: '-20px', animationDelay: `${delay}s`, animationDuration: `${duration}s`, animation: `threadFall ${duration}s ${delay}s infinite linear`, opacity: 0 }}>
      <svg width="2" height="40" viewBox="0 0 2 40">
        <line x1="1" y1="0" x2="1" y2="40" stroke="rgba(244,63,94,0.3)" strokeWidth="1.5" strokeDasharray="4 4" />
      </svg>
    </div>
  )
}

function StitchLine({ color = 'rgba(244,63,94,0.2)' }: { color?: string }) {
  return (
    <svg width="100%" height="12" viewBox="0 0 400 12" preserveAspectRatio="none">
      <line x1="0" y1="6" x2="400" y2="6" stroke={color} strokeWidth="1.5" strokeDasharray="8 6" />
    </svg>
  )
}

function HookIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <defs>
        <linearGradient id="hookGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f5d07a" />
          <stop offset="40%" stopColor="#e8a020" />
          <stop offset="100%" stopColor="#b8760a" />
        </linearGradient>
      </defs>
      <path d="M20 4 C20 4 22 4 22 8 L22 18 C22 22 18 25 14 25 C10 25 7 22 7 18 C7 14 10 11 14 11 C16 11 17 12 17 13" stroke="url(#hookGold)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="17.5" cy="13.5" r="1.5" fill="#e8a020" />
      <line x1="22" y1="4" x2="22" y2="1" stroke="url(#hookGold)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

const testimonials = [
  { name: 'Amara K.', age: 27, city: 'Nairobi', text: "I sent a Stitch and she replied within minutes. We met for coffee two days later.", match: 'Matched with David' },
  { name: 'Priya S.', age: 24, city: 'Lagos', text: "The voice note feature is everything. Hearing someone's laugh before even matching — it's so different.", match: 'Matched with James' },
  { name: 'Chloe M.', age: 29, city: 'London', text: "Other apps felt like scrolling through a catalogue. Crotchet actually made me want to talk to people.", match: 'Matched with Kwame' },
  { name: 'Zainab A.', age: 25, city: 'Dubai', text: "The Golden Thread feature literally made me stop scrolling. His profile just glowed.", match: 'Matched with Remi' },
]

const features = [
  { icon: '🧵', title: 'The Stitch', subtitle: 'Super-like with intention', desc: 'Skip the noise. Send a Stitch with a personal note and jump straight to the top of their stack.' },
  { icon: '🎙️', title: 'Voice Notes', subtitle: 'Hear before you match', desc: 'Record up to 30 seconds on your profile. Let your laugh, your accent, your energy speak for you.' },
  { icon: '✨', title: 'Spotlight Story', subtitle: 'Be impossible to miss', desc: 'A glowing story ring on your card for 24 hours. Because timing is everything.' },
  { icon: '🌙', title: 'Here Tonight', subtitle: 'Live presence. Real sparks.', desc: "Activate when you're out and surface to nearby users looking to connect right now." },
]

const moments = [
  { name: 'The Stitch', credits: 50, glow: '#f43f5e', desc: 'Super like + note, jumps to top' },
  { name: 'Golden Thread', credits: 150, glow: '#e8a020', desc: 'Gold border on card for 24hrs' },
  { name: 'Direct Match', credits: 300, glow: '#8b5cf6', desc: 'Skip likes, send match request' },
  { name: 'Night Out', credits: 100, glow: '#ec4899', desc: '4hr evening boost badge' },
]

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial(i => (i + 1) % testimonials.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const particles = Array.from({ length: 12 }, (_, i) => ({
    delay: i * 1.4,
    x: 5 + i * 8,
    duration: 8 + (i % 4) * 2,
  }))

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;0,700;0,900;1,300;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --rose: #f43f5e; --pink: #ec4899; --gold: #e8a020; --gold-light: #f5d07a;
          --linen: #fdf8f5; --cream: #fef9f6; --midnight: #1a0a0f;
          --deep-rose: #6b2d3e; --warm-grey: #8b7280; --blush: #fce7f3;
        }
        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', sans-serif; background: var(--midnight); color: white; overflow-x: hidden; }
        @keyframes threadFall { 0% { transform: translateY(0); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 0.6; } 100% { transform: translateY(110vh); opacity: 0; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes float { 0%, 100% { transform: translateY(0px) rotate(-2deg); } 50% { transform: translateY(-12px) rotate(2deg); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes heartBeat { 0%, 100% { transform: scale(1); } 15% { transform: scale(1.25); } 30% { transform: scale(1); } 45% { transform: scale(1.15); } }
        @keyframes orb-drift { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(40px, -30px) scale(1.05); } 66% { transform: translate(-20px, 20px) scale(0.97); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        .animate-fadeUp { animation: fadeUp 0.9s cubic-bezier(.16,1,.3,1) both; }
        .animate-fadeIn { animation: fadeIn 1.2s ease both; }
        .animate-float  { animation: float 6s ease-in-out infinite; }
        .delay-1 { animation-delay: 0.15s; } .delay-2 { animation-delay: 0.3s; }
        .delay-3 { animation-delay: 0.45s; } .delay-4 { animation-delay: 0.6s; }
        .gold-text { background: linear-gradient(135deg, var(--gold-light) 0%, var(--gold) 40%, var(--gold-light) 70%, var(--gold) 100%); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: shimmer 3s linear infinite; }
        .rose-text { background: linear-gradient(135deg, #f43f5e, #ec4899, #f43f5e); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: shimmer 4s linear infinite; }
        nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 20px 40px; display: flex; align-items: center; justify-content: space-between; transition: background 0.3s, backdrop-filter 0.3s; }
        nav.scrolled { background: rgba(26,10,15,0.85); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(244,63,94,0.1); }
        .nav-logo { display: flex; align-items: center; gap: 10px; font-family: 'Fraunces', serif; font-size: 22px; font-weight: 700; color: white; text-decoration: none; }
        .nav-links { display: flex; align-items: center; gap: 32px; list-style: none; }
        .nav-links a { color: rgba(255,255,255,0.65); text-decoration: none; font-size: 14px; font-weight: 500; letter-spacing: 0.02em; transition: color 0.2s; }
        .nav-links a:hover { color: white; }
        .btn-nav { background: linear-gradient(135deg, var(--rose), var(--pink)); color: white; border: none; padding: 10px 22px; border-radius: 100px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: transform 0.2s, box-shadow 0.2s; text-decoration: none; }
        .btn-nav:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(244,63,94,0.4); }
        .hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; padding: 120px 24px 80px; }
        .hero-bg { position: absolute; inset: 0; background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(107,45,62,0.6) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 50%, rgba(244,63,94,0.15) 0%, transparent 60%), radial-gradient(ellipse 40% 50% at 20% 70%, rgba(236,72,153,0.12) 0%, transparent 60%), var(--midnight); }
        .orb { position: absolute; border-radius: 50%; filter: blur(80px); animation: orb-drift 12s ease-in-out infinite; pointer-events: none; }
        .orb-1 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(244,63,94,0.18) 0%, transparent 70%); top: -100px; left: -100px; }
        .orb-2 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(232,160,32,0.12) 0%, transparent 70%); bottom: -50px; right: -50px; animation-delay: -4s; }
        .orb-3 { width: 300px; height: 300px; background: radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%); top: 50%; left: 50%; transform: translate(-50%, -50%); animation-delay: -8s; }
        .hero-inner { position: relative; z-index: 2; max-width: 760px; margin: 0 auto; text-align: center; }
        .hero-eyebrow { display: inline-flex; align-items: center; gap: 8px; background: rgba(244,63,94,0.12); border: 1px solid rgba(244,63,94,0.25); border-radius: 100px; padding: 6px 16px; font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.8); margin-bottom: 28px; }
        .hero-title { font-family: 'Fraunces', serif; font-size: clamp(56px, 9vw, 96px); font-weight: 900; line-height: 1.0; letter-spacing: -0.03em; margin-bottom: 24px; color: white; }
        .hero-title em { font-style: italic; font-weight: 300; display: block; }
        .hero-sub { font-size: clamp(16px, 2.5vw, 20px); color: rgba(255,255,255,0.55); line-height: 1.65; max-width: 500px; margin: 0 auto 48px; font-weight: 300; }
        .hero-ctas { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; margin-bottom: 64px; }
        .btn-primary { display: inline-flex; align-items: center; gap: 10px; background: linear-gradient(135deg, var(--rose) 0%, var(--pink) 100%); color: white; border: none; padding: 16px 32px; border-radius: 100px; font-size: 16px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: transform 0.25s, box-shadow 0.25s; text-decoration: none; letter-spacing: 0.01em; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(244,63,94,0.45); }
        .btn-secondary { display: inline-flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.06); color: white; border: 1px solid rgba(255,255,255,0.15); padding: 16px 32px; border-radius: 100px; font-size: 16px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.25s, border-color 0.25s, transform 0.25s; text-decoration: none; letter-spacing: 0.01em; backdrop-filter: blur(10px); }
        .btn-secondary:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.3); transform: translateY(-2px); }
        .store-badges { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; }
        .store-badge { display: flex; align-items: center; gap: 10px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 14px; padding: 12px 20px; text-decoration: none; color: white; transition: background 0.2s, transform 0.2s; }
        .store-badge:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); }
        .store-badge-label { font-size: 10px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.1em; }
        .store-badge-name { font-size: 15px; font-weight: 600; font-family: 'Fraunces', serif; }
        .phones-wrapper { position: relative; height: 520px; width: 100%; max-width: 600px; margin: 0 auto; }
        .phone-card { position: absolute; width: 220px; border-radius: 36px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1); }
        .phone-left { left: 50%; transform: translateX(-130%) rotate(-8deg); top: 40px; z-index: 1; opacity: 0.7; animation: float 7s ease-in-out infinite; animation-delay: -2s; }
        .phone-center { left: 50%; transform: translateX(-50%); top: 0; z-index: 3; animation: float 6s ease-in-out infinite; }
        .phone-right { left: 50%; transform: translateX(30%) rotate(8deg); top: 40px; z-index: 1; opacity: 0.7; animation: float 8s ease-in-out infinite; animation-delay: -4s; }
        .phone-screen { width: 100%; background: var(--midnight); padding: 20px 16px; min-height: 420px; }
        .phone-notch { width: 80px; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; margin: 0 auto 20px; }
        .phone-name { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 700; position: relative; z-index: 1; }
        .phone-tag { font-size: 11px; color: rgba(255,255,255,0.5); position: relative; z-index: 1; }
        section { padding: 100px 24px; }
        .section-eyebrow { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--rose); margin-bottom: 16px; }
        .section-title { font-family: 'Fraunces', serif; font-size: clamp(36px, 5vw, 60px); font-weight: 700; line-height: 1.1; letter-spacing: -0.02em; color: white; margin-bottom: 20px; }
        .section-sub { font-size: 17px; color: rgba(255,255,255,0.45); line-height: 1.7; max-width: 480px; font-weight: 300; }
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; max-width: 1000px; margin: 60px auto 0; }
        .feature-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 24px; padding: 32px; transition: transform 0.3s, border-color 0.3s, background 0.3s; position: relative; overflow: hidden; }
        .feature-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(244,63,94,0.4), transparent); opacity: 0; transition: opacity 0.3s; }
        .feature-card:hover { transform: translateY(-6px); border-color: rgba(244,63,94,0.2); background: rgba(244,63,94,0.04); }
        .feature-card:hover::before { opacity: 1; }
        .feature-icon { font-size: 32px; margin-bottom: 20px; display: block; }
        .feature-title { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 700; color: white; margin-bottom: 4px; }
        .feature-sub { font-size: 12px; font-weight: 600; color: var(--rose); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 14px; }
        .feature-desc { font-size: 14px; color: rgba(255,255,255,0.45); line-height: 1.7; font-weight: 300; }
        .moments-section { background: linear-gradient(180deg, var(--midnight) 0%, rgba(107,45,62,0.15) 50%, var(--midnight) 100%); position: relative; }
        .moments-section::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 60% 40% at 50% 50%, rgba(244,63,94,0.06) 0%, transparent 70%); pointer-events: none; }
        .moments-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; max-width: 900px; margin: 60px auto 0; }
        .moment-card { border-radius: 20px; padding: 28px 24px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); text-align: center; position: relative; overflow: hidden; transition: transform 0.3s; }
        .moment-card:hover { transform: translateY(-4px); }
        .moment-card::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; }
        .moment-credits { font-family: 'Fraunces', serif; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px; opacity: 0.6; }
        .moment-name { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 700; color: white; margin-bottom: 8px; }
        .moment-desc { font-size: 12px; color: rgba(255,255,255,0.4); line-height: 1.5; font-weight: 300; }
        .testimonials-section { text-align: center; }
        .testimonial-container { max-width: 640px; margin: 60px auto 0; position: relative; min-height: 220px; }
        .testimonial-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 28px; padding: 44px 48px; position: relative; }
        .testimonial-card::before { content: '"'; font-family: 'Fraunces', serif; font-size: 120px; color: rgba(244,63,94,0.1); position: absolute; top: -20px; left: 24px; line-height: 1; pointer-events: none; }
        .testimonial-text { font-family: 'Fraunces', serif; font-size: clamp(18px, 2.5vw, 24px); font-weight: 300; font-style: italic; color: rgba(255,255,255,0.85); line-height: 1.55; margin-bottom: 28px; position: relative; z-index: 1; }
        .testimonial-author { display: flex; align-items: center; justify-content: center; gap: 14px; }
        .author-avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--rose), var(--pink)); display: flex; align-items: center; justify-content: center; font-family: 'Fraunces', serif; font-weight: 700; font-size: 16px; flex-shrink: 0; }
        .author-name { font-weight: 600; font-size: 15px; color: white; }
        .author-sub { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 1px; }
        .author-match { font-size: 11px; color: var(--rose); font-weight: 600; letter-spacing: 0.05em; }
        .testimonial-dots { display: flex; justify-content: center; gap: 8px; margin-top: 28px; }
        .t-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.2); border: none; cursor: pointer; transition: background 0.3s, transform 0.3s; padding: 0; }
        .t-dot.active { background: var(--rose); transform: scale(1.3); }
        .appstore-section { text-align: center; background: linear-gradient(180deg, var(--midnight) 0%, rgba(107,45,62,0.2) 100%); position: relative; overflow: hidden; }
        .appstore-section::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 70% 50% at 50% 100%, rgba(244,63,94,0.12) 0%, transparent 70%); pointer-events: none; }
        .appstore-inner { position: relative; z-index: 1; max-width: 600px; margin: 0 auto; }
        .appstore-big-title { font-family: 'Fraunces', serif; font-size: clamp(44px, 7vw, 80px); font-weight: 900; line-height: 1.05; letter-spacing: -0.03em; color: white; margin-bottom: 24px; }
        .appstore-sub { font-size: 17px; color: rgba(255,255,255,0.45); line-height: 1.65; max-width: 420px; margin: 0 auto 48px; font-weight: 300; }
        .store-badges-large { display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; margin-bottom: 32px; }
        .store-badge-large { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 18px; padding: 16px 28px; text-decoration: none; color: white; transition: background 0.2s, transform 0.2s, box-shadow 0.2s; min-width: 180px; }
        .store-badge-large:hover { background: rgba(255,255,255,0.1); transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.3); }
        .store-icon { font-size: 28px; }
        .store-badge-large .store-badge-label { font-size: 10px; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.1em; }
        .store-badge-large .store-badge-name { font-size: 18px; font-weight: 700; font-family: 'Fraunces', serif; }
        .waitlist-note { font-size: 13px; color: rgba(255,255,255,0.3); letter-spacing: 0.05em; }
        footer { border-top: 1px solid rgba(255,255,255,0.06); padding: 48px 40px 32px; max-width: 1200px; margin: 0 auto; }
        .footer-inner { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 40px; margin-bottom: 48px; }
        .footer-brand p { font-size: 13px; color: rgba(255,255,255,0.3); margin-top: 12px; max-width: 260px; line-height: 1.6; font-weight: 300; }
        .footer-col h4 { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 16px; }
        .footer-col ul { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .footer-col a { font-size: 14px; color: rgba(255,255,255,0.5); text-decoration: none; transition: color 0.2s; font-weight: 300; }
        .footer-col a:hover { color: white; }
        .footer-bottom { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.05); }
        .footer-bottom p { font-size: 12px; color: rgba(255,255,255,0.25); font-weight: 300; }
        .social-links { display: flex; gap: 16px; }
        .social-link { width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.4); text-decoration: none; font-size: 13px; transition: background 0.2s, color 0.2s; }
        .social-link:hover { background: rgba(244,63,94,0.15); color: var(--rose); border-color: rgba(244,63,94,0.3); }
        @media (max-width: 768px) {
          nav { padding: 16px 20px; } .nav-links { display: none; }
          section { padding: 72px 20px; } footer { padding: 40px 20px 24px; }
          .footer-inner { gap: 32px; } .testimonial-card { padding: 32px 24px; }
          .phone-left, .phone-right { display: none; }
          .phone-center { left: 50%; transform: translateX(-50%); }
        }
      `}</style>

      <nav className={scrollY > 40 ? 'scrolled' : ''}>
        <a href="#" className="nav-logo"><HookIcon size={24} />Crotchet</a>
        <ul className="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#moments">Moments</a></li>
          <li><a href="#stories">Stories</a></li>
        </ul>
        <a href="/auth" className="btn-nav">Get started</a>
      </nav>

      <section className="hero" ref={heroRef}>
        <div className="hero-bg" />
        <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          {particles.map((p, i) => <ThreadParticle key={i} {...p} />)}
        </div>
        <div className="hero-inner">
          <div className="animate-fadeUp">
            <div className="hero-eyebrow">
              <span style={{ animation: 'heartBeat 2s ease-in-out infinite' }}>🧵</span>
              A new kind of connection
            </div>
          </div>
          <h1 className="hero-title animate-fadeUp delay-1">
            Stitch your
            <em className="rose-text">story.</em>
          </h1>
          <p className="hero-sub animate-fadeUp delay-2">
            Dating built for depth. Voice notes, intentional moments, and a feed that rewards authenticity over volume.
          </p>
          <div className="hero-ctas animate-fadeUp delay-3">
            <a href="/auth" className="btn-primary">✦ Start for free</a>
            <a href="#features" className="btn-secondary">See how it works</a>
          </div>
          <div className="store-badges animate-fadeUp delay-4">
            <a href="#" className="store-badge">
              <span style={{ fontSize: '22px' }}>🍎</span>
              <div><div className="store-badge-label">Download on the</div><div className="store-badge-name">App Store</div></div>
            </a>
            <a href="#" className="store-badge">
              <span style={{ fontSize: '22px' }}>▶</span>
              <div><div className="store-badge-label">Get it on</div><div className="store-badge-name">Google Play</div></div>
            </a>
          </div>
        </div>
      </section>

      <div style={{ background: 'var(--midnight)', padding: '0 24px 80px', overflow: 'hidden' }}>
        <div className="phones-wrapper">
          <div className="phone-card phone-left" style={{ width: 200 }}>
            <div className="phone-screen">
              <div className="phone-notch" />
              <div style={{ borderRadius: 20, background: 'linear-gradient(160deg, rgba(107,45,62,0.9) 0%, rgba(26,10,15,1) 100%)', aspectRatio: '3/4', display: 'flex', alignItems: 'flex-end', padding: 16, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(26,10,15,0.9) 100%)' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div className="phone-name">Amara, 27</div>
                  <div className="phone-tag">📍 Nairobi</div>
                </div>
              </div>
              <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(244,63,94,0.08)', borderRadius: 14, border: '1px solid rgba(244,63,94,0.15)' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>💬 A green flag for me is...</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Someone who reads for fun</div>
              </div>
            </div>
          </div>

          <div className="phone-card phone-center" style={{ width: 240 }}>
            <div className="phone-screen" style={{ background: 'rgba(26,10,15,0.98)' }}>
              <div className="phone-notch" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 700 }}>Discover</div>
                <div style={{ display: 'flex', gap: 6 }}>{['🔥','⚙️'].map(e => <span key={e} style={{ fontSize: 16 }}>{e}</span>)}</div>
              </div>
              <div style={{ borderRadius: 24, overflow: 'hidden', position: 'relative', background: 'linear-gradient(160deg, rgba(244,63,94,0.25) 0%, rgba(107,45,62,0.6) 40%, rgba(26,10,15,1) 100%)', aspectRatio: '3/4', display: 'flex', alignItems: 'flex-end', padding: 16 }}>
                <div style={{ position: 'absolute', top: 12, right: 12, background: 'linear-gradient(135deg, #f5d07a, #e8a020)', borderRadius: 100, padding: '4px 10px', fontSize: 10, fontWeight: 700, color: '#1a0a0f' }}>✦ GOLDEN THREAD</div>
                <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
                  <div style={{ fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 800 }}>Zara, 26</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>📍 2 km away</div>
                  <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center', gap: 12 }}>
                    {['✕','🧵','♥'].map((icon, i) => (
                      <div key={i} style={{ width: 40, height: 40, borderRadius: '50%', background: i === 1 ? 'linear-gradient(135deg,#f43f5e,#ec4899)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: i === 1 ? 18 : 16 }}>{icon}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="phone-card phone-right" style={{ width: 200 }}>
            <div className="phone-screen">
              <div className="phone-notch" />
              <div style={{ fontFamily: 'Fraunces, serif', fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Messages</div>
              {[
                { name: 'Kwame', msg: 'Loved your voice note 🎙️', time: '2m', unread: true },
                { name: 'Remi', msg: 'Are you free Saturday?', time: '1h', unread: false },
              ].map(m => (
                <div key={m.name} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #f43f5e, #ec4899)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fraunces, serif', fontWeight: 700, fontSize: 14 }}>{m.name[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{m.name}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.msg}</div>
                  </div>
                  <div style={{ fontSize: 9, color: m.unread ? 'var(--rose)' : 'rgba(255,255,255,0.3)', fontWeight: m.unread ? 700 : 400 }}>{m.time}</div>
                </div>
              ))}
              <div style={{ marginTop: 12, padding: '12px', background: 'rgba(244,63,94,0.08)', borderRadius: 14, border: '1px solid rgba(244,63,94,0.15)', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--rose)', fontWeight: 700, marginBottom: 2 }}>🧵 A new stitch.</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>You and Zara are connected.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section id="features" style={{ textAlign: 'center', background: 'var(--midnight)' }}>
        <StitchLine />
        <div style={{ marginTop: 60 }}>
          <span className="section-eyebrow">Built different</span>
          <h2 className="section-title">Dating that actually<br /><span className="gold-text">feels like something.</span></h2>
          <p className="section-sub" style={{ margin: '0 auto' }}>We replaced swipe fatigue with intentional tools. Every feature is designed to spark real conversation.</p>
        </div>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <div className="feature-title">{f.title}</div>
              <div className="feature-sub">{f.subtitle}</div>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="moments" className="moments-section" style={{ textAlign: 'center' }}>
        <StitchLine color="rgba(232,160,32,0.2)" />
        <div style={{ marginTop: 60 }}>
          <span className="section-eyebrow" style={{ color: 'var(--gold)' }}>Moments &amp; Boosts</span>
          <h2 className="section-title">Stand out when it<br /><span className="gold-text">matters most.</span></h2>
          <p className="section-sub" style={{ margin: '0 auto' }}>Premium tools that give you the edge — without the desperation. Spend credits on moments that create actual sparks.</p>
        </div>
        <div className="moments-grid">
          {moments.map((m, i) => (
            <div key={i} className="moment-card" style={{ '--glow': m.glow } as React.CSSProperties}>
              <style>{`.moment-card:nth-child(${i + 1})::after { background: linear-gradient(90deg, transparent, ${m.glow}, transparent); } .moment-card:nth-child(${i + 1}):hover { border-color: ${m.glow}33; box-shadow: 0 0 40px ${m.glow}15; }`}</style>
              <div className="moment-credits" style={{ color: m.glow }}>{m.credits} credits</div>
              <div className="moment-name">{m.name}</div>
              <p className="moment-desc">{m.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 40, fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Credits never expire · Starting from $4.99</div>
      </section>

      <section id="stories" className="testimonials-section">
        <StitchLine />
        <div style={{ marginTop: 60 }}>
          <span className="section-eyebrow">Real stories</span>
          <h2 className="section-title">The thread that<br /><span className="rose-text">connects them.</span></h2>
        </div>
        <div className="testimonial-container">
          <div className="testimonial-card" key={activeTestimonial} style={{ animation: 'slideIn 0.4s ease both' }}>
            <p className="testimonial-text">&ldquo;{testimonials[activeTestimonial].text}&rdquo;</p>
            <div className="testimonial-author">
              <div className="author-avatar">{testimonials[activeTestimonial].name[0]}</div>
              <div style={{ textAlign: 'left' }}>
                <div className="author-name">{testimonials[activeTestimonial].name}, {testimonials[activeTestimonial].age}</div>
                <div className="author-sub">{testimonials[activeTestimonial].city}</div>
                <div className="author-match">{testimonials[activeTestimonial].match}</div>
              </div>
            </div>
          </div>
          <div className="testimonial-dots">
            {testimonials.map((_, i) => (
              <button key={i} className={`t-dot ${i === activeTestimonial ? 'active' : ''}`} onClick={() => setActiveTestimonial(i)} />
            ))}
          </div>
        </div>
      </section>

      <section className="appstore-section">
        <div className="appstore-inner">
          <span className="section-eyebrow">Download</span>
          <h2 className="appstore-big-title">Your story<br />starts <em className="rose-text" style={{ fontFamily: 'Fraunces, serif' }}>now.</em></h2>
          <p className="appstore-sub">Join thousands already finding deeper connections. Free to start — no credit card required.</p>
          <div className="store-badges-large">
            <a href="#" className="store-badge-large">
              <span className="store-icon">🍎</span>
              <div><div className="store-badge-label">Download on the</div><div className="store-badge-name">App Store</div></div>
            </a>
            <a href="#" className="store-badge-large">
              <span className="store-icon">▶</span>
              <div><div className="store-badge-label">Get it on</div><div className="store-badge-name">Google Play</div></div>
            </a>
          </div>
          <div style={{ marginBottom: 24 }}>
            <a href="/auth" className="btn-primary" style={{ display: 'inline-flex' }}>✦ Or sign up on web</a>
          </div>
          <p className="waitlist-note">Coming soon to iOS &amp; Android · Web available now</p>
        </div>
      </section>

      <div style={{ background: 'var(--midnight)' }}>
        <footer>
          <div className="footer-inner">
            <div className="footer-brand">
              <div className="nav-logo" style={{ display: 'inline-flex' }}><HookIcon size={22} />Crotchet</div>
              <p>Dating built for people who want something real. Stitch your story.</p>
            </div>
            <div className="footer-col">
              <h4>Product</h4>
              <ul><li><a href="#features">Features</a></li><li><a href="#moments">Moments</a></li><li><a href="/auth">Sign up</a></li></ul>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <ul><li><a href="/about">About</a></li><li><a href="/blog">Blog</a></li><li><a href="/contact">Contact</a></li></ul>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <ul><li><a href="/privacy">Privacy Policy</a></li><li><a href="/terms">Terms of Service</a></li></ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 Crotchet. All rights reserved.</p>
            <div className="social-links">
              {['𝕏', 'IG', 'TT', 'YT'].map(s => <a key={s} href="#" className="social-link">{s}</a>)}
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
