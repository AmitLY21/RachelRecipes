import React, { useState, useMemo } from 'react';
import {
  ChefHat,
  Clock,
  Users,
  Share2,
  ExternalLink,
  Edit2,
  CheckCircle2,
  Circle,
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react';
import { InstagramIcon } from './Icons.tsx';
import type { Recipe } from '../types/recipe.ts';
import { scaleIngredientsList } from '../utils/ingredientScaler.ts';
import { InstagramEmbed } from './InstagramEmbed.tsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { toast } from 'sonner';

interface RecipeDetailModalProps {
  recipe: Recipe;
  onClose: () => void;
  onStartCooking: (recipe: Recipe) => void;
  onEdit: (recipe: Recipe) => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipe,
  onClose,
  onStartCooking,
  onEdit,
}) => {
  const [multiplier, setMultiplier] = useState<number>(1);
  const [customServings, setCustomServings] = useState<number>(recipe.baseServings);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [showInstagramTab, setShowInstagramTab] = useState<boolean>(false);

  const handleMultiplierSelect = (m: number) => {
    setMultiplier(m);
    setCustomServings(Math.round(recipe.baseServings * m * 10) / 10);
  };

  const handleCustomServingsChange = (servings: number) => {
    if (servings < 1) return;
    setCustomServings(servings);
    setMultiplier(servings / recipe.baseServings);
  };

  const scaledIngredients = useMemo(() => {
    return scaleIngredientsList(
      recipe.ingredients,
      multiplier,
      recipe.manualIngredientOverrides
    );
  }, [recipe.ingredients, multiplier, recipe.manualIngredientOverrides]);

  const toggleIngredient = (idx: number) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleShare = async () => {
    const textContent = `${recipe.title}\n\nמצרכים:\n${recipe.ingredients.join('\n')}\n\nשלבים:\n${recipe.steps.join('\n')}\n\nמתוך ספר המתכונים של רחל`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: textContent,
          url: window.location.href,
        });
        toast.success('המתכון שותף בהצלחה!');
      } catch {
        // user cancelled share
      }
    } else {
      await navigator.clipboard.writeText(textContent);
      toast.success('המתכון הועתק ללוח בהצלחה!');
    }
  };

  const isInstagram = recipe.isInstagramEmbed || recipe.sourceUrl?.includes('instagram.com');

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl w-[95vw] sm:w-full max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-3xl gap-0 border-border/80">
        <DialogHeader className="sr-only">
          <DialogTitle>{recipe.title}</DialogTitle>
          <DialogDescription>פרטי המתכון, כמויות מצרכים, ואופן ההכנה</DialogDescription>
        </DialogHeader>

        {/* Modal Top Banner */}
        <div className="relative aspect-[21/9] sm:aspect-[24/9] overflow-hidden bg-muted shrink-0">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-orange-500 to-amber-600 flex items-center justify-center text-white">
              <ChefHat className="size-16 opacity-80" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/35 to-transparent pointer-events-none" />

          {/* Share & Edit Controls on Banner */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-1.5 z-10">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleShare}
              className="h-8 px-2.5 rounded-xl text-xs font-semibold bg-white/90 hover:bg-white text-stone-800 shadow-sm backdrop-blur-md"
            >
              <Share2 data-icon="inline-start" className="size-3.5" />
              שתף
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => {
                onClose();
                onEdit(recipe);
              }}
              className="size-8 rounded-xl bg-white/90 hover:bg-white text-stone-800 shadow-sm backdrop-blur-md"
              title="ערוך מתכון"
            >
              <Edit2 className="size-3.5" />
            </Button>
          </div>

          {/* Title & Metadata on Image */}
          <div className="absolute bottom-3 inset-x-4 sm:bottom-4 sm:inset-x-6 text-white pointer-events-none">
            <div className="flex flex-wrap gap-1.5 mb-1.5 pointer-events-auto">
              {recipe.categories?.map((cat, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-[11px] font-semibold border-0"
                >
                  {cat}
                </Badge>
              ))}
              {isInstagram && (
                <Badge className="bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[11px] font-bold border-0 gap-1">
                  <InstagramIcon className="size-3" /> אינסטגרם
                </Badge>
              )}
            </div>
            <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white drop-shadow-md">
              {recipe.title}
            </h2>
          </div>
        </div>

        {/* Recipe Info Header Strip */}
        <div className="bg-muted/40 border-b border-border px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            {recipe.prepTimeMinutes && (
              <span className="flex items-center gap-1.5">
                <Clock className="size-4 text-orange-600" />
                הכנה: <strong className="text-foreground">{recipe.prepTimeMinutes} דק׳</strong>
              </span>
            )}
            {recipe.cookTimeMinutes && (
              <span className="flex items-center gap-1.5">
                <Clock className="size-4 text-amber-600" />
                בישול: <strong className="text-foreground">{recipe.cookTimeMinutes} דק׳</strong>
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Users className="size-4 text-stone-500" />
              מנות מקור: <strong className="text-foreground">{recipe.baseServings}</strong>
            </span>
          </div>

          {isInstagram && recipe.sourceUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowInstagramTab(!showInstagramTab)}
              className="h-7 text-xs text-rose-600 hover:text-rose-700 font-semibold p-0 hover:bg-transparent"
            >
              <InstagramIcon data-icon="inline-start" className="size-3.5" />
              {showInstagramTab ? 'הסתר פוסט אינסטגרם' : 'צפה בפוסט באינסטגרם'}
            </Button>
          )}
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Optional Instagram Embed Drawer */}
          {showInstagramTab && recipe.sourceUrl && (
            <div className="p-4 bg-muted/50 rounded-2xl border border-border flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-3">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <InstagramIcon className="size-4 text-rose-500" /> פוסט מקורי
                </span>
                <a
                  href={recipe.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  פתח באפליקציה <ExternalLink className="size-3" />
                </a>
              </div>
              <InstagramEmbed url={recipe.sourceUrl} className="w-full" />
            </div>
          )}

          {/* Servings Stepper Banner */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-orange-50/80 to-amber-50/80 rounded-2xl border border-orange-200/80 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-orange-950 block mb-0.5">
                התאמת כמויות לסועדים (חישוב חכם)
              </span>
              <span className="text-[11px] text-orange-700">
                המצרכים מתעדכנים בלייב לפי מספר המנות הנבחר
              </span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Stepper +/- */}
              <div className="flex items-center bg-white border border-orange-300 rounded-xl overflow-hidden p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleCustomServingsChange(customServings - 1)}
                  className="p-1.5 text-stone-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  title="פחות מנה"
                >
                  <Minus className="size-3.5" />
                </button>
                <span className="px-2.5 font-bold text-xs sm:text-sm text-stone-900 font-mono">
                  {customServings} מנות
                </span>
                <button
                  type="button"
                  onClick={() => handleCustomServingsChange(customServings + 1)}
                  className="p-1.5 text-stone-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  title="עוד מנה"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>

              {/* Quick Multiplier ToggleGroup */}
              <ToggleGroup
                type="single"
                value={String(multiplier)}
                onValueChange={(val) => {
                  if (val) handleMultiplierSelect(Number(val));
                }}
                className="gap-1 bg-white/70 p-1 rounded-xl border border-orange-200"
              >
                {[0.5, 1, 2, 3].map((m) => (
                  <ToggleGroupItem
                    key={m}
                    value={String(m)}
                    className="h-7 px-2 text-xs font-bold rounded-lg data-[state=on]:bg-orange-600 data-[state=on]:text-white"
                  >
                    {m}×
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>

          {/* Ingredients Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-foreground">
                רשימת מצרכים ({scaledIngredients.length})
              </h3>
              {multiplier !== 1 && (
                <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/30 bg-primary/10">
                  מחושב לפי {multiplier}×
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {scaledIngredients.map((item, idx) => {
                const isChecked = !!checkedIngredients[idx];

                return (
                  <div
                    key={idx}
                    onClick={() => toggleIngredient(idx)}
                    className={`p-3 rounded-2xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                      isChecked
                        ? 'bg-muted/50 border-border opacity-60'
                        : 'bg-card border-border hover:bg-orange-50/40 hover:border-orange-300'
                    }`}
                  >
                    <div className="mt-0.5 text-primary shrink-0">
                      {isChecked ? (
                        <CheckCircle2 className="size-4 text-emerald-600" />
                      ) : (
                        <Circle className="size-4 text-stone-400" />
                      )}
                    </div>

                    <div className="text-xs sm:text-sm leading-relaxed flex-1">
                      {item.numberDisplay ? (
                        <>
                          <span
                            dir="ltr"
                            className="font-bold text-orange-700 bg-orange-100/60 px-1.5 py-0.5 rounded-md inline-block mr-1 font-mono"
                          >
                            {item.numberDisplay}
                          </span>
                          <span className={isChecked ? 'line-through text-muted-foreground' : 'text-foreground'}>
                            {item.unitAndRest}
                          </span>
                        </>
                      ) : (
                        <span className={isChecked ? 'line-through text-muted-foreground' : 'text-foreground'}>
                          {item.scaledText}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Steps Section */}
          <div>
            <h3 className="text-base font-bold text-foreground mb-3">
              אופן ההכנה ({recipe.steps.length} שלבים)
            </h3>

            <div className="space-y-2.5">
              {recipe.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-muted/40 border border-border flex items-start gap-3"
                >
                  <div className="size-6 rounded-lg bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recipe Notes */}
          {recipe.notes && (
            <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl">
              <h4 className="text-xs font-bold text-amber-900 mb-1 flex items-center gap-1.5">
                <Sparkles className="size-4 text-amber-600" /> הערות והמלצות
              </h4>
              <p className="text-xs text-amber-950 leading-relaxed">
                {recipe.notes}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer / Primary Action */}
        <div className="p-4 sm:p-5 bg-muted/30 border-t border-border flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="rounded-xl text-sm font-medium"
          >
            סגור
          </Button>

          <Button
            onClick={() => {
              onClose();
              onStartCooking(recipe);
            }}
            className="h-11 px-6 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-orange-600/25 flex items-center gap-2 active:scale-95"
          >
            <ChefHat data-icon="inline-start" className="size-5" />
            התחל לבשל במטבח (מסך מלא)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
