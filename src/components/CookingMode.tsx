import React, { useState, useEffect, useMemo } from 'react';
import {
  Sun,
  CheckCircle2,
  Circle,
  Timer as TimerIcon,
  Play,
  Pause,
  RotateCcw,
  ArrowRight,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  Edit3,
  Sparkles,
} from 'lucide-react';
import { SunOffIcon } from './Icons.tsx';
import confetti from 'canvas-confetti';
import type { Recipe, ScaledIngredient } from '../types/recipe.ts';
import { scaleIngredientsList } from '../utils/ingredientScaler.ts';
import { useWakeLock } from '../hooks/useWakeLock.ts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Input } from '@/components/ui/input';

interface CookingModeProps {
  recipe: Recipe;
  onClose: () => void;
  onUpdateRecipe: (updatedRecipe: Recipe) => void;
}

export const CookingMode: React.FC<CookingModeProps> = ({
  recipe,
  onClose,
  onUpdateRecipe,
}) => {
  const wakeLock = useWakeLock();

  // Multiplier / Servings State
  const [multiplier, setMultiplier] = useState<number>(1);
  const [customServings, setCustomServings] = useState<number>(recipe.baseServings);

  // Ingredient Checklist State
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  // Step Checklist State
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  // Manual Overrides State
  const [overrides, setOverrides] = useState<Record<number, string>>(
    recipe.manualIngredientOverrides || {}
  );
  const [editingIngredientIdx, setEditingIngredientIdx] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  // Kitchen Timer State
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerDrawerOpen, setTimerDrawerOpen] = useState<boolean>(false);

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Auto-request wake lock on entering cooking mode
  const { request: requestWakeLock, release: releaseWakeLock } = wakeLock;
  useEffect(() => {
    requestWakeLock().catch(() => {});
    return () => {
      releaseWakeLock().catch(() => {});
    };
  }, [requestWakeLock, releaseWakeLock]);

  // Update servings when multiplier changes
  const handleMultiplierSelect = (m: number) => {
    setMultiplier(m);
    setCustomServings(Math.round(recipe.baseServings * m * 10) / 10);
  };

  const handleCustomServingsChange = (servings: number) => {
    if (servings < 1) return;
    setCustomServings(servings);
    setMultiplier(servings / recipe.baseServings);
  };

  // Compute Scaled Ingredients
  const scaledIngredients: ScaledIngredient[] = useMemo(() => {
    return scaleIngredientsList(recipe.ingredients, multiplier, overrides);
  }, [recipe.ingredients, multiplier, overrides]);

  // Toggle Ingredient Checked
  const toggleIngredient = (idx: number) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  // Toggle Step Completed
  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) => {
      const updated = { ...prev, [idx]: !prev[idx] };
      // Check if all steps are now completed
      const allDone = recipe.steps.length > 0 && recipe.steps.every((_, i) => updated[i]);
      if (allDone) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
      return updated;
    });
  };

  // Save manual override for ingredient
  const handleSaveOverride = (idx: number) => {
    const updated = { ...overrides, [idx]: editingText.trim() };
    if (!editingText.trim()) {
      delete updated[idx];
    }
    setOverrides(updated);
    setEditingIngredientIdx(null);
    onUpdateRecipe({
      ...recipe,
      manualIngredientOverrides: updated,
    });
  };

  // Web Audio Synth Chime for Kitchen Timer
  const playTimerSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880.0, ctx.currentTime + 0.15); // A5
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.3); // D6

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {
      // Audio not permitted or supported
    }
  };

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timerSecondsLeft > 0) {
      interval = setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            playTimerSound();
            confetti({ particleCount: 50, spread: 60 });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSecondsLeft]);

  const startTimer = (seconds: number) => {
    setTimerSecondsLeft(seconds);
    setTimerRunning(true);
    setTimerDrawerOpen(true);
  };

  const formatTimerDisplay = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Ingredient progress
  const ingredientsCount = recipe.ingredients.length;
  const checkedCount = Object.values(checkedIngredients).filter(Boolean).length;
  const ingredientProgressPct = ingredientsCount > 0 ? (checkedCount / ingredientsCount) * 100 : 0;

  // Step progress
  const stepsCount = recipe.steps.length;
  const stepsDoneCount = Object.values(completedSteps).filter(Boolean).length;
  const stepsProgressPct = stepsCount > 0 ? (stepsDoneCount / stepsCount) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950 text-stone-100 flex flex-col overflow-hidden select-none">
      {/* Top Kitchen Bar */}
      <header className="px-3 sm:px-6 py-3 bg-stone-900/95 border-b border-stone-800 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="h-9 px-3 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700"
          >
            <ArrowRight data-icon="inline-start" className="size-4" />
            <span className="hidden sm:inline">חזרה למתכון</span>
          </Button>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg font-black text-amber-400 truncate">
              {recipe.title}
            </h1>
            <span className="text-[11px] text-stone-400 flex items-center gap-1.5 truncate">
              <span>מצב בישול במטבח</span>
              <span>•</span>
              <span className="text-amber-300 font-mono font-bold">{customServings} מנות</span>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Wake Lock Button */}
          <Button
            variant={wakeLock.isActive ? 'default' : 'secondary'}
            size="sm"
            onClick={() => wakeLock.toggle()}
            title={wakeLock.isActive ? 'מסך נעול דולק (פעיל)' : 'לחץ להשארת מסך דולק'}
            className={`h-9 px-2.5 sm:px-3 text-xs font-semibold rounded-xl ${
              wakeLock.isActive
                ? 'bg-amber-500 text-stone-950 hover:bg-amber-400 shadow-sm shadow-amber-500/20'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700 border border-stone-700'
            }`}
          >
            {wakeLock.isActive ? (
              <>
                <Sun data-icon="inline-start" className="size-4 text-stone-950 animate-pulse" />
                <span className="hidden md:inline">מסך פעיל</span>
              </>
            ) : (
              <>
                <SunOffIcon data-icon="inline-start" className="size-4 text-stone-400" />
                <span className="hidden md:inline">שמור מסך דולק</span>
              </>
            )}
          </Button>

          {/* Kitchen Timer Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setTimerDrawerOpen(!timerDrawerOpen)}
            className={`h-9 px-3 rounded-xl text-xs font-semibold border ${
              timerRunning
                ? 'bg-orange-600 hover:bg-orange-500 text-white border-orange-500 animate-pulse'
                : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700'
            }`}
          >
            <TimerIcon data-icon="inline-start" className="size-4" />
            <span className="font-mono">
              {timerRunning ? formatTimerDisplay(timerSecondsLeft) : 'טיימר'}
            </span>
          </Button>

          {/* Fullscreen Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="size-9 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-xl"
            title="מסך מלא"
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </Button>
        </div>
      </header>

      {/* Servings Stepper Bar */}
      <div className="bg-stone-950/90 px-3 sm:px-6 py-2.5 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-stone-400 font-medium">כמות מנות:</span>
          <div className="flex items-center bg-stone-900 border border-stone-700 rounded-xl overflow-hidden p-0.5">
            <button
              type="button"
              onClick={() => handleCustomServingsChange(customServings - 1)}
              className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors"
              title="הפחת מנה"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="px-3 font-bold text-sm text-amber-400 font-mono">
              {customServings}
            </span>
            <button
              type="button"
              onClick={() => handleCustomServingsChange(customServings + 1)}
              className="p-1.5 text-stone-400 hover:text-stone-100 hover:bg-stone-800 rounded-lg transition-colors"
              title="הוסף מנה"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Multiplier Pills */}
        <div className="flex items-center gap-2">
          <span className="text-stone-500 hidden sm:inline">מכפיל מהיר:</span>
          <ToggleGroup
            type="single"
            value={String(multiplier)}
            onValueChange={(val) => {
              if (val) handleMultiplierSelect(Number(val));
            }}
            className="gap-1 bg-stone-900 p-0.5 rounded-xl border border-stone-800"
          >
            {[0.5, 1, 1.5, 2, 3].map((m) => (
              <ToggleGroupItem
                key={m}
                value={String(m)}
                className="h-7 px-2 text-xs font-bold rounded-lg text-stone-400 data-[state=on]:bg-amber-500 data-[state=on]:text-stone-950"
              >
                {m}×
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>

      {/* Main Cooking Split Grid */}
      <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-stone-800">
        {/* Ingredients Side Checklist (5 cols on lg) */}
        <div className="lg:col-span-5 p-4 sm:p-6 overflow-y-auto bg-stone-900/40">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base sm:text-lg font-bold text-amber-400">
              מצרכים ({checkedCount}/{ingredientsCount})
            </h2>
            <Badge variant="outline" className="text-xs font-mono text-amber-400 border-amber-500/30 bg-amber-500/10">
              {Math.round(ingredientProgressPct)}%
            </Badge>
          </div>

          {/* Progress Bar */}
          <Progress value={ingredientProgressPct} className="h-1.5 mb-4 bg-stone-800" />

          <p className="text-[11px] text-stone-400 mb-3">
            סמן מצרכים שהוכנו. לחץ על העיפרון לעריכה ידנית.
          </p>

          <div className="space-y-2">
            {scaledIngredients.map((item, idx) => {
              const isChecked = !!checkedIngredients[idx];
              const isEditing = editingIngredientIdx === idx;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                    isChecked
                      ? 'bg-stone-950/40 border-stone-800/60 opacity-60'
                      : 'bg-stone-800/80 border-stone-700/80 hover:border-amber-500/50'
                  }`}
                >
                  <div
                    onClick={() => !isEditing && toggleIngredient(idx)}
                    className="flex-1 flex items-start gap-3 cursor-pointer"
                  >
                    <div className="mt-0.5 text-amber-400 shrink-0">
                      {isChecked ? (
                        <CheckCircle2 className="size-5 text-emerald-400" />
                      ) : (
                        <Circle className="size-5 text-stone-500" />
                      )}
                    </div>

                    {isEditing ? (
                      <div className="flex-1 flex gap-2">
                        <Input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="h-8 bg-stone-900 border-amber-500 text-xs text-stone-100 rounded-lg"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveOverride(idx)}
                          className="h-8 bg-amber-500 text-stone-950 hover:bg-amber-400 text-xs font-bold rounded-lg"
                        >
                          שמור
                        </Button>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <span
                          className={`text-sm leading-relaxed ${
                            isChecked ? 'line-through text-stone-500' : 'text-stone-100 font-medium'
                          }`}
                        >
                          {item.numberDisplay ? (
                            <>
                              <span
                                dir="ltr"
                                className="font-bold text-amber-400 inline-block px-1.5 py-0.5 rounded bg-stone-900/90 border border-stone-700/60 mr-1 font-mono"
                              >
                                {item.numberDisplay}
                              </span>
                              <span className="text-stone-200">{item.unitAndRest}</span>
                            </>
                          ) : (
                            <span>{item.scaledText}</span>
                          )}
                        </span>

                        {item.isOverridden && (
                          <span className="block text-[10px] text-amber-400 mt-0.5">
                            (מותאם אישית)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingIngredientIdx(idx);
                        setEditingText(item.cleanScaledText);
                      }}
                      className="text-stone-500 hover:text-amber-400 p-1 rounded transition-colors"
                      title="ערוך שורה זו ידנית"
                    >
                      <Edit3 className="size-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Steps Side (7 cols on lg) */}
        <div className="lg:col-span-7 p-4 sm:p-6 overflow-y-auto flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-amber-400">
                שלבי ההכנה
              </h2>
              <span className="text-xs text-stone-400 font-mono">
                ({stepsDoneCount}/{stepsCount})
              </span>
            </div>
            {stepsDoneCount === stepsCount && stepsCount > 0 && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs font-bold gap-1">
                <Sparkles className="size-3.5" /> סיימת את כל השלבים!
              </Badge>
            )}
          </div>

          <Progress value={stepsProgressPct} className="h-1.5 bg-stone-800" />

          <div className="space-y-3">
            {recipe.steps.map((step, idx) => {
              const isCompleted = !!completedSteps[idx];
              const isActive = activeStepIndex === idx;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setActiveStepIndex(idx);
                    toggleStep(idx);
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isCompleted
                      ? 'bg-stone-950/40 border-stone-800 opacity-60'
                      : isActive
                      ? 'bg-amber-950/20 border-amber-500/80 ring-1 ring-amber-500/30 shadow-lg'
                      : 'bg-stone-800/70 border-stone-700/70 hover:border-stone-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`size-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                        isCompleted
                          ? 'bg-emerald-500 text-stone-950'
                          : isActive
                          ? 'bg-amber-500 text-stone-950'
                          : 'bg-stone-700 text-stone-300'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="size-4" /> : idx + 1}
                    </div>

                    <div className="flex-1">
                      <p
                        className={`text-sm sm:text-base leading-relaxed ${
                          isCompleted
                            ? 'line-through text-stone-500'
                            : isActive
                            ? 'text-stone-50 font-semibold'
                            : 'text-stone-200'
                        }`}
                      >
                        {step}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recipe Notes if available */}
          {recipe.notes && (
            <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <h3 className="text-xs font-bold text-amber-400 mb-1">
                הערות ודגשים למתכון:
              </h3>
              <p className="text-xs text-stone-300 leading-relaxed">
                {recipe.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Kitchen Timer Drawer */}
      {timerDrawerOpen && (
        <div className="bg-stone-950 border-t border-stone-800 p-4 shadow-2xl transition-all">
          <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white font-mono text-xl font-bold shadow-lg shadow-orange-600/30 shrink-0">
                <TimerIcon className="size-6" />
              </div>
              <div>
                <div className="text-2xl font-mono font-black tracking-wider text-amber-400">
                  {formatTimerDisplay(timerSecondsLeft)}
                </div>
                <div className="text-xs text-stone-400">
                  {timerRunning ? 'טיימר בישול פעיל...' : 'טיימר מושהה / מוכן'}
                </div>
              </div>
            </div>

            {/* Quick Timer Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[1, 3, 5, 10, 15, 30].map((mins) => (
                <Button
                  key={mins}
                  variant="secondary"
                  size="sm"
                  onClick={() => startTimer(mins * 60)}
                  className="h-8 px-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-semibold"
                >
                  +{mins} דק׳
                </Button>
              ))}
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                onClick={() => setTimerRunning(!timerRunning)}
                className={`size-10 rounded-xl font-bold ${
                  timerRunning
                    ? 'bg-amber-500 text-stone-950 hover:bg-amber-400'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                }`}
              >
                {timerRunning ? <Pause className="size-5" /> : <Play className="size-5" />}
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => {
                  setTimerRunning(false);
                  setTimerSecondsLeft(0);
                }}
                className="size-10 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl"
                title="אפס טיימר"
              >
                <RotateCcw className="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTimerDrawerOpen(false)}
                className="text-xs text-stone-500 hover:text-stone-300 h-8"
              >
                הסתר
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
