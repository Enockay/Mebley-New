// src/hooks/usePaywall.ts
import { create } from 'zustand'

type Trigger = 'stitch_limit' | 'spotlight' | 'golden_thread' | 'vip_feature' | 'general'

interface PaywallStore {
  open:         boolean
  trigger:      Trigger
  openPaywall:  (trigger?: Trigger) => void
  closePaywall: () => void
}

export const usePaywall = create<PaywallStore>((set: (state: Partial<PaywallStore>) => void) => ({
  open:         false,
  trigger:      'general',
  openPaywall:  (trigger: Trigger = 'general') => set({ open: true, trigger }),
  closePaywall: ()                     => set({ open: false }),
}))
