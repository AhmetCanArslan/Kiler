import { create } from 'zustand';

interface SharedData {
  type: 'photo' | 'link' | 'text' | null;
  data: any;
  skipCopy?: boolean;
}

interface SharedDataState {
  sharedData: SharedData | null;
  setSharedData: (data: SharedData | null) => void;
  clearSharedData: () => void;
}

export const useSharedDataStore = create<SharedDataState>((set) => ({
  sharedData: null,
  setSharedData: (data) => set({ sharedData: data }),
  clearSharedData: () => set({ sharedData: null }),
}));