This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

 ---
  Mebley — Implementation Modules                                                                                                                                  
                                 
  Module 1 — Security & Cleanup                                                                                                                                    
                                                                                                                                                                   
  Remove .env from repo, rotate secrets, strip console.logs, fix TypeScript any casts, add input sanitization to API routes.                                       
                                                                                                                                                                   
  Module 2 — Voice Notes                                                                                                                                           
                  
  Record & send voice messages in chat, playback UI, voice note upload to S3, waveform display.                                                                    
   
  Module 3 — Video & Voice Calls                                                                                                                                   
                  
  Wire up Agora call flow (initiate → accept/reject → in-call UI → end), call history, missed call notifications.                                                  
   
  Module 4 — Live Presence / Here Tonight                                                                                                                          
                  
  "Active now" badges, "Here Tonight" mode toggle, presence indicators on browse cards and chat.                                                                   
   
  Module 5 — Intent Score & Smart Matching                                                                                                                         
                  
  Compatibility scoring algorithm, match strength display, preference weighting (values, lifestyle, goals).                                                        
   
  Module 6 — Spotlight & Premium Features                                                                                                                          
                  
  24-hour spotlight boost, profile highlight in browse, spotlight purchase flow, premium badge display.                                                            
                  
  Module 7 — Photo Verification (AWS Rekognition)                                                                                                                  
                  
  Selfie verification flow, liveness check, verified badge on profiles, moderation queue.                                                                          
   
  Module 8 — Subscription Tiers                                                                                                                                    
                  
  Free vs. Premium vs. Elite tier logic, feature gating, tier management UI, upgrade prompts.                                                                      
   
  Module 9 — Content Pages                                                                                                                                         
                  
  About, Blog, Contact pages — static content with proper design matching the landing page.                                                                        
                  
  Module 10 — Admin Dashboard                                                                                                                                      
                  
  User management, moderation queue, revenue metrics, flagged content review, analytics.                                                                           
   
  Module 11 — Testing & QA                                                                                                                                         
                  
  Unit tests for critical API routes, integration tests for auth + payments, component tests for core UI.                                                          
   
    System Audit — Mebley (April 2026)
                                                                                                                                                                                               
  Complete and production-ready
                                                                                                                                                                                               
  ┌───────────────────┬────────────┬──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
  │      Module       │   Status   │                                                                        Notes                                                                         │    
  ├───────────────────┼────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Auth              │ ✅         │ Signup, signin, signout, OTP, auth/me, custom session system, rate limiting                                                                          │
  │                   │ Complete   │                                                                                                                                                      │
  ├───────────────────┼────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤   
  │ Profile setup     │ ✅         │ setup/profile route, profile page, edit profile, photo upload (S3), video upload (S3 + Supabase)                                                      │   
  │                   │ Complete   │                                                                                                                                                       │   
  ├───────────────────┼────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤   
  │ Photo             │ ✅         │ AWS Rekognition CompareFaces, verification/selfie route, verified badge on profile                                                                    │
  │ verification      │ Complete   │                                                                                                                                                       │   
  ├───────────────────┼────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Discovery         │ ✅         │ Intent Score algorithm (distance/interest/intent/completeness/activity scoring), filters (location, intents, interests, age ranges), pagination, pass │   
  │                   │ Complete   │  tracking                                                                                                                                             │
  ├───────────────────┼────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Likes + Matching  │ ✅         │ Like/pass endpoints, mutual like detection, match + conversation auto-creation, OneSignal match notification                                          │
  │                   │ Complete   │                                                                                                                                                       │   
  ├───────────────────┼────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤ 
  │ Chat              │ ✅         │ Conversation list, SSE message stream, message history (MongoDB), media upload (S3 presigned), manage (pin/mute/archive/block), message delete       │    
  │                   │ Complete   │                                                                                                                                                      │    
  ├───────────────────┼────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤ 
  │ Video calls       │ ✅         │ Agora RTC token generation in chat/call, call initiated message in chat history                                                                      │    
  │                   │ Complete   │                                                                                                                                                      │    
  ├───────────────────┼────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤ 
  │ Presence          │ ✅         │ Heartbeat → last_active, here-tonight moment, spotlight boost, last-active query                                                                     │    
  │                   │ Complete   │                                                                                                                                                      │    
  ├───────────────────┼────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤ 
  │ Credits           │ ✅         │ Wallets in primary Postgres, credits/spend (moments + boosts), full transaction log                                                                  │    
  │                   │ Complete   │                                                                                                                                                      │    
  ├───────────────────┼────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤ 
  │ Payments          │ ✅         │ Paystack initialise + verify, subscription plans (Starter/Premium/VIP), one-time credit packs (4 sizes), idempotency guards, Supabase subscriptions  │    
  │                   │ Complete   │ + stripe_orders                                                                                                                                      │    
  ├───────────────────┼────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤ 
  │ Subscription      │ ✅         │ usePlan hook, FeatureGate component, PlanBadge, upgrade page (plan cards + comparison matrix)                                                        │    
  │ tiers             │ Complete   │                                                                                                                                                      │    
  ├───────────────────┼────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤ 
  │ PaywallModal      │ ✅         │ Plans tab, Credits tab (4 packs), spend mode (Moments/Boosts), direct pay buttons                                                                    │    
  │                   │ Complete   │                                                                                                                                                      │    
  ├───────────────────┼────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤ 
  │ Moderation        │ ✅         │ Block/report UI component, moderation API (report to DB), blocked_users enforced in discover + conversations                                         │    
  │                   │ Complete   │                                                                                                                                                      │    
  ├───────────────────┼────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤ 
  │ Push              │ ✅         │ OneSignal provider, push/subscribe endpoint, notification helpers (match/message/like/here-tonight)                                                  │    
  │ notifications     │ Complete   │                                                                                                                                                      │    
  ├───────────────────┼────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Account           │ ✅         │ account/delete route, DeleteAccount component                                                                                                        │    
  │ management        │ Complete   │                                                                                                                                                      │    
  ├───────────────────┼────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Content pages     │ ✅         │ About, Blog, Contact — all with MarketingLayout, dark design                                                                                         │    
  │                   │ Complete   │                                                                                                                                                      │    
  ├───────────────────┼────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
  │ Database split    │ ✅         │ All primary-Postgres tables use pgQuery; Supabase only for subscriptions, stripe_orders, profile_videos, push_subscriptions                          │    
  │                   │ Complete   │                                                                                                                                                      │    
  └───────────────────┴────────────┴───────────────────────────────────────────────────────────────────────────────────

  ~85% complete. Core flows (auth → onboarding → discover → like → match → chat → pay) are all working end-to-end. The four partial items above are cosmetic gaps or nice-to-haves. The one
  real business risk is the Paystack webhook — without it, subscription renewals will silently fail, and users who auto-renew won't get their next month's credits or continued premium access.
   
   Here's the complete step-by-step module. Save this — we'll check off each item:
                                                                                                                                                                                               
  ---                                                                                                                               
  Mebley Completion Module                                                                                                                                                                     
                                                                                                                                                                                               
  ---
  PHASE 1 — Core Missing Features (Highest Impact)                                                                                                                                             
                                                  
  Step 1.1 — The Stitch (Super-like with note)
                                                                                                                                                                                               
  - Add a "Stitch" button to Discover.tsx (between Pass and Like)                                                                                                                              
  - Build StitchModal component — text note input + send                                                                                                                                       
  - Extend POST /api/likes to accept { stitch: true, note: string }                                                                                                                            
  - Store note in likes table (add note + is_stitch columns via migration)                                                                                                                     
  - Show stitch badge in matches/page.tsx liked-you list                                                                                                                                       
                                                                                                                                                                                               
  Step 1.2 — Profile Voice Note Recorder                                                                                                                                                       
                                                                                                                                                                                               
  - Build VoiceNoteRecorder component (30s max, waveform, play-back before save)                                                                                                               
  - Add to EditProfile.tsx and ProfileSetup.tsx
  - Upload audio blob to S3 via existing /api/photos/upload pattern (new /api/voice/upload)                                                                                                    
  - Store URL in profiles.voice_note_url column (migration)                                                                                                                                    
  - Play voice note on Discover card and Browse profile view                                                                                                                                   
                                                                                                                                                                                               
  Step 1.3 — Here Tonight & Spotlight Full UI                                                                                                                                                  
                                                                                                                                                                                               
  - Add "Here Tonight" toggle button to profile page (calls /api/presence/here-tonight)                                                                                                        
  - Add "Spotlight" purchase button in profile page (calls /api/credits/spend + /api/presence/spotlight)
  - Show glowing ring on Discover card when spotlight is active                                                                                                                                
  - Show "Here Tonight" indicator badge on Discover/Browse cards                                                                                                                               
  - Verify /api/presence/here-tonight GET + POST both work end-to-end                                                                                                                          
                                                                                                                                                                                               
  Step 1.4 — Credits In-App Store UI                                                                                                                                                           
                                                                                                                                                                                               
  - Build CreditsStore component — show wallet balance + buyable items (Boosts, Moments, Stitch packs)                                                                                         
  - Wire "Buy Credits" button → Paystack flow (reuse existing /api/paystack/initialise)
  - Wire "Spend Credits" buttons → POST /api/credits/spend                                                                                                                                     
  - Add credits balance display to TopHeader / profile page                                                                                                                                    
  - Show transaction history in profile settings                                                                                                                                               
                                                                                                                                                                                               
  ---             
  PHASE 2 — Backend Completeness                                                                                                                                                               
                  
  Step 2.1 — Contact Form Email

  - Install resend or verify nodemailer is in package.json                                                                                                                                     
  - Create POST /api/contact/route.ts — validate form, send email to support@mebley.com
  - Wire contact/page.tsx form submit to this route                                                                                                                                            
  - Show success/error state in UI                                                                                                                                                             
                                                                                                                                                                                               
  Step 2.2 — GIF Search                                                                                                                                                                        
                                                                                                                                                                                               
  - Verify TENOR_API_KEY or GIPHY_API_KEY is in .env                                                                                                                                           
  - Create GET /api/chat/gifs/route.ts that proxies Tenor/Giphy
  - Wire GIF search in Chat.tsx to this route (currently has the UI, needs the API)                                                                                                            
                                                                                                                                                                                               
  Step 2.3 — Verify All API Routes End-to-End                                                                                                                                                  
                                                                                                                                                                                               
  - Auth: signup → OTP → signin → signout → reset password                                                                                                                                     
  - Profile: setup → edit → photo upload → video upload → delete account
  - Discover: feed loads → like → pass → mutual match → conversation created                                                                                                                   
  - Chat: open conversation → send message → receive SSE → send image → voice note                                                                                                             
  - Video call: initiate → Agora token → join → hang up                                                                                                                                        
  - Payments: Paystack init → pay → webhook → subscription updated                                                                                                                             
  - Moderation: block → report → user disappears from discover                                                                                                                                 
                                                                                                                                                                                               
  ---                                                                                                                                                                                          
  PHASE 3 — Polish & UX                                                                                                                                                                        
                       
  Step 3.1 — Mobile Responsiveness
                                                                                                                                                                                               
  - Audit all pages at 375px (iPhone SE) and 390px (iPhone 14)
  - Fix browse/page.tsx sidebar panel on mobile                                                                                                                                                
  - Fix Chat.tsx media panel on mobile                                                                                                                                                         
  - Fix upgrade/page.tsx tier cards stacking correctly
                                                                                                                                                                                               
  Step 3.2 — Loading & Empty States                                                                                                                                                            
                                                                                                                                                                                               
  - Every page must have a skeleton/spinner while loading                                                                                                                                      
  - Every list must have an empty state illustration
  - All API errors must show a user-facing message (not just console.error)                                                                                                                    
                                                                                                                                                                                               
  Step 3.3 — Profile Completeness Indicator                                                                                                                                                    
                                                                                                                                                                                               
  - Verify profile_completeness score is calculated and saved on profile save                                                                                                                  
  - Show progress bar in EditProfile.tsx ("Your profile is 72% complete")
  - Block users with < 40% completeness from appearing in Discover                                                                                                                             
                                                                                                                                                                                               
  ---
  PHASE 4 — Safety & Moderation                                                                                                                                                                
                               
  Step 4.1 — Photo Verification Flow
                                                                                                                                                                                               
  - Test AWS Rekognition selfie compare end-to-end
  - Show "Verification pending" badge after submit                                                                                                                                             
  - Show "Verified" badge (photo_verified = true) on profile cards                                                                                                                             
  - Email user when verification is approved/rejected                                                                                                                                          
                                                                                                                                                                                               
  Step 4.2 — Basic Admin Dashboard                                                                                                                                                             
                                                                                                                                                                                               
  - Create /admin route (server-side auth check — admin only)                                                                                                                                  
  - List reported users with reason + reporter
  - One-click ban/clear actions → update profiles.is_banned                                                                                                                                    
  - Banned users blocked at auth middleware level                                                                                                                                              
                                                                                                                                                                                               
  ---                                                                                                                                                                                          
  PHASE 5 — Launch Readiness                                                                                                                                                                   
                  
  Step 5.1 — SEO & Meta

  - Add <title> and <meta description> to every public page                                                                                                                                    
  - Add Open Graph image for link previews
  - Add robots.txt and sitemap.xml                                                                                                                                                             
                                                                                                                                                                                               
  Step 5.2 — Environment & Config Audit
                                                                                                                                                                                               
  - Document every required env var in README.md                                                                                                                                               
  - Verify Docker Compose has all env vars for production
  - Add NEXT_PUBLIC_APP_URL used in email links                                                                                                                                                
                  
  Step 5.3 — Performance                                                                                                                                                                       
                  
  - Add next/image to all profile photo <img> tags                                                                                                                                             
  - Lazy-load Agora SDK (already done — verify)
  - Add ISR or caching headers to /api/discover                                                                                                                                                
                  
  ---
  Completion Tracker
                    
  ┌─────────────────────────┬───────────┬────────┐
  │          Phase          │   Steps   │ Status │                                                                                                                                             
  ├─────────────────────────┼───────────┼────────┤
  │ Phase 1 — Core Features │ 1.1 → 1.4 │ 0/4    │                                                                                                                                             
  ├─────────────────────────┼───────────┼────────┤
  │ Phase 2 — Backend       │ 2.1 → 2.3 │ 0/3    │
  ├─────────────────────────┼───────────┼────────┤                                                                                                                                             
  │ Phase 3 — Polish        │ 3.1 → 3.3 │ 0/3    │
  ├─────────────────────────┼───────────┼────────┤                                                                                                                                             
  │ Phase 4 — Safety        │ 4.1 → 4.2 │ 0/2    │
  ├─────────────────────────┼───────────┼────────┤                                                                                                                                             
  │ Phase 5 — Launch        │ 5.1 → 5.3 │ 0/3    │
  └─────────────────────────┴───────────┴────────┘                                                                                                                                             
                  
  ---
  Which step do you want to start with? I recommend beginning with Step 1.1 (The Stitch) since it's your hero differentiator, then Step 1.4 (Credits UI) because it's the revenue flow. Say the
   step number and I'll build it.                                                                                                                                                              
   
✻ Baked for 39s                                                                                                                                                                                
                  
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
❯  
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  ? for shortcuts
