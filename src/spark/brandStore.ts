import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BrandProfile {
  brandName: string;
  industry: string;
  targetAudience: string;
  toneKeywords: string[];
  differentiators: string[];
  businessContext: string;
  websiteUrl?: string;
  websiteExtract?: string;
  setupCompleted: boolean;
  updatedAt: string;
}

interface BrandStoreState {
  brand: BrandProfile | null;
  setBrand: (brand: BrandProfile) => void;
  updateBrand: (updates: Partial<BrandProfile>) => void;
  isSetupCompleted: () => boolean;
}

export const useBrandStore = create<BrandStoreState>()(
  persist(
    (set, get) => ({
      brand: null,

      setBrand: (brand: BrandProfile) => set({ brand }),

      updateBrand: (updates: Partial<BrandProfile>) => {
        const current = get().brand;
        if (!current) return;
        set({ brand: { ...current, ...updates, updatedAt: new Date().toISOString() } });
      },

      isSetupCompleted: () => {
        return get().brand?.setupCompleted === true;
      },
    }),
    {
      name: 'spark_geo_brand',
    },
  ),
);
