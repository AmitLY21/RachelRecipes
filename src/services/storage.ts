import type { Recipe, StoragePersistenceStatus } from '../types/recipe.ts';

const DB_NAME = 'RachelRecipesDB';
const DB_VERSION = 1;
const STORE_NAME = 'recipes';
const LOCALSTORAGE_BACKUP_KEY = 'rachel_recipes_data';

// Hardcoded seed IDs to clean up from any previous installs
export const HARDCODED_SEED_IDS = new Set<string>([
  'rec_choco_cake',
  'rec_shabbat_challah',
  'rec_home_shakshuka',
  'rec_herb_salmon',
]);

// Empty seed recipes by default
export const SEED_RECIPES: Recipe[] = [];

export interface RecipeDAO {
  getAll(): Promise<Recipe[]>;
  getById(id: string): Promise<Recipe | null>;
  save(recipe: Recipe): Promise<Recipe>;
  delete(id: string): Promise<boolean>;
  exportJSON(): Promise<string>;
  importJSON(jsonString: string, mode: 'merge' | 'replace'): Promise<{ importedCount: number; errors?: string[] }>;
  resetToDefaults(): Promise<Recipe[]>;
  isPersistent(): Promise<boolean>;
  requestPersistence(): Promise<StoragePersistenceStatus>;
}

class IndexedDBRecipeDAO implements RecipeDAO {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('title', 'title', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // LocalStorage Fallback Helper
  private getLocalBackup(): Recipe[] {
    try {
      const data = localStorage.getItem(LOCALSTORAGE_BACKUP_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveLocalBackup(recipes: Recipe[]): void {
    try {
      localStorage.setItem(LOCALSTORAGE_BACKUP_KEY, JSON.stringify(recipes));
    } catch (e) {
      console.warn('LocalStorage quota or access issue:', e);
    }
  }

  // Purge any previously stored hardcoded seed recipes
  private async cleanupHardcodedSeeds(): Promise<void> {
    const CLEANUP_KEY = 'rachel_hardcoded_seeds_purged_v1';
    try {
      if (typeof window === 'undefined') return;
      if (localStorage.getItem(CLEANUP_KEY) === 'true') return;

      // Clean LocalStorage backup
      const local = this.getLocalBackup();
      const cleanedLocal = local.filter((r) => !HARDCODED_SEED_IDS.has(r.id));
      this.saveLocalBackup(cleanedLocal);

      // Clean IndexedDB
      const db = await this.getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const id of HARDCODED_SEED_IDS) {
        store.delete(id);
      }

      localStorage.setItem(CLEANUP_KEY, 'true');
    } catch (e) {
      console.warn('Error purging hardcoded seeds:', e);
    }
  }

  async getAll(): Promise<Recipe[]> {
    try {
      await this.cleanupHardcodedSeeds();

      const db = await this.getDB();
      return await new Promise<Recipe[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
          let recipes = (req.result as Recipe[]) || [];
          recipes = recipes.filter((r) => !HARDCODED_SEED_IDS.has(r.id));
          // Sort newest first
          recipes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          resolve(recipes);
        };

        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('IndexedDB failed, using LocalStorage fallback:', err);
      const local = this.getLocalBackup().filter((r) => !HARDCODED_SEED_IDS.has(r.id));
      return local;
    }
  }

  async getById(id: string): Promise<Recipe | null> {
    try {
      const db = await this.getDB();
      return await new Promise<Recipe | null>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      const all = this.getLocalBackup();
      return all.find(r => r.id === id) || null;
    }
  }

  async save(recipe: Recipe): Promise<Recipe> {
    const itemToSave: Recipe = {
      ...recipe,
      updatedAt: new Date().toISOString(),
      createdAt: recipe.createdAt || new Date().toISOString(),
    };

    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(itemToSave);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      return itemToSave;
    } catch (e) {
      console.warn('IndexedDB save failed, falling back to LocalStorage:', e);
      const current = this.getLocalBackup();
      const idx = current.findIndex(r => r.id === itemToSave.id);
      if (idx >= 0) {
        current[idx] = itemToSave;
      } else {
        current.unshift(itemToSave);
      }
      this.saveLocalBackup(current);
      return itemToSave;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      return true;
    } catch (e) {
      console.warn('IndexedDB delete failed, falling back to LocalStorage:', e);
      const current = this.getLocalBackup();
      const filtered = current.filter(r => r.id !== id);
      this.saveLocalBackup(filtered);
      return true;
    }
  }

  async exportJSON(): Promise<string> {
    const all = await this.getAll();
    const backupPayload = {
      version: 1,
      appName: 'RachelRecipes',
      exportedAt: new Date().toISOString(),
      recipeCount: all.length,
      recipes: all,
    };
    return JSON.stringify(backupPayload, null, 2);
  }

  async importJSON(
    jsonString: string,
    mode: 'merge' | 'replace' = 'merge'
  ): Promise<{ importedCount: number; errors?: string[] }> {
    try {
      const parsed = JSON.parse(jsonString);
      let incomingRecipes: Recipe[] = [];

      if (Array.isArray(parsed)) {
        incomingRecipes = parsed;
      } else if (parsed && Array.isArray(parsed.recipes)) {
        incomingRecipes = parsed.recipes;
      } else {
        throw new Error('קובץ הגיבוי אינו מכיל רשימת מתכונים תקינה');
      }

      // Basic validation of incoming recipes
      const validRecipes = incomingRecipes.filter(
        (r) => r && typeof r.title === 'string' && Array.isArray(r.ingredients)
      );

      if (validRecipes.length === 0) {
        throw new Error('לא נמצאו מתכונים תקינים בקובץ');
      }

      if (mode === 'replace') {
        const db = await this.getDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          store.clear();
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        this.saveLocalBackup([]);
      }

      for (const recipe of validRecipes) {
        // Ensure ID and timestamps
        const safeRecipe: Recipe = {
          ...recipe,
          id: recipe.id || `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          createdAt: recipe.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          baseServings: recipe.baseServings || 4,
          categories: Array.isArray(recipe.categories) ? recipe.categories : ['כללי'],
          ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
          steps: Array.isArray(recipe.steps) ? recipe.steps : [],
        };
        await this.save(safeRecipe);
      }

      return { importedCount: validRecipes.length };
    } catch (err: any) {
      return { importedCount: 0, errors: [err.message || 'שגיאה בייבוא הנתונים'] };
    }
  }

  async resetToDefaults(): Promise<Recipe[]> {
    try {
      const db = await this.getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
    } catch (e) {
      console.warn('Error clearing IndexedDB:', e);
    }

    this.saveLocalBackup([]);
    return [];
  }

  async isPersistent(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
      return await navigator.storage.persisted();
    }
    return false;
  }

  async requestPersistence(): Promise<StoragePersistenceStatus> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      try {
        const isPersisted = await navigator.storage.persist();
        return isPersisted ? 'persisted' : 'denied';
      } catch {
        return 'denied';
      }
    }
    return 'unsupported';
  }
}

// Export singleton instance of RecipeDAO
export const RecipeStorage: RecipeDAO = new IndexedDBRecipeDAO();
