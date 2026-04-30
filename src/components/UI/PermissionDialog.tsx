'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { XCircle, Video, Mic } from 'lucide-react';
import { useMediaPermissions } from '@/hooks/useMediaPermissions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PermissionDialogProps {
  type: 'camera-mic' | 'mic-only';
  onGranted: () => void;
  onCancel: () => void;
  onDenied?: () => void;
}

type PanelState = 'checking' | 'prompt' | 'denied' | 'hidden';

// ---------------------------------------------------------------------------
// Browser detection
// ---------------------------------------------------------------------------

function detectBrowser(): 'chrome' | 'firefox' | 'safari' | 'ios-safari' | 'edge' | 'other' {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;

  // iOS Safari must come before generic Safari check
  if (/iP(hone|ad|od)/.test(ua) && /WebKit/.test(ua) && !/CriOS/.test(ua) && !/FxiOS/.test(ua)) {
    return 'ios-safari';
  }
  if (/Edg\//.test(ua)) return 'edge';
  if (/Chrome\//.test(ua)) return 'chrome';
  if (/Firefox\//.test(ua)) return 'firefox';
  if (/Safari\//.test(ua)) return 'safari';
  return 'other';
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DeniedInstructions({ type, browser }: { type: PermissionDialogProps['type']; browser: ReturnType<typeof detectBrowser> }) {
  const deviceLabel = type === 'mic-only' ? 'Microphone' : 'Camera & Microphone';

  const instructionMap: Record<ReturnType<typeof detectBrowser>, string> = {
    chrome:
      'Click the 🔒 lock icon in the address bar → Site settings → Reset permissions, then reload the page.',
    edge: 'Click the 🔒 lock icon in the address bar → Site settings → Reset permissions, then reload the page.',
    firefox: 'Click the 🔒 lock icon in the address bar → Clear permission, then reload the page.',
    safari: `Open System Settings → Privacy & Security → ${type === 'mic-only' ? 'Microphone' : 'Camera / Microphone'} and allow this site.`,
    'ios-safari': `Go to Settings → Safari → ${type === 'mic-only' ? 'Microphone' : 'Camera / Microphone'} → Ask, then reload this page.`,
    other: `Check your browser settings and make sure this site has permission to access your ${deviceLabel.toLowerCase()}.`,
  };

  return (
    <p style={{ color: 'rgba(240,232,244,0.6)', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
      {instructionMap[browser]}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PermissionDialog({ type, onGranted, onCancel, onDenied }: PermissionDialogProps) {
  const { camera, mic, checking } = useMediaPermissions();
  const [panel, setPanel] = useState<PanelState>('checking');
  const browser = detectBrowser();

  // Derive panel state once the permission check completes
  useEffect(() => {
    if (checking) {
      setPanel('checking');
      return;
    }

    const cameraGranted = type === 'mic-only' || camera === 'granted';
    const micGranted = mic === 'granted';

    if (cameraGranted && micGranted) {
      // Both already granted — surface immediately without showing the dialog
      onGranted();
      setPanel('hidden');
      return;
    }

    const cameraDenied = type === 'camera-mic' && camera === 'denied';
    const micDenied = mic === 'denied';

    if (cameraDenied || micDenied) {
      setPanel('denied');
      onDenied?.();
      return;
    }

    setPanel('prompt');
  }, [checking, camera, mic, type, onGranted, onDenied]);

  // Escape key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    },
    [onCancel],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Request actual media access
  const handleAllowAccess = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({
        video: type === 'camera-mic',
        audio: true,
      });
      onGranted();
    } catch {
      setPanel('denied');
      onDenied?.();
    }
  }, [type, onGranted, onDenied]);

  // Don't render if hidden or still silently granting
  if (panel === 'hidden') return null;

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------

  const overlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(8,6,20,0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    padding: 24,
  };

  const card: React.CSSProperties = {
    background: 'rgba(8,6,20,0.97)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 18,
    boxShadow: '0 32px 64px rgba(0,0,0,0.7)',
    padding: '40px 36px',
    maxWidth: 420,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
    color: '#f0e8f4',
    fontFamily: 'inherit',
  };

  const title: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 700,
    color: '#f0e8f4',
    margin: 0,
    textAlign: 'center',
    lineHeight: 1.3,
  };

  const body: React.CSSProperties = {
    fontSize: 14,
    color: 'rgba(240,232,244,0.65)',
    textAlign: 'center',
    lineHeight: 1.6,
    margin: 0,
  };

  const primaryBtn: React.CSSProperties = {
    width: '100%',
    padding: '13px 0',
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #f03868 0%, #c0184a 100%)',
    boxShadow: '0 4px 20px rgba(240,56,104,0.35)',
    transition: 'opacity 0.15s',
    letterSpacing: 0.3,
  };

  const ghostBtn: React.CSSProperties = {
    width: '100%',
    padding: '12px 0',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.12)',
    cursor: 'pointer',
    fontSize: 15,
    fontWeight: 500,
    color: 'rgba(240,232,244,0.7)',
    background: 'transparent',
    transition: 'background 0.15s',
    letterSpacing: 0.2,
  };

  const iconCircle: React.CSSProperties = {
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(240,56,104,0.25) 0%, rgba(192,24,74,0.15) 100%)',
    border: '1px solid rgba(240,56,104,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexShrink: 0,
  };

  const deniedIconWrap: React.CSSProperties = {
    width: 72,
    height: 72,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  const instructionsBox: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: '14px 16px',
    width: '100%',
    boxSizing: 'border-box',
  };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (panel === 'checking') {
    return (
      <div style={overlay} role="dialog" aria-modal="true" aria-label="Checking permissions">
        <div style={card}>
          <div style={{ ...iconCircle, animation: 'pulse 1.5s ease-in-out infinite' }}>
            {type === 'camera-mic' && <Video size={22} color="#f03868" />}
            <Mic size={22} color="#f03868" />
          </div>
          <p style={{ ...body, fontSize: 15 }}>Checking permissions…</p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Denied panel
  // ---------------------------------------------------------------------------

  if (panel === 'denied') {
    const titleText = type === 'mic-only' ? 'Microphone Blocked' : 'Camera & Microphone Blocked';

    return (
      <div style={overlay} role="dialog" aria-modal="true" aria-label={titleText}>
        <div style={card}>
          <div style={deniedIconWrap}>
            <XCircle size={56} color="#f03868" strokeWidth={1.5} />
          </div>

          <h2 style={title}>{titleText}</h2>

          <p style={body}>
            You previously blocked access to your{' '}
            {type === 'mic-only' ? 'microphone' : 'camera and microphone'}. To use this feature,
            you need to restore the permission in your browser settings.
          </p>

          <div style={instructionsBox}>
            <p style={{ color: 'rgba(240,232,244,0.45)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>
              How to fix
            </p>
            <DeniedInstructions type={type} browser={browser} />
          </div>

          <button
            style={ghostBtn}
            onClick={onCancel}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Prompt / unknown panel
  // ---------------------------------------------------------------------------

  const titleText = type === 'mic-only' ? 'Allow Microphone' : 'Allow Camera & Microphone';
  const bodyText =
    type === 'mic-only'
      ? 'To start this call, Mebley needs access to your microphone. You\'ll see a browser prompt asking for permission.'
      : 'To start a video call, Mebley needs access to your camera and microphone. You\'ll see a browser prompt asking for permission.';

  return (
    <div style={overlay} role="dialog" aria-modal="true" aria-label={titleText}>
      <div style={card}>
        <div style={iconCircle}>
          {type === 'camera-mic' && <Video size={24} color="#f03868" />}
          <Mic size={24} color="#f03868" />
        </div>

        <h2 style={title}>{titleText}</h2>

        <p style={body}>{bodyText}</p>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          <button
            style={primaryBtn}
            onClick={handleAllowAccess}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            Allow Access
          </button>

          <button
            style={ghostBtn}
            onClick={onCancel}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default PermissionDialog;
