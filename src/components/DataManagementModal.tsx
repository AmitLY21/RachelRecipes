import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  Upload,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Check,
  FileJson,
  AlertCircle,
  HardDrive
} from 'lucide-react';
import { RecipeStorage } from '../services/storage.ts';
import type { Recipe } from '../types/recipe.ts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface DataManagementModalProps {
  recipes: Recipe[];
  onClose: () => void;
  onRefreshRecipes: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  recipes,
  onClose,
  onRefreshRecipes,
}) => {
  const [isPersisted, setIsPersisted] = useState<boolean>(false);
  const [persisting, setPersisting] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    RecipeStorage.isPersistent().then(setIsPersisted);
  }, []);

  const handleRequestPersistence = async () => {
    setPersisting(true);
    try {
      const res = await RecipeStorage.requestPersistence();
      setIsPersisted(res === 'persisted');
      if (res === 'persisted') {
        toast.success('מעולה! האחסון הוגדר כקבוע ומוגן מפני מחיקות אוטומטיות של הדפדפן.');
      } else {
        toast.info('הדפדפן סירב או שאינו תומך בהגנה קבועה. מומלץ לגבות את המתכונים מעת לעת בקובץ JSON.');
      }
    } finally {
      setPersisting(false);
    }
  };

  const handleExportJSON = async () => {
    const json = await RecipeStorage.exportJSON();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `rachel-recipes-backup-${dateStr}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('קובץ הגיבוי הורד בהצלחה למכשירך!');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus(null);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const result = await RecipeStorage.importJSON(text, importMode);
        if (result.errors && result.errors.length > 0) {
          const errText = result.errors.join(', ');
          setImportError(errText);
          toast.error(`שגיאה בייבוא: ${errText}`);
        } else {
          const successMsg = `יובאו בהצלחה ${result.importedCount} מתכונים!`;
          setImportStatus(successMsg);
          toast.success(successMsg);
          onRefreshRecipes();
        }
      } catch (err: any) {
        const errText = err.message || 'שגיאה בקריאת הקובץ';
        setImportError(errText);
        toast.error(errText);
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmReset = async () => {
    await RecipeStorage.resetToDefaults();
    onRefreshRecipes();
    toast.success('מתכוני הדוגמה שוחזרו בהצלחה!');
    setResetDialogOpen(false);
    onClose();
  };

  return (
    <>
      <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-lg w-[95vw] sm:w-full overflow-hidden p-0 rounded-3xl gap-0 border-border/80">
          <DialogHeader className="p-4 sm:p-5 border-b border-border bg-muted/40">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                <Database className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                  ניהול נתונים וגיבויים
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  הגנה מקומית, ייצוא גיבויים ושחזור מתכונים
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
            {/* Storage Resilience Status */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="size-5 text-stone-600 dark:text-stone-300" />
                  <span className="text-xs sm:text-sm font-bold text-foreground">
                    הגנת אחסון במכשיר (Persistent Storage)
                  </span>
                </div>

                {isPersisted ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 gap-1">
                    <ShieldCheck className="size-3.5 text-emerald-600" /> מוגן
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-100/70 text-amber-800 border-amber-300 gap-1">
                    <ShieldAlert className="size-3.5 text-amber-600" /> רגיל
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {isPersisted
                  ? 'הדפדפן מוגדר שלא למחוק את המתכונים גם בעת פינוי זיכרון אוטומטי. הנתונים שלך מוגנים.'
                  : 'בקש מהדפדפן להגן על המתכונים מפני מחיקת נתוני גלישה אוטומטית.'}
              </p>

              {!isPersisted && (
                <Button
                  size="sm"
                  onClick={handleRequestPersistence}
                  disabled={persisting}
                  className="w-full h-9 rounded-xl text-xs font-semibold"
                >
                  <ShieldCheck data-icon="inline-start" className="size-4 text-emerald-400" />
                  {persisting ? 'בודק הרשאה...' : 'הפעל הגנת אחסון קבועה'}
                </Button>
              )}
            </div>

            {/* Export Section */}
            <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileJson className="size-5 text-orange-600" />
                  <span className="text-xs sm:text-sm font-bold text-stone-900">
                    ייצוא גיבוי מלא (1-Click JSON)
                  </span>
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
                  {recipes.length} מתכונים
                </Badge>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                הורד את כל המתכונים שלך כקובץ גיבוי לטלפון או למחשב. תוכל להעביר אותו לכל מכשיר אחר.
              </p>

              <Button
                onClick={handleExportJSON}
                className="w-full h-10 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs active:scale-95"
              >
                <Download data-icon="inline-start" className="size-4" />
                הורד קובץ גיבוי (.json)
              </Button>
            </div>

            {/* Import Section */}
            <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3">
              <div className="flex items-center gap-2">
                <Upload className="size-5 text-foreground" />
                <span className="text-xs sm:text-sm font-bold text-foreground">
                  שחזור וייבוא מקובץ גיבוי
                </span>
              </div>

              {/* Mode selector */}
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="accent-primary"
                  />
                  <span>מיזוג עם הקיים</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="accent-primary"
                  />
                  <span>החלפת הכל</span>
                </label>
              </div>

              <label className="border-2 border-dashed border-border hover:border-primary rounded-2xl p-4 text-center cursor-pointer transition-colors block bg-card">
                <Upload className="size-6 text-muted-foreground mx-auto mb-1" />
                <span className="text-xs font-semibold text-foreground block">
                  לחץ לבחירת קובץ JSON לשחזור
                </span>
                <span className="text-[11px] text-muted-foreground">
                  תומך בקבצי גיבוי של RachelRecipes
                </span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {importStatus && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-1.5 font-medium">
                  <Check className="size-4 text-emerald-600 shrink-0" /> {importStatus}
                </div>
              )}

              {importError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-1.5 font-medium">
                  <AlertCircle className="size-4 text-rose-600 shrink-0" /> {importError}
                </div>
              )}
            </div>

            {/* Reset to defaults */}
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">רוצה להתחיל מחדש?</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setResetDialogOpen(true)}
                className="text-xs text-muted-foreground hover:text-destructive font-semibold h-8"
              >
                <RotateCcw data-icon="inline-start" className="size-3.5" />
                שחזר מתכוני דוגמה מקוריים
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Accessible Reset Confirmation Alert Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent className="rounded-2xl max-w-sm sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">שחזור מתכוני דוגמה</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              האם לשחזר את מתכוני הבסיס של רחל? פעולה זו תחליף את כל המתכונים הקיימים במתכוני הדוגמה המקוריים.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse sm:justify-start gap-2">
            <AlertDialogCancel className="rounded-xl">ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReset}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl"
            >
              שחזר עכשיו
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
