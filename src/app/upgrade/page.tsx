'use client'
import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

function UpgradeContent() {
  const params  = useSearchParams()
  const router  = useRouter()
  const { refreshProfile } = useAuth()
  const success = params.get('success') === '1'
  const type    = params.get('type')
  const errMsg  = params.get('error')

  useEffect(() => {
    if (success) {
      refreshProfile()
      const t = setTimeout(() => router.replace('/browse'), 3000)
      return () => clearTimeout(t)
    }
  }, [success])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0f0409',
      color: '#fff', fontFamily: "'DM Sans', sans-serif",
      textAlign: 'center', padding: 24,
    }}>
      {success ? (
        <div>
          <div style={{ fontSize: 72, marginBottom: 20 }}>
            {type === 'credits' ? '🪙' : '🎉'}
          </div>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 32, fontWeight: 700, marginBottom: 10, color: '#fff' }}>
            {type === 'credits' ? 'Credits added!' : "You're upgraded!"}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, lineHeight: 1.6 }}>
            {type === 'credits'
              ? 'Your credits are now in your wallet. Go spend them!'
              : 'Your plan is now active. Welcome to the next level.'}
            <br />
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Redirecting in 3 seconds…</span>
          </p>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 72, marginBottom: 20 }}>❌</div>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 28, fontWeight: 700, marginBottom: 10 }}>
            Payment failed
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>
            {errMsg === 'payment_failed'    && 'Your payment was not completed.'}
            {errMsg === 'fulfillment_failed' && 'Payment received but activation failed — contact support.'}
            {errMsg === 'server_error'      && 'A server error occurred. Please try again.'}
            {!errMsg                         && 'Something went wrong. You were not charged.'}
          </p>
          <button
            onClick={() => router.replace('/browse')}
            style={{ background: 'linear-gradient(135deg,#f43f5e,#ec4899)', border: 'none', borderRadius: 100, padding: '13px 32px', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            Back to app
          </button>
        </div>
      )}
    </div>
  )
}

export default function UpgradePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0409' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2.5px solid rgba(244,63,94,0.2)', borderTopColor: '#f43f5e', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <UpgradeContent />
    </Suspense>
  )
}