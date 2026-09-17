export interface Recipe {
  id: string;
  title: string;
  sourceUrl?: string;
  isInstagramEmbed?: boolean;
  imageUrl?: string;
  categories: string[];
  baseServings: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  ingredients: string[];
  steps: string[];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  isFavorite?: boolean;
  manualIngredientOverrides?: Record<number, string>; // index -> override text
}

export interface ScaledIngredient {
  originalText: string;
  scaledText: string;
  cleanScaledText: string;
  originalQuantity?: number;
  scaledQuantity?: number;
  isScaled: boolean;
  isOverridden: boolean;
  unitAndRest?: string;
  numberDisplay?: string;
}

export type StoragePersistenceStatus = 'persisted' | 'prompt' | 'unsupported' | 'denied';
