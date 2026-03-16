// src/hooks/usePaywall.ts
import { create } from 'zustand'

type Trigger = 'spotlight' | 'golden_thread' | 'vip_feature' | 'general'
type Tab        = 'plans' | 'credits' | 'moments' | 'boosts'

interface PaywallStore {
  open:         boolean
  trigger:      Trigger
  defaultTab:   Tab
  openPaywall:  (trigger?: Trigger, tab?: Tab) => void
  closePaywall: () => void
}

export const usePaywall = create<PaywallStore>((set) => ({
  open:         false,
  trigger:      'general',
  defaultTab:   'plans',
  openPaywall:  (trigger: Trigger = 'general', tab: Tab = 'plans') =>
    set({ open: true, trigger, defaultTab: tab }),
  closePaywall: () => set({ open: false }),
}))