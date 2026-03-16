import { create } from 'zustand';
import type { CaptureAnalysis, CallRecord } from '../types';

interface CaptureStore {
  analysis: CaptureAnalysis | null;
  selectedCall: CallRecord | null;
  isLoading: boolean;
  error: string | null;
  setAnalysis: (a: CaptureAnalysis) => void;
  selectCall: (c: CallRecord | null) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  reset: () => void;
}

export const useCaptureStore = create<CaptureStore>((set) => ({
  analysis: null,
  selectedCall: null,
  isLoading: false,
  error: null,
  setAnalysis: (analysis) => set({ analysis, error: null, isLoading: false }),
  selectCall: (selectedCall) => set({ selectedCall }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  reset: () => set({ analysis: null, selectedCall: null, error: null }),
}));
