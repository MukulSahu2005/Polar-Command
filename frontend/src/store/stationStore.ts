import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StationState {
  selectedStationId: string;
  setSelectedStation: (id: string) => void;
}

export const useStationStore = create<StationState>()(
  persist(
    (set) => ({
      selectedStationId: 'maitri',
      setSelectedStation: (id) => set({ selectedStationId: id }),
    }),
    { name: 'polar-station' }
  )
);
