import type { Recipe, StoragePersistenceStatus } from '../types/recipe.ts';

const DB_NAME = 'RachelRecipesDB';
const DB_VERSION = 1;
const STORE_NAME = 'recipes';
const LOCALSTORAGE_BACKUP_KEY = 'rachel_recipes_data';

// Initial Seed Recipes in authentic Hebrew
export const SEED_RECIPES: Recipe[] = [
  {
    id: 'rec_choco_cake',
    title: 'עוגת שוקולד קלאסית נימוחה',
    sourceUrl: 'https://www.instagram.com/p/ExampleChocolateCake/',
    isInstagramEmbed: true,
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
    categories: ['קינוחים', 'אפייה', 'חלבי'],
    baseServings: 8,
    prepTimeMinutes: 20,
    cookTimeMinutes: 40,
    ingredients: [
      '200g קמח לבן מנופה',
      '1 1/2 כוסות סוכר, לאפות ב-180 מעלות',
      'חצי כוס אבקת קקאו איכותית',
      '1 כפית אבקת אפייה',
      'חצי כפית סודה לשתייה',
      'רבע כפית מלח',
      '2 ביצים גדולות בטמפרטורת החדר',
      '1 כוס חלב פושר',
      'חצי כוס שמן קנולה',
      '1 כוס קפה חם נמס'
    ],
    steps: [
      'מחממים תנור ל-180 מעלות ומשמנים תבנית קפיצית בקוטר 24 ס״מ.',
      'בקערה גדולה מנפים יחד את כל החומרים היבשים: קמח, קקאו, סוכר, אבקת אפייה, סודה לשתייה ומלח.',
      'בקערה נפרדת טורפים ביצים, חלב ושמן עד לאיחוד.',
      'מאחדים בין התערובות וטורפים קלות, מוסיפים את הקפה החם בהדרגה עד לבלילה אחידה ונוזלית מעט.',
      'יוצקים לתבנית ואופים 35-40 דקות, עד שקיסם הננעץ במרכז יוצא עם פירורים לחים.',
      'מצננים 15 דקות לפני חיתוך והגשה.'
    ],
    notes: 'עוגה נהדרת שמשתבחת למחרת. מומלץ להגיש עם גנאש שוקולד חם או אבקת סוכר.',
    createdAt: '2026-09-10T10:00:00Z',
    isFavorite: true,
  },
  {
    id: 'rec_shabbat_challah',
    title: 'חלת שבת עשירה וקלועה',
    sourceUrl: 'https://www.instagram.com/reel/ExampleChallahReel/',
    isInstagramEmbed: true,
    imageUrl: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=800&q=80',
    categories: ['מאפים ולחמים', 'פרווה', 'מסורתי'],
    baseServings: 2,
    prepTimeMinutes: 30,
    cookTimeMinutes: 25,
    ingredients: [
      '1 ק״ג קמח לחם לבן מנופה',
      '2 כפות שמרים יבשים',
      'שליש כוס סוכר',
      '1 1/2 כפיות מלח דק',
      'חצי כוס שמן קנולה',
      '2 1/4 כוסות מים פושרים',
      '1 ביצה טרופה להברשה',
      'שומשום או פרג לפיזור'
    ],
    steps: [
      'בקערת מיקסר עם וו לישה שמים קמח, שמרים וסוכר ומערבבים קלות.',
      'מתחילים ללוש במהירות נמוכה ומוסיפים בהדרגה את המים והשמן.',
      'מוסיפים את המלח וממשיכים ללוש כ-10-12 דקות עד לקבלת בצק חלק, גמיש ונעים למגע.',
      'משמנים קערה במעט שמן, מגלגלים את הבצק ומתפיחים מכוסה כשעה עד להכפלת הנפח.',
      'מחלקים את הבצק לרצועות וקולעים שתי חלות יפהפיות.',
      'מתפיחים שוב כ-30 דקות. מברישים בביצה ומפזרים שומשום בנדיבות.',
      'אופים בתנור שחומם מראש ל-190 מעלות כ-25 דקות עד להזהבה עמוקה.'
    ],
    notes: 'לסיום מבריק: ישר אחרי היציאה מהתנור מומלץ לכסות במגבת מטבח נקייה ל-10 דקות כדי לשמור על רכות הקרום.',
    createdAt: '2026-09-12T14:30:00Z',
    isFavorite: true,
  },
  {
    id: 'rec_home_shakshuka',
    title: 'שקשוקה עגבניות פיקנטית של בית',
    sourceUrl: 'https://www.instagram.com/p/ExampleShakshuka/',
    isInstagramEmbed: false,
    imageUrl: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=800&q=80',
    categories: ['עיקריות', 'מהיר להכנה', 'צמחוני'],
    baseServings: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    ingredients: [
      '4 כפות שמן זית מובחר',
      '1 בצל גדול קצוץ דק',
      '1 פלפל אדום חתוך לקוביות',
      'חצי פלפל חריף ירוק קצוץ (לפי הטעם)',
      '4 שיני שום כתושות',
      '1 כף גדושה פפריקה מתוקה בשמן',
      'חצי כפית כמון טחון',
      '6 עגבניות בשלות קלופות וחתוכות לקוביות',
      '2 כפות רסק עגבניות איכותי',
      'חצי כפית סוכר (לאיזון חמיצות)',
      '4 ביצים טריות',
      'חופן כוסברה או פטרוזיליה קצוצה'
    ],
    steps: [
      'במחבת רחבה ועמוקה מחממים שמן זית ומטגנים את הבצל עד להזהבה קלה.',
      'מוסיפים את הפלפל האדום והפלפל החריף ומטגנים כ-5 דקות עד לריכוך.',
      'מוסיפים שום כתוש, פפריקה וכמון ופותחים את התבלינים בשמן כדקה.',
      'מוסיפים עגבניות, רסק עגבניות, מלח, פלפל וסוכר. מנמיכים להבה ומבשלים כ-15 דקות עד לקבלת רוטב סמיך ועשיר.',
      'יוצרים שקעים ברוטב ושוברים פנימה את הביצים.',
      'מכסים במכסה ומבשלים על אש נמוכה כ-5-8 דקות, עד שהחלבון מתייצב והחלמון נותר רך ונוזלי.',
      'מפזרים פטרוזיליה טרייה ומגישים חם ישירות עם חלה טרייה.'
    ],
    notes: 'מעולה עם תוספת קוביות פטה או חציל קלוי מעל.',
    createdAt: '2026-09-14T08:00:00Z',
    isFavorite: false,
  },
  {
    id: 'rec_herb_salmon',
    title: 'פילה סלמון בעשבי תיבול ושום בתנור',
    sourceUrl: 'https://www.instagram.com/p/ExampleSalmon/',
    isInstagramEmbed: false,
    imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
    categories: ['דגים', 'עיקריות', 'מהיר להכנה'],
    baseServings: 4,
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    ingredients: [
      '4 נתחי פילה סלמון טרי (כ-180g כל נתח)',
      '3 כפות שמן זית כתית מעולה',
      '3 שיני שום כתושות',
      '1 כף חרדל דיז\'ון גרגירים',
      '1 כף דבש או סילאן',
      'חצי כפית מלח ים אטלנטי',
      'רבע כפית פלפל שחור גרוס',
      'חצי כוס עשבי תיבול קצוצים (שמיר, פטרוזיליה, בצל ירוק)',
      '1 לימון פרוס לפלחים דקים'
    ],
    steps: [
      'מחממים תנור ל-200 מעלות במצב טורבו ומרפדים תבנית בנייר אפייה.',
      'מניחים את נתחי הסלמון על התבנית עם העור כלפי מטה ומייבשים בנייר סופג.',
      'בקערית מערבבים שמן זית, שום, חרדל, דבש, מלח ופלפל.',
      'מורחים את הרוטב בנדיבות על כל נתח ומפזרים מעל את עשבי התיבול הקצוצים.',
      'מניחים פלחי לימון על הנתחים ומסביבם.',
      'אופים בדיוק 12-14 דקות, עד שהדג עשוי אך נשאר עסיסי ורך מבפנים.'
    ],
    notes: 'זהירות מאפיית יתר! הסלמון במיטבו כשהוא ורוד ועסיסי במרכז.',
    createdAt: '2026-09-15T16:00:00Z',
    isFavorite: false,
  }
];

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

  async getAll(): Promise<Recipe[]> {
    try {
      const db = await this.getDB();
      return await new Promise<Recipe[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
          let recipes = req.result as Recipe[];
          if (!recipes || recipes.length === 0) {
            // First run: Seed the database
            this.resetToDefaults().then(resolve).catch(reject);
            return;
          }
          // Sort newest first
          recipes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          resolve(recipes);
        };

        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('IndexedDB failed, using LocalStorage fallback:', err);
      let local = this.getLocalBackup();
      if (local.length === 0) {
        local = SEED_RECIPES;
        this.saveLocalBackup(local);
      }
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
      for (const r of SEED_RECIPES) {
        store.put(r);
      }
    } catch (e) {
      console.warn('Error clearing and resetting IndexedDB:', e);
    }

    this.saveLocalBackup(SEED_RECIPES);
    return SEED_RECIPES;
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
