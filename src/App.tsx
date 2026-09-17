import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Heart,
  Sparkles,
  ChefHat,
  Plus,
  BookOpen,
  X
} from 'lucide-react';
import { InstagramIcon } from './components/Icons.tsx';
import type { Recipe } from './types/recipe.ts';
import { RecipeStorage } from './services/storage.ts';
import { Header } from './components/Header.tsx';
import { RecipeCard } from './components/RecipeCard.tsx';
import { RecipeDetailModal } from './components/RecipeDetailModal.tsx';
import { RecipeEditorModal } from './components/RecipeEditorModal.tsx';
import { InstagramSplitImport } from './components/InstagramSplitImport.tsx';
import { CookingMode } from './components/CookingMode.tsx';
import { DataManagementModal } from './components/DataManagementModal.tsx';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export const App: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('הכל');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);
  const [showOnlyInstagram, setShowOnlyInstagram] = useState<boolean>(false);

  // Active Modals State
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [isNewRecipeModalOpen, setIsNewRecipeModalOpen] = useState<boolean>(false);
  const [isInstagramSplitOpen, setIsInstagramSplitOpen] = useState<boolean>(false);
  const [instagramInitialUrl, setInstagramInitialUrl] = useState<string>('');
  const [isDataManagementOpen, setIsDataManagementOpen] = useState<boolean>(false);

  // Load recipes from storage DAO
  const loadRecipes = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const data = await RecipeStorage.getAll();
      setRecipes(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    RecipeStorage.getAll().then((data) => {
      if (!ignore) {
        setRecipes(data);
        setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, []);

  // Compute unique categories across all recipes
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    recipes.forEach((r) => {
      r.categories?.forEach((c) => {
        if (c.trim()) set.add(c.trim());
      });
    });
    return ['הכל', ...Array.from(set)];
  }, [recipes]);

  // Filtered recipes list
  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      // Favorite filter
      if (showOnlyFavorites && !recipe.isFavorite) return false;

      // Instagram filter
      const isIg = recipe.isInstagramEmbed || recipe.sourceUrl?.includes('instagram.com');
      if (showOnlyInstagram && !isIg) return false;

      // Category filter
      if (selectedCategory !== 'הכל' && !recipe.categories?.includes(selectedCategory)) {
        return false;
      }

      // Search query in title, ingredients, notes, or categories
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesTitle = recipe.title.toLowerCase().includes(q);
        const matchesIngredients = recipe.ingredients.some((ing) =>
          ing.toLowerCase().includes(q)
        );
        const matchesNotes = recipe.notes?.toLowerCase().includes(q) || false;
        const matchesCategories = recipe.categories?.some((c) =>
          c.toLowerCase().includes(q)
        );

        if (!matchesTitle && !matchesIngredients && !matchesNotes && !matchesCategories) {
          return false;
        }
      }

      return true;
    });
  }, [recipes, searchQuery, selectedCategory, showOnlyFavorites, showOnlyInstagram]);

  // Recipe Actions
  const handleToggleFavorite = async (recipe: Recipe) => {
    const updated: Recipe = { ...recipe, isFavorite: !recipe.isFavorite };
    await RecipeStorage.save(updated);
    setRecipes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    if (selectedRecipe?.id === updated.id) setSelectedRecipe(updated);
  };

  const handleSaveRecipe = async (saved: Recipe) => {
    await RecipeStorage.save(saved);
    await loadRecipes();
    setEditingRecipe(null);
    setIsNewRecipeModalOpen(false);
    setIsInstagramSplitOpen(false);
    if (selectedRecipe?.id === saved.id) setSelectedRecipe(saved);
    if (cookingRecipe?.id === saved.id) setCookingRecipe(saved);
  };

  const handleDeleteRecipe = async (id: string) => {
    await RecipeStorage.delete(id);
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    if (selectedRecipe?.id === id) setSelectedRecipe(null);
  };

  const handleStartCooking = (recipe: Recipe) => {
    setSelectedRecipe(null);
    setCookingRecipe(recipe);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground pb-[env(safe-area-inset-bottom,0px)]">
      {/* Toast Notification Container with RTL & Safe Area Offset */}
      <Toaster
        richColors
        position="top-center"
        dir="rtl"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        }}
      />

      {/* Header */}
      <Header
        onOpenNewRecipe={() => setIsNewRecipeModalOpen(true)}
        onOpenInstagramImport={() => {
          setInstagramInitialUrl('');
          setIsInstagramSplitOpen(true);
        }}
        onOpenDataManagement={() => setIsDataManagementOpen(true)}
        recipeCount={recipes.length}
      />

      {/* Hero / Filter Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 pb-8 space-y-4 sm:space-y-6">
        {/* Banner with Warm Gourmet Vibe */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 text-white shadow-xl p-5 sm:p-8">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] sm:text-xs font-bold mb-2 sm:mb-3">
              <Sparkles className="size-3.5 text-amber-200" />
              ספר המתכונים המשפחתי שלך
            </span>
            <h2 className="text-xl sm:text-4xl font-extrabold tracking-tight mb-1.5 sm:mb-2 leading-tight">
              מה נבשל היום, רחל?
            </h2>
            <p className="text-xs sm:text-sm text-amber-100 mb-4 sm:mb-6 leading-relaxed max-w-lg">
              שמירת מתכונים מקומית ללא תלות ברשת, התאמת כמויות אוטומטית לפי מספר הסועדים,
              וייבוא פוסטים מאינסטגרם בלחיצה.
            </p>

            {/* Hebrew Search Input Bar */}
            <div className="relative max-w-xl">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חפש מתכון לפי שם, מצרך (קמח, סלמון, שוקולד)..."
                className="w-full pl-10 pr-11 py-2.5 sm:py-3.5 h-11 sm:h-12 bg-white rounded-2xl text-stone-900 placeholder:text-stone-400 text-xs sm:text-sm font-medium shadow-lg border-0 focus-visible:ring-4 focus-visible:ring-amber-400/40"
              />
              <Search className="size-4 sm:size-5 text-stone-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1.5 text-stone-400 hover:text-stone-700 absolute left-3 top-1/2 -translate-y-1/2 rounded-full transition-colors"
                  title="נקה חיפוש"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          {/* Decorative Chef / Kitchen Illustration Glow */}
          <div className="absolute left-[-20px] bottom-[-20px] opacity-10 pointer-events-none">
            <ChefHat className="size-80 text-white" />
          </div>
        </div>

        {/* Filter Bars & Quick Pills */}
        <div className="space-y-3">
          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant={!showOnlyFavorites && !showOnlyInstagram ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setShowOnlyFavorites(false);
                  setShowOnlyInstagram(false);
                }}
                className="h-8 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                כל המתכונים ({recipes.length})
              </Button>

              <Button
                variant={showOnlyFavorites ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setShowOnlyFavorites(!showOnlyFavorites);
                  setShowOnlyInstagram(false);
                }}
                className={`h-8 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  showOnlyFavorites
                    ? 'bg-rose-500 hover:bg-rose-600 text-white'
                    : 'border-rose-200 text-rose-600 hover:bg-rose-50'
                }`}
              >
                <Heart data-icon="inline-start" className={`size-3.5 ${showOnlyFavorites ? 'fill-current' : ''}`} />
                מועדפים ({recipes.filter((r) => r.isFavorite).length})
              </Button>

              <Button
                variant={showOnlyInstagram ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setShowOnlyInstagram(!showOnlyInstagram);
                  setShowOnlyFavorites(false);
                }}
                className={`h-8 rounded-xl text-xs font-bold transition-all shadow-xs ${
                  showOnlyInstagram
                    ? 'bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white'
                    : 'border-stone-200 text-stone-700 hover:bg-muted'
                }`}
              >
                <InstagramIcon data-icon="inline-start" className="size-3.5 text-rose-500" />
                מאינסטגרם ({recipes.filter((r) => r.isInstagramEmbed || r.sourceUrl?.includes('instagram.com')).length})
              </Button>
            </div>

            {/* Total Results Count */}
            <span className="text-xs text-muted-foreground font-medium">
              מציג {filteredRecipes.length} מתוך {recipes.length} מתכונים
            </span>
          </div>

          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {allCategories.map((cat) => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        {/* Recipe Grid or Empty State */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
            <ChefHat className="size-10 animate-bounce text-primary mb-2" />
            <p className="text-sm font-medium">טוען את ספר המתכונים...</p>
          </div>
        ) : filteredRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onSelect={(r) => setSelectedRecipe(r)}
                onStartCooking={(r) => handleStartCooking(r)}
                onToggleFavorite={(r) => handleToggleFavorite(r)}
                onEdit={(r) => setEditingRecipe(r)}
                onDelete={(id) => handleDeleteRecipe(id)}
              />
            ))}
          </div>
        ) : (
          <Card className="rounded-3xl border border-border p-8 sm:p-12 text-center max-w-lg mx-auto my-8 shadow-xs">
            <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <BookOpen className="size-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1.5">
              {recipes.length === 0 ? 'ספר המתכונים ריק כרגע' : 'לא נמצאו מתכונים תואמים'}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-6 leading-relaxed max-w-sm mx-auto">
              {recipes.length === 0
                ? 'התחל ליצור את ספר המתכונים המשפחתי שלך – הוסף מתכון חדש או ייבא בלחיצה מאינסטגרם!'
                : 'נסה לחפש במילים אחרות, לבטל את הסינונים, או להוסיף מתכון חדש לספר שלך.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {recipes.length > 0 && (searchQuery || selectedCategory !== 'הכל' || showOnlyFavorites || showOnlyInstagram) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('הכל');
                    setShowOnlyFavorites(false);
                    setShowOnlyInstagram(false);
                  }}
                  className="rounded-xl text-xs font-semibold h-9 px-4"
                >
                  נקה סינונים
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => setIsNewRecipeModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold h-9 px-4 shadow-sm"
              >
                <Plus data-icon="inline-start" className="size-4" />
                {recipes.length === 0 ? 'הוסף מתכון ראשון' : 'הוסף מתכון חדש'}
              </Button>
              {recipes.length === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setInstagramInitialUrl('');
                    setIsInstagramSplitOpen(true);
                  }}
                  className="rounded-xl text-xs font-bold h-9 px-4 border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 shadow-2xs"
                >
                  <InstagramIcon data-icon="inline-start" className="text-rose-600 size-4" />
                  ייבוא מאינסטגרם
                </Button>
              )}
            </div>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-card/60 py-6 text-center text-xs text-muted-foreground">
        <p className="flex items-center justify-center gap-1.5">
          <span>ספר המתכונים של רחל (RachelRecipes PWA)</span>
          <span>•</span>
          <span>שמירה מקומית ואופליין</span>
        </p>
      </footer>

      {/* Modals */}
      {/* 1. Recipe Detail Modal */}
      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onStartCooking={(r) => handleStartCooking(r)}
          onEdit={(r) => {
            setSelectedRecipe(null);
            setEditingRecipe(r);
          }}
        />
      )}

      {/* 2. Recipe Editor Modal (New or Edit) */}
      {(isNewRecipeModalOpen || editingRecipe) && (
        <RecipeEditorModal
          recipe={editingRecipe}
          onSave={handleSaveRecipe}
          onClose={() => {
            setIsNewRecipeModalOpen(false);
            setEditingRecipe(null);
          }}
          onOpenInstagramSplit={(url) => {
            setInstagramInitialUrl(url || '');
            setIsInstagramSplitOpen(true);
          }}
        />
      )}

      {/* 3. Instagram Split Import Modal */}
      {isInstagramSplitOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 pt-[calc(env(safe-area-inset-top,0px)+0.5rem)] pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)]">
          <div className="w-full max-w-5xl h-full max-h-[92vh]">
            <InstagramSplitImport
              initialUrl={instagramInitialUrl}
              onSave={async (recipeData) => {
                const completeRecipe: Recipe = {
                  id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                  title: recipeData.title || 'מתכון מאינסטגרם',
                  sourceUrl: recipeData.sourceUrl,
                  isInstagramEmbed: true,
                  imageUrl: recipeData.imageUrl,
                  categories: recipeData.categories || ['אינסטגרם'],
                  baseServings: recipeData.baseServings || 4,
                  prepTimeMinutes: recipeData.prepTimeMinutes,
                  cookTimeMinutes: recipeData.cookTimeMinutes,
                  ingredients: recipeData.ingredients || [],
                  steps: recipeData.steps || [],
                  notes: recipeData.notes,
                  createdAt: new Date().toISOString(),
                };
                await handleSaveRecipe(completeRecipe);
              }}
              onCancel={() => setIsInstagramSplitOpen(false)}
            />
          </div>
        </div>
      )}

      {/* 4. Full-Screen Kitchen Cooking Mode */}
      {cookingRecipe && (
        <CookingMode
          recipe={cookingRecipe}
          onClose={() => setCookingRecipe(null)}
          onUpdateRecipe={async (updated) => {
            await RecipeStorage.save(updated);
            setCookingRecipe(updated);
            setRecipes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
          }}
        />
      )}

      {/* 5. Data Management & Backup Modal */}
      {isDataManagementOpen && (
        <DataManagementModal
          recipes={recipes}
          onClose={() => setIsDataManagementOpen(false)}
          onRefreshRecipes={loadRecipes}
        />
      )}
    </div>
  );
};

export default App;
