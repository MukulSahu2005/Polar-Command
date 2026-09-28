import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MaintenanceTicket } from '@/types';

interface DemoState {
  gen2Isolated: boolean;
  gen2Throttled: boolean;
  gen3Online: boolean;
  gen3OutputKw: number;
  ecoModeActive: boolean;
  acknowledgedAlerts: Set<string>;
  tickets: MaintenanceTicket[];
  audioMuted: boolean;
  reorderRequested: boolean;
  deicingActive: boolean;
  loadTransferred: boolean;
}

interface UiState {
  sidebarCollapsed: boolean;
  selectedAssetId: string | null;
  assetPanelOpen: boolean;
  audioMuted: boolean;
  theme: 'light' | 'dark';
  demoState: DemoState;
  setSidebarCollapsed: (v: boolean) => void;
  setSelectedAsset: (id: string | null) => void;
  setAssetPanelOpen: (v: boolean) => void;
  setAudioMuted: (v: boolean) => void;
  // Demo actions
  isolateGen2: () => void;
  restoreGen2: () => void;
  throttleGen2: () => void;
  spinUpGen3: () => void;
  spinDownGen3: () => void;
  activateEcoMode: () => void;
  acknowledgeAlert: (id: string) => void;
  createTicket: (assetId: string, title: string, stationId: string) => MaintenanceTicket;
  requestReorder: () => void;
  activateDeicing: () => void;
  transferLoad: () => void;
  resetDemoState: () => void;
}

const defaultDemoState: DemoState = {
  gen2Isolated: false,
  gen2Throttled: false,
  gen3Online: false,
  gen3OutputKw: 0,
  ecoModeActive: false,
  acknowledgedAlerts: new Set(),
  tickets: [],
  audioMuted: false,
  reorderRequested: false,
  deicingActive: false,
  loadTransferred: false,
};

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      selectedAssetId: null,
      assetPanelOpen: false,
      audioMuted: false,
      theme: 'light',
      demoState: defaultDemoState,

      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setSelectedAsset: (id) => set({ selectedAssetId: id, assetPanelOpen: id !== null }),
      setAssetPanelOpen: (v) => set({ assetPanelOpen: v }),
      setAudioMuted: (v) => set((s) => ({ demoState: { ...s.demoState, audioMuted: v }, audioMuted: v })),

      isolateGen2: () => set((s) => ({
        demoState: { ...s.demoState, gen2Isolated: true },
      })),

      restoreGen2: () => set((s) => ({
        demoState: { ...s.demoState, gen2Isolated: false, gen2Throttled: false },
      })),

      throttleGen2: () => set((s) => ({
        demoState: { ...s.demoState, gen2Throttled: true },
      })),

      spinUpGen3: () => set((s) => ({
        demoState: { ...s.demoState, gen3Online: true, gen3OutputKw: 210 },
      })),

      spinDownGen3: () => set((s) => ({
        demoState: { ...s.demoState, gen3Online: false, gen3OutputKw: 0 },
      })),

      activateEcoMode: () => set((s) => ({
        demoState: { ...s.demoState, ecoModeActive: true },
      })),

      acknowledgeAlert: (id) => set((s) => {
        const newSet = new Set(s.demoState.acknowledgedAlerts);
        newSet.add(id);
        return { demoState: { ...s.demoState, acknowledgedAlerts: newSet } };
      }),

      createTicket: (assetId, title, stationId) => {
        const ticket: MaintenanceTicket = {
          id: `MAINT-TICKET #${Math.floor(Math.random() * 9000) + 1000}`,
          stationId,
          assetId,
          title,
          status: 'open',
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          demoState: { ...s.demoState, tickets: [...s.demoState.tickets, ticket] },
        }));
        return ticket;
      },

      requestReorder: () => set((s) => ({
        demoState: { ...s.demoState, reorderRequested: true },
      })),

      activateDeicing: () => set((s) => ({
        demoState: { ...s.demoState, deicingActive: true },
      })),

      transferLoad: () => set((s) => ({
        demoState: { ...s.demoState, loadTransferred: true, gen3Online: true, gen3OutputKw: 210 },
      })),

      resetDemoState: () => set({ demoState: defaultDemoState }),
    }),
    {
      name: 'polar-ui',
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        audioMuted: s.audioMuted,
        theme: s.theme,
        // Don't persist demo state between sessions
      }),
    }
  )
);
