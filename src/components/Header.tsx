import React from 'react';
import {
  ChefHat,
  Plus,
  Database,
  Sun,
} from 'lucide-react';
import { InstagramIcon, SunOffIcon } from './Icons.tsx';
import { useWakeLock } from '../hooks/useWakeLock.ts';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onOpenNewRecipe: () => void;
  onOpenInstagramImport: () => void;
  onOpenDataManagement: () => void;
  recipeCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewRecipe,
  onOpenInstagramImport,
  onOpenDataManagement,
  recipeCount,
}) => {
  const wakeLock = useWakeLock();

  return (
    <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="size-9 sm:size-11 rounded-2xl bg-gradient-to-tr from-primary via-amber-500 to-orange-500 flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20 shrink-0">
            <ChefHat className="size-5 sm:size-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-xl font-black tracking-tight text-foreground font-sans truncate">
                המתכונים של אישתי
              </h1>
            </div>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium truncate">
              ספר המתכונים הביתי • {recipeCount} מתכונים
            </p>
          </div>
        </div>

        {/* Action Controls Right Side */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Wake Lock Header Quick Toggle */}
          <Button
            variant={wakeLock.isActive ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => wakeLock.toggle()}
            title={wakeLock.isActive ? 'שמירת מסך דולק פעילה - לחץ לביטול' : 'השאר מסך דולק בזמן בישול'}
            className={`text-xs font-semibold h-9 rounded-xl ${
              wakeLock.isActive
                ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs hover:bg-amber-200'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {wakeLock.isActive ? (
              <>
                <Sun data-icon="inline-start" className="text-amber-600 animate-pulse" />
                <span className="hidden md:inline">מסך פעיל</span>
              </>
            ) : (
              <>
                <SunOffIcon data-icon="inline-start" className="text-muted-foreground" />
                <span className="hidden md:inline">מסך רגיל</span>
              </>
            )}
          </Button>

          {/* Instagram Split Import Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenInstagramImport}
            className="text-xs font-bold h-9 rounded-xl border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 text-rose-700 shadow-2xs"
            title="ייבוא מאינסטגרם"
          >
            <InstagramIcon data-icon="inline-start" className="text-rose-600" />
            <span className="hidden md:inline">ייבוא מאינסטגרם</span>
          </Button>

          {/* Data Management Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenDataManagement}
            className="text-xs font-semibold h-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary"
            title="ניהול נתונים וגיבוי"
          >
            <Database data-icon="inline-start" />
            <span className="hidden md:inline">גיבוי</span>
          </Button>

          {/* Add New Recipe Primary Button */}
          <Button
            size="sm"
            onClick={onOpenNewRecipe}
            className="h-9 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-primary/20 active:scale-95 whitespace-nowrap bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
            title="מתכון חדש"
          >
            <Plus data-icon="inline-start" />
            <span className="hidden xs:inline sm:inline">מתכון חדש</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
