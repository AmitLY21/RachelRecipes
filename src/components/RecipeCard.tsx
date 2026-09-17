import React, { useState } from 'react';
import { Clock, Users, Heart, ChefHat, Trash2, Edit2 } from 'lucide-react';
import { InstagramIcon } from './Icons.tsx';
import type { Recipe } from '../types/recipe.ts';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface RecipeCardProps {
  recipe: Recipe;
  onSelect: (recipe: Recipe) => void;
  onStartCooking: (recipe: Recipe) => void;
  onToggleFavorite: (recipe: Recipe) => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onSelect,
  onStartCooking,
  onToggleFavorite,
  onEdit,
  onDelete,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const isInstagram = recipe.isInstagramEmbed || recipe.sourceUrl?.includes('instagram.com');
  const totalMinutes = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0);

  return (
    <>
      <Card className="group border-border/80 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col hover:-translate-y-1 bg-card rounded-3xl p-0 gap-0">
        {/* Card Image Banner */}
        <CardHeader className="p-0 relative aspect-[16/10] overflow-hidden bg-muted cursor-pointer" onClick={() => onSelect(recipe)}>
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-gradient-to-br from-amber-50 to-orange-100/50">
              <ChefHat className="size-12 stroke-1 mb-1 text-orange-400/70" />
              <span className="text-xs font-medium text-stone-500">מתכוני רחל</span>
            </div>
          )}

          {/* Scrim overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

          {/* Badges Top Bar */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-1.5 flex-wrap">
              {isInstagram && (
                <Badge className="bg-gradient-to-r from-orange-500 to-rose-500 text-white text-[11px] font-bold shadow-md border-0 gap-1 backdrop-blur-sm">
                  <InstagramIcon className="size-3.5" /> אינסטגרם
                </Badge>
              )}
              {recipe.categories && recipe.categories[0] && (
                <Badge variant="secondary" className="bg-white/90 backdrop-blur-md text-stone-800 text-[11px] font-semibold shadow-xs">
                  {recipe.categories[0]}
                </Badge>
              )}
            </div>

            {/* Favorite Heart Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(recipe);
              }}
              className={`size-9 rounded-full transition-transform active:scale-90 shadow-md ${
                recipe.isFavorite
                  ? 'bg-rose-500 text-white hover:bg-rose-600 hover:text-white'
                  : 'bg-white/85 text-stone-600 hover:text-rose-500 hover:bg-white backdrop-blur-md'
              }`}
              title={recipe.isFavorite ? 'הסר ממועדפים' : 'הוסף למועדפים'}
            >
              <Heart className={`size-4 ${recipe.isFavorite ? 'fill-current' : ''}`} />
            </Button>
          </div>

          {/* Time and Servings Bottom Overlay */}
          <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-white text-xs font-medium pointer-events-none">
            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-3 py-1 rounded-xl">
              {totalMinutes > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5 text-amber-300" />
                  {totalMinutes} דק׳
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="size-3.5 text-amber-300" />
                {recipe.baseServings} מנות
              </span>
            </div>
          </div>
        </CardHeader>

        {/* Card Content Body */}
        <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <div>
            <h3
              onClick={() => onSelect(recipe)}
              className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 cursor-pointer mb-2"
            >
              {recipe.title}
            </h3>

            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
              {recipe.notes ||
                `${recipe.ingredients.length} מצרכים • ${recipe.steps.length} שלבי הכנה`}
            </p>

            {/* Categories Pill List */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {recipe.categories?.slice(0, 3).map((cat, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-[11px] font-medium bg-muted/50 border-border text-muted-foreground"
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>

        {/* Action Buttons Footer */}
        <CardFooter className="p-4 pt-3 sm:px-5 border-t border-border/60 flex items-center justify-between gap-2">
          <Button
            onClick={() => onStartCooking(recipe)}
            className="flex-1 h-9 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs active:scale-95"
          >
            <ChefHat data-icon="inline-start" />
            התחל לבשל
          </Button>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(recipe)}
              className="size-9 text-muted-foreground hover:text-foreground rounded-xl"
              title="ערוך מתכון"
            >
              <Edit2 className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteDialogOpen(true)}
              className="size-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
              title="מחק מתכון"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Accessible Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl max-w-sm sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">מחיקת מתכון</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              האם אתה בטוח שברצונך למחוק את המתכון &quot;{recipe.title}&quot;?
              פעולה זו תסיר את המתכון מספר המתכונים שלך.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse sm:justify-start gap-2">
            <AlertDialogCancel className="rounded-xl">ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(recipe.id)}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl"
            >
              מחק מתכון
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
