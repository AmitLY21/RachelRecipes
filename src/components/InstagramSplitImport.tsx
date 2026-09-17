import React, { useState, useEffect } from 'react';
import { Wand2, ArrowLeft, Check, Sparkles, Loader2 } from 'lucide-react';
import { InstagramIcon } from './Icons.tsx';
import { InstagramEmbed } from './InstagramEmbed.tsx';
import type { Recipe } from '../types/recipe.ts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface InstagramSplitImportProps {
  onSave: (recipeData: Partial<Recipe>) => void;
  onCancel: () => void;
  initialUrl?: string;
}

export const InstagramSplitImport: React.FC<InstagramSplitImportProps> = ({
  onSave,
  onCancel,
  initialUrl = '',
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [activeUrl, setActiveUrl] = useState(initialUrl);
  const [captionText, setCaptionText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [viewTab, setViewTab] = useState<'split' | 'embed' | 'editor'>('split');
  const [isExtracting, setIsExtracting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [stepsText, setStepsText] = useState('');
  const [notes, setNotes] = useState('');
  const [servings, setServings] = useState(4);
  const [prepTime, setPrepTime] = useState(20);
  const [cookTime, setCookTime] = useState(30);
  const [categoryInput, setCategoryInput] = useState('אינסטגרם');
  const [parsedFeedback, setParsedFeedback] = useState<string | null>(null);

  /**
   * Hebrew-aware intelligent parser for Instagram captions
   */
  const parseCaptionAndFill = (text: string) => {
    if (!text || !text.trim()) return;

    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#') && !l.startsWith('@'));

    if (lines.length === 0) return;

    let detectedTitle = '';
    const detectedIngredients: string[] = [];
    const detectedSteps: string[] = [];
    const detectedNotes: string[] = [];
    let state: 'before_ingredients' | 'ingredients' | 'steps' = 'before_ingredients';

    const ingredientsHeaderRegex = /(?:מצרכים|רכיבים|חומרים|לבצק|לקרם|לרוטב|למלית|מה צריך)/i;
    const stepsHeaderRegex = /(?:אופן ההכנה|הוראות הכנה|איך מכינים|שלבי הכנה|אופן הכנה|הכנה)/i;
    const actionVerbRegex = /^(?:צורבים|מערבבים|מבשלים|מחממים|אופים|מטגנים|חותכים|מוסיפים|יוצקים|טורפים|מניחים|מסדרים|מגלגלים|שמים|שופכים)/;

    for (const line of lines) {
      // Header matching
      if (ingredientsHeaderRegex.test(line)) {
        state = 'ingredients';
        continue;
      }
      if (stepsHeaderRegex.test(line)) {
        state = 'steps';
        continue;
      }

      if (state === 'before_ingredients') {
        if (!detectedTitle) {
          detectedTitle = line.replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\s*•\-#]+\s*/u, '').trim();
        } else {
          detectedNotes.push(line);
        }
      } else if (state === 'ingredients') {
        if (actionVerbRegex.test(line) || /^\d+[.)]\s*/.test(line)) {
          state = 'steps';
          detectedSteps.push(line);
        } else {
          detectedIngredients.push(line);
        }
      } else if (state === 'steps') {
        detectedSteps.push(line);
      }
    }

    if (detectedTitle) setTitle(detectedTitle);
    if (detectedIngredients.length > 0) {
      setIngredientsText(detectedIngredients.join('\n'));
    }
    if (detectedSteps.length > 0) {
      setStepsText(detectedSteps.join('\n'));
    }
    if (detectedNotes.length > 0) {
      setNotes(detectedNotes.join('\n'));
    }

    // Parse minutes
    const minutesMatch = text.match(/(\d+)\s*(?:דקות|דק׳|דק)/);
    if (minutesMatch) {
      setCookTime(parseInt(minutesMatch[1], 10));
    }

    // Auto-detect category
    if (/עוגה|שוקולד|עוגיות|פאי|קרם|קינוח/i.test(text)) {
      setCategoryInput('קינוחים, אפייה');
    } else if (/חלה|לחם|בצק|שמרים|פוקצ'ה/i.test(text)) {
      setCategoryInput('מאפים ולחמים');
    } else if (/פסטה|רוטב|שמנת|גבינ/i.test(text)) {
      setCategoryInput('עיקריות, חלבי');
    } else if (/דג|סלמון|דניס/i.test(text)) {
      setCategoryInput('דגים, עיקריות');
    } else if (/פרגית|בקר|עוף|בשר|סופריטו/i.test(text)) {
      setCategoryInput('עיקריות, בשרי');
    }

    const msg = `חולצו בהצלחה: ${detectedIngredients.length} מצרכים ו-${detectedSteps.length} שלבים!`;
    setParsedFeedback(msg);
    toast.success(msg);
    setTimeout(() => setParsedFeedback(null), 5000);
  };

  /**
   * Automatic extraction of Reel cover image & caption from server
   */
  const handleExtractFromUrl = async (inputUrl: string) => {
    const cleanInput = inputUrl.trim();
    if (!cleanInput) return;

    setActiveUrl(cleanInput);
    setIsExtracting(true);
    setParsedFeedback(null);

    try {
      const res = await fetch(`/api/instagram-extract?url=${encodeURIComponent(cleanInput)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.imageUrl) {
            setImageUrl(data.imageUrl);
          }
          if (data.caption) {
            setCaptionText(data.caption);
            parseCaptionAndFill(data.caption);
            toast.success('תמונת השער והוראות ההכנה נשלפו מאינסטגרם!');
          }
        }
      } else {
        toast.info('הווידג\'ט נטען. במידת הצורך הדבק את תיאור הפוסט ידנית.');
      }
    } catch {
      toast.info('הווידג\'ט נטען.');
    } finally {
      setIsExtracting(false);
    }
  };

  useEffect(() => {
    if (initialUrl && initialUrl.trim()) {
      const timer = setTimeout(() => {
        handleExtractFromUrl(initialUrl);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [initialUrl]);

  const handleLoadEmbed = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (url.trim()) {
      handleExtractFromUrl(url);
    }
  };

  const handleSaveRecipe = () => {
    if (!title.trim()) {
      toast.error('נא להזין כותרת למתכון');
      return;
    }

    const ingredients = ingredientsText
      .split('\n')
      .map((l) => l.trim().replace(/^[-•*]\s*/, ''))
      .filter((l) => l.length > 0);

    const steps = stepsText
      .split('\n')
      .map((l) => l.trim().replace(/^\d+[.)]\s*/, ''))
      .filter((l) => l.length > 0);

    const categories = categoryInput
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    onSave({
      title: title.trim(),
      sourceUrl: activeUrl,
      isInstagramEmbed: !!activeUrl,
      ingredients: ingredients.length > 0 ? ingredients : ['מצרך לדוגמה'],
      steps: steps.length > 0 ? steps : ['אופן הכנה לדוגמה'],
      notes: notes.trim(),
      baseServings: servings,
      prepTimeMinutes: prepTime,
      cookTimeMinutes: cookTime,
      categories: categories.length > 0 ? categories : ['אינסטגרם'],
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80',
    });
    toast.success('המתכון מאינסטגרם נשמר בהצלחה!');
  };

  return (
    <div className="bg-card rounded-3xl shadow-2xl border border-border overflow-hidden flex flex-col h-full max-h-[92vh]">
      {/* Top Header */}
      <div className="p-4 sm:p-5 border-b border-border bg-gradient-to-r from-orange-50/60 via-amber-50/40 to-orange-50/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-gradient-to-tr from-orange-500 via-rose-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
            <InstagramIcon className="size-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold text-foreground leading-tight">
              ייבוא פוסט / רילס מאינסטגרם
            </h2>
            <p className="text-xs text-muted-foreground">
              שליפה אוטומטית של תמונת השער, המצרכים וההוראות
            </p>
          </div>
        </div>

        {/* Responsive Layout Controls */}
        <div className="flex items-center gap-2">
          <Tabs
            value={viewTab}
            onValueChange={(val) => setViewTab(val as 'split' | 'embed' | 'editor')}
            className="lg:hidden"
          >
            <TabsList className="h-8 p-0.5 rounded-xl bg-muted">
              <TabsTrigger value="split" className="text-xs px-2.5 h-7 rounded-lg">מפוצל</TabsTrigger>
              <TabsTrigger value="embed" className="text-xs px-2.5 h-7 rounded-lg">אינסטגרם</TabsTrigger>
              <TabsTrigger value="editor" className="text-xs px-2.5 h-7 rounded-lg">טופס</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="size-9 rounded-xl text-muted-foreground hover:text-foreground"
            title="סגור"
          >
            <ArrowLeft className="size-5" />
          </Button>
        </div>
      </div>

      {/* URL Input Bar */}
      <div className="p-3 sm:p-4 bg-muted/30 border-b border-border">
        <form onSubmit={handleLoadEmbed} className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="הדבק קישור לרילס מאינסטגרם (לדוגמה: https://www.instagram.com/reel/...)"
              className="h-10 rounded-xl pr-10 text-xs sm:text-sm"
              dir="ltr"
            />
            <InstagramIcon className="size-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <Button
            type="submit"
            disabled={isExtracting}
            className="h-10 px-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs whitespace-nowrap disabled:opacity-50"
          >
            {isExtracting ? (
              <>
                <Loader2 data-icon="inline-start" className="size-4 animate-spin" />
                מחלץ נתונים...
              </>
            ) : (
              <>
                <Wand2 data-icon="inline-start" className="size-4" />
                טען וחלץ
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Split Main Content Container */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-border">
        {/* Left / Top Side: Instagram Widget */}
        <div
          className={`p-4 overflow-y-auto bg-muted/20 flex flex-col items-center ${
            viewTab === 'editor' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          <div className="w-full max-w-[500px]">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                תצוגה חיה מאינסטגרם
              </span>
              {activeUrl && (
                <Badge variant="outline" className="text-xs text-emerald-700 bg-emerald-50 border-emerald-200">
                  פוסט מקושר
                </Badge>
              )}
            </div>

            {activeUrl ? (
              <InstagramEmbed url={activeUrl} />
            ) : (
              <div className="p-8 text-center bg-card rounded-2xl border border-border shadow-xs">
                <div className="size-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-3">
                  <InstagramIcon className="size-6" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1">
                  טרם נטען פוסט
                </h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  הדבק קישור למעלה ולחץ &quot;טען וחלץ&quot; כדי לחלץ אוטומטית את תמונת הרילס, המצרכים וההוראות.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right / Bottom Side: Rapid Paste & Recipe Editor */}
        <div
          className={`p-4 sm:p-6 overflow-y-auto bg-card flex flex-col space-y-4 ${
            viewTab === 'embed' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Cover Image Preview if Extracted */}
          {imageUrl && (
            <div className="p-3 bg-muted/40 border border-border rounded-2xl flex items-center gap-3">
              <img
                src={imageUrl}
                alt="תמונת שער שנשלפה"
                referrerPolicy="no-referrer"
                className="size-16 sm:size-20 object-cover rounded-xl shadow-2xs shrink-0"
              />
              <div className="flex-1 min-w-0">
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 mb-1">
                  <Check className="size-3 text-emerald-600" /> תמונת הרילס נשלפה אוטומטית
                </Badge>
                <p className="text-xs text-muted-foreground truncate" dir="ltr">
                  {imageUrl}
                </p>
              </div>
            </div>
          )}

          {/* Rapid Paste Caption Section */}
          <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-amber-950 font-semibold text-sm">
                <Sparkles className="size-4 text-amber-600" />
                <span>טקסט תיאור הפוסט (Caption)</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => parseCaptionAndFill(captionText)}
                disabled={!captionText.trim()}
                className="h-7 text-xs rounded-xl bg-white border-amber-200 text-amber-900 hover:bg-amber-100/60"
              >
                <Wand2 data-icon="inline-start" className="size-3" />
                חלץ שוב
              </Button>
            </div>

            <Textarea
              value={captionText}
              onChange={(e) => setCaptionText(e.target.value)}
              placeholder="הטקסט יישלף אוטומטית בעת הזנת הקישור, או שתוכל להדביק כאן ידנית וללחוץ חלץ..."
              rows={3}
              className="bg-white border-amber-200 text-xs sm:text-sm rounded-xl"
            />

            {parsedFeedback && (
              <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 font-semibold flex items-center gap-1.5">
                <Check className="size-4 text-emerald-600 shrink-0" />
                {parsedFeedback}
              </div>
            )}
          </div>

          {/* Recipe Fields */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ig-title" className="text-xs font-semibold text-foreground">
                שם המתכון *
              </Label>
              <Input
                id="ig-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="למשל: סופריטו פרגיות"
                className="h-10 text-sm font-semibold rounded-xl"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label htmlFor="ig-servings" className="text-xs font-medium text-muted-foreground">
                  מנות
                </Label>
                <Input
                  id="ig-servings"
                  type="number"
                  min={1}
                  value={servings}
                  onChange={(e) => setServings(parseInt(e.target.value, 10) || 1)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ig-prep" className="text-xs font-medium text-muted-foreground">
                  הכנה (דק׳)
                </Label>
                <Input
                  id="ig-prep"
                  type="number"
                  min={0}
                  value={prepTime}
                  onChange={(e) => setPrepTime(parseInt(e.target.value, 10) || 0)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ig-cook" className="text-xs font-medium text-muted-foreground">
                  בישול/אפייה
                </Label>
                <Input
                  id="ig-cook"
                  type="number"
                  min={0}
                  value={cookTime}
                  onChange={(e) => setCookTime(parseInt(e.target.value, 10) || 0)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ig-cats" className="text-xs font-semibold text-foreground">
                קטגוריות (מופרדות בפסיק)
              </Label>
              <Input
                id="ig-cats"
                type="text"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                placeholder="עיקריות, בשרי"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="ig-ingredients" className="text-xs font-semibold text-foreground">
                  מצרכים (שורה לכל מצרך) *
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  כל מצרך בשורה נפרדת
                </span>
              </div>
              <Textarea
                id="ig-ingredients"
                value={ingredientsText}
                onChange={(e) => setIngredientsText(e.target.value)}
                placeholder="15 תפוחי אדמה קטנים&#10;700 גרם סטייק פרגית&#10;5 בצלים&#10;רבע כוס שמן זית"
                rows={5}
                className="text-xs leading-relaxed font-mono rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="ig-steps" className="text-xs font-semibold text-foreground">
                  אופן ההכנה (שורה לכל שלב) *
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  כל שלב בשורה נפרדת
                </span>
              </div>
              <Textarea
                id="ig-steps"
                value={stepsText}
                onChange={(e) => setStepsText(e.target.value)}
                placeholder="צורבים את הפרגית עם שמן זית ומעט מלח...&#10;מוסיפים את הבצלים ומבשלים 35 דקות."
                rows={4}
                className="text-xs leading-relaxed rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ig-notes" className="text-xs font-semibold text-foreground">
                הערות ודגשים לשמירה
              </Label>
              <Textarea
                id="ig-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="דגשים לבישול, המרות אפשריות..."
                rows={2}
                className="text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-2 sticky bottom-0 bg-card py-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              className="rounded-xl text-xs font-medium"
            >
              ביטול
            </Button>
            <Button
              type="button"
              onClick={handleSaveRecipe}
              className="h-10 px-5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-primary/20"
            >
              <Check data-icon="inline-start" className="size-4" />
              שמור מתכון לספר
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
