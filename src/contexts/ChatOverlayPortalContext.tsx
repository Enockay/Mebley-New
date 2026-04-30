'use client'

import { createContext } from 'react'

/** When Chat runs inside Browse’s drawer, modals portal here so they stay in the chat column (not clipped / not full-screen over the whole app). */
export const ChatOverlayPortalContext = createContext<HTMLElement | null>(null)
