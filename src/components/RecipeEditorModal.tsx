import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ChefHat,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { InstagramIcon } from './Icons.tsx';
import type { Recipe } from '../types/recipe.ts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface RecipeEditorModalProps {
  recipe?: Recipe | null;
  onSave: (recipe: Recipe) => void;
  onClose: () => void;
  onOpenInstagramSplit: (url?: string) => void;
}

const COMMON_CATEGORIES = [
  'קינוחים',
  'אפייה',
  'עיקריות',
  'מאפים ולחמים',
  'דגים',
  'צמחוני',
  'מהיר להכנה',
  'סלטים',
  'חלבי',
  'בשרי',
  'פרווה'
];

const PRESET_FOOD_IMAGES = [
  { label: 'שוקולד', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80' },
  { label: 'חלה/לחם', url: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?auto=format&fit=crop&w=800&q=80' },
  { label: 'שקשוקה', url: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?auto=format&fit=crop&w=800&q=80' },
  { label: 'דגים', url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80' },
  { label: 'פנקייק', url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80' },
  { label: 'פסטה', url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281691?auto=format&fit=crop&w=800&q=80' },
];

export const RecipeEditorModal: React.FC<RecipeEditorModalProps> = ({
  recipe,
  onSave,
  onClose,
  onOpenInstagramSplit,
}) => {
  const [title, setTitle] = useState(recipe?.title || '');
  const [imageUrl, setImageUrl] = useState(
    recipe?.imageUrl || PRESET_FOOD_IMAGES[0].url
  );
  const [sourceUrl, setSourceUrl] = useState(recipe?.sourceUrl || '');
  const [isInstagramEmbed, setIsInstagramEmbed] = useState(
    recipe?.isInstagramEmbed ?? false
  );
  const [baseServings, setBaseServings] = useState(recipe?.baseServings || 4);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(
    recipe?.prepTimeMinutes || 15
  );
  const [cookTimeMinutes, setCookTimeMinutes] = useState(
    recipe?.cookTimeMinutes || 30
  );
  const [categories, setCategories] = useState<string[]>(
    recipe?.categories && recipe.categories.length > 0 ? recipe.categories : ['כללי']
  );
  const [customCategory, setCustomCategory] = useState('');
  const [ingredients, setIngredients] = useState<string[]>(
    recipe?.ingredients && recipe.ingredients.length > 0
      ? recipe.ingredients
      : ['1 כוס קמח', 'חצי כפית מלח']
  );
  const [steps, setSteps] = useState<string[]>(
    recipe?.steps && recipe.steps.length > 0
      ? recipe.steps
      : ['מערבבים את כל החומרים.', 'אופים ב-180 מעלות.']
  );
  const [notes, setNotes] = useState(recipe?.notes || '');

  // Category Toggle
  const toggleCategory = (cat: string) => {
    if (categories.includes(cat)) {
      setCategories(categories.filter((c) => c !== cat));
    } else {
      setCategories([...categories, cat]);
    }
  };

  const handleAddCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (customCategory.trim() && !categories.includes(customCategory.trim())) {
      setCategories([...categories, customCategory.trim()]);
      setCustomCategory('');
    }
  };

  // Ingredients manipulation
  const handleIngredientChange = (idx: number, val: string) => {
    const updated = [...ingredients];
    updated[idx] = val;
    setIngredients(updated);
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const handleRemoveIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const handleMoveIngredient = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= ingredients.length) return;
    const updated = [...ingredients];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setIngredients(updated);
  };

  // Steps manipulation
  const handleStepChange = (idx: number, val: string) => {
    const updated = [...steps];
    updated[idx] = val;
    setSteps(updated);
  };

  const handleAddStep = () => {
    setSteps([...steps, '']);
  };

  const handleRemoveStep = (idx: number) => {
    setSteps(steps.filter((_, i) => i !== idx));
  };

  const handleMoveStep = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= steps.length) return;
    const updated = [...steps];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setSteps(updated);
  };

  // Save handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('נא להזין שם מתכון');
      return;
    }

    const cleanIngredients = ingredients
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    const cleanSteps = steps
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const updatedRecipe: Recipe = {
      id: recipe?.id || `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim(),
      sourceUrl: sourceUrl.trim() || undefined,
      isInstagramEmbed: isInstagramEmbed || sourceUrl.includes('instagram.com'),
      imageUrl: imageUrl.trim() || undefined,
      categories: categories.length > 0 ? categories : ['כללי'],
      baseServings: Number(baseServings) || 4,
      prepTimeMinutes: Number(prepTimeMinutes) || 0,
      cookTimeMinutes: Number(cookTimeMinutes) || 0,
      ingredients: cleanIngredients.length > 0 ? cleanIngredients : ['מצרך לדוגמה'],
      steps: cleanSteps.length > 0 ? cleanSteps : ['שלב ראשון'],
      notes: notes.trim() || undefined,
      createdAt: recipe?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFavorite: recipe?.isFavorite || false,
      manualIngredientOverrides: recipe?.manualIngredientOverrides,
    };

    onSave(updatedRecipe);
    toast.success(recipe ? 'המתכון עודכן בהצלחה!' : 'המתכון נוסף בהצלחה לספר!');
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-3xl gap-0 border-border/80">
        <DialogHeader className="p-4 sm:p-5 border-b border-border bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
              <ChefHat className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                {recipe ? 'עריכת מתכון' : 'מתכון חדש בספר'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                הזן את פרטי המתכון, כמויות המצרכים ושלבי ההכנה
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Quick Instagram Split Import Banner */}
          <div className="p-3.5 bg-gradient-to-r from-orange-50/80 to-rose-50/80 border border-orange-200/80 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-xl bg-gradient-to-tr from-orange-500 to-pink-500 flex items-center justify-center text-white shrink-0">
                <InstagramIcon className="size-4" />
              </div>
              <div className="text-xs min-w-0">
                <span className="font-bold text-foreground block truncate">
                  יש לך סרטון או פוסט מאינסטגרם?
                </span>
                <span className="text-muted-foreground truncate block">
                  השתמש במצב ייבוא מפוצל עם חילוץ מצרכים אוטומטי
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onOpenInstagramSplit(sourceUrl);
              }}
              className="text-xs font-bold rounded-xl border-orange-200 text-orange-700 bg-white hover:bg-orange-50 shadow-2xs shrink-0"
            >
              פתח ייבוא מאינסטגרם
            </Button>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="recipe-title" className="text-xs font-bold text-foreground">
              שם המתכון *
            </Label>
            <Input
              id="recipe-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="למשל: עוגת שוקולד חגיגית, חלה לשבת..."
              className="rounded-xl h-10 text-sm"
            />
          </div>

          {/* Categories Pill Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">
              קטגוריות
            </Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_CATEGORIES.map((cat) => {
                const isSelected = categories.includes(cat);
                return (
                  <Badge
                    key={cat}
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => toggleCategory(cat)}
                    className={`cursor-pointer transition-all text-xs py-1 px-2.5 rounded-xl ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-background hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {cat}
                  </Badge>
                );
              })}
            </div>

            {/* Custom Category Input */}
            <div className="flex gap-2">
              <Input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="קטגוריה מותאמת אישית..."
                className="rounded-xl h-8 text-xs max-w-xs"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddCustomCategory}
                className="h-8 rounded-xl text-xs"
              >
                הוסף
              </Button>
            </div>
          </div>

          {/* Servings & Times Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="servings" className="text-xs font-bold text-foreground">
                מנות בסיס
              </Label>
              <Input
                id="servings"
                type="number"
                min={1}
                max={50}
                value={baseServings}
                onChange={(e) => setBaseServings(Number(e.target.value))}
                className="rounded-xl h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prep-time" className="text-xs font-bold text-foreground">
                זמן הכנה (דק׳)
              </Label>
              <Input
                id="prep-time"
                type="number"
                min={0}
                value={prepTimeMinutes}
                onChange={(e) => setPrepTimeMinutes(Number(e.target.value))}
                className="rounded-xl h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cook-time" className="text-xs font-bold text-foreground">
                זמן בישול (דק׳)
              </Label>
              <Input
                id="cook-time"
                type="number"
                min={0}
                value={cookTimeMinutes}
                onChange={(e) => setCookTimeMinutes(Number(e.target.value))}
                className="rounded-xl h-9 text-xs"
              />
            </div>
          </div>

          {/* Image Presets & URL */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-foreground">
              תמונת המתכון
            </Label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PRESET_FOOD_IMAGES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setImageUrl(preset.url)}
                  className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    imageUrl === preset.url
                      ? 'border-primary ring-2 ring-primary/30 scale-102'
                      : 'border-transparent hover:border-muted-foreground/30 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] font-medium py-0.5 text-center">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>

            <Input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="או הדבק קישור לתמונה משלך..."
              className="rounded-xl h-8 text-xs mt-1"
            />
          </div>

          {/* Instagram / Source URL */}
          <div className="space-y-1.5">
            <Label htmlFor="source-url" className="text-xs font-bold text-foreground">
              קישור מקור (אינסטגרם או אתר)
            </Label>
            <Input
              id="source-url"
              type="url"
              value={sourceUrl}
              onChange={(e) => {
                setSourceUrl(e.target.value);
                if (e.target.value.includes('instagram.com')) {
                  setIsInstagramEmbed(true);
                }
              }}
              placeholder="https://www.instagram.com/p/... או קישור אחר"
              className="rounded-xl h-9 text-xs"
            />
          </div>

          {/* Ingredients Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground">
                רשימת מצרכים ({ingredients.length})
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddIngredient}
                className="h-7 text-xs rounded-xl text-primary"
              >
                <Plus data-icon="inline-start" className="size-3.5" />
                הוסף מצרך
              </Button>
            </div>

            <div className="space-y-1.5">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="size-5 rounded-md bg-muted text-muted-foreground text-[10px] font-mono flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <Input
                    type="text"
                    value={ing}
                    onChange={(e) => handleIngredientChange(idx, e.target.value)}
                    placeholder="למשל: 2 כוסות סוכר, 200 גרם חמאה..."
                    className="rounded-xl h-8 text-xs flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={idx === 0}
                    onClick={() => handleMoveIngredient(idx, 'up')}
                    className="size-7 rounded-lg text-muted-foreground"
                    title="העלה"
                  >
                    <ArrowUp className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={idx === ingredients.length - 1}
                    onClick={() => handleMoveIngredient(idx, 'down')}
                    className="size-7 rounded-lg text-muted-foreground"
                    title="הורד"
                  >
                    <ArrowDown className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveIngredient(idx)}
                    className="size-7 rounded-lg text-muted-foreground hover:text-destructive"
                    title="מחק מצרך"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Steps Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground">
                שלבי הכנה ({steps.length})
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddStep}
                className="h-7 text-xs rounded-xl text-primary"
              >
                <Plus data-icon="inline-start" className="size-3.5" />
                הוסף שלב
              </Button>
            </div>

            <div className="space-y-1.5">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <span className="size-5 rounded-md bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0 mt-1.5">
                    {idx + 1}
                  </span>
                  <Textarea
                    value={step}
                    onChange={(e) => handleStepChange(idx, e.target.value)}
                    placeholder={`שלב ${idx + 1}...`}
                    rows={2}
                    className="rounded-xl text-xs flex-1 min-h-[50px] py-1.5"
                  />
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={idx === 0}
                      onClick={() => handleMoveStep(idx, 'up')}
                      className="size-6 rounded-md text-muted-foreground"
                      title="העלה"
                    >
                      <ArrowUp className="size-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={idx === steps.length - 1}
                      onClick={() => handleMoveStep(idx, 'down')}
                      className="size-6 rounded-md text-muted-foreground"
                      title="הורד"
                    >
                      <ArrowDown className="size-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveStep(idx)}
                      className="size-6 rounded-md text-muted-foreground hover:text-destructive"
                      title="מחק שלב"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes & Tips */}
          <div className="space-y-1.5">
            <Label htmlFor="recipe-notes" className="text-xs font-bold text-foreground">
              הערות, טיפים ושדרוגים
            </Label>
            <Textarea
              id="recipe-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="למשל: עדיף להגיש חם עם כדור גלידה וניל, ניתן להקפיא עד שבועיים..."
              rows={3}
              className="rounded-xl text-xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-xl text-xs font-medium"
            >
              ביטול
            </Button>

            <Button
              type="submit"
              className="h-10 px-5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20"
            >
              {recipe ? 'שמור שינויים' : 'שמור מתכון בספר'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
