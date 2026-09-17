import type { ScaledIngredient } from '../types/recipe.ts';

/**
 * Unicode vulgar fraction mappings
 */
const VULGAR_FRACTIONS: Record<string, number> = {
  '½': 0.5,
  '⅓': 1 / 3,
  '¼': 0.25,
  '¾': 0.75,
  '⅔': 2 / 3,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
};

/**
 * Hebrew fraction phrases mapped to numeric equivalents.
 * Ordered from longest match to shortest to prevent partial matching.
 */
const HEBREW_FRACTION_MAP: Array<{ regex: RegExp; value: number }> = [
  { regex: /^(?:שלושה\s+רבעים|שלושת\s+רבעי)/i, value: 0.75 },
  { regex: /^(?:שני\s+שלישים|שני\s+שליש|שתי\s+שליש)/i, value: 2 / 3 },
  { regex: /^(?:אחד\s+וחצי|אחת\s+וחצי)/i, value: 1.5 },
  { regex: /^(?:שניים\s+וחצי|שתיים\s+וחצי)/i, value: 2.5 },
  { regex: /^(?:שלושה\s+וחצי|שלוש\s+וחצי)/i, value: 3.5 },
  { regex: /^(?:ארבעה\s+וחצי|ארבע\s+וחצי)/i, value: 4.5 },
  { regex: /^(?:אחד\s+ורבע|אחת\s+ורבע)/i, value: 1.25 },
  { regex: /^(?:שניים\s+ורבע|שתיים\s+ורבע)/i, value: 2.25 },
  { regex: /^חצי/i, value: 0.5 },
  { regex: /^רבע/i, value: 0.25 },
  { regex: /^שליש/i, value: 1 / 3 },
];

/**
 * Parses numeric composite fraction strings:
 * - "1 1/2" -> 1.5
 * - "1½" -> 1.5
 * - "1/2" -> 0.5
 * - "2.5" -> 2.5
 * - "3" -> 3
 */
function parseNumericFraction(str: string): number | null {
  const trimmed = str.trim();

  // Check direct vulgar fraction
  if (VULGAR_FRACTIONS[trimmed] !== undefined) {
    return VULGAR_FRACTIONS[trimmed];
  }

  // Mixed number with vulgar fraction e.g. "1½" or "2 ¾"
  const mixedVulgar = trimmed.match(/^(\d+)\s*([½⅓¼¾⅔⅛⅜⅝⅞])$/);
  if (mixedVulgar) {
    const whole = parseInt(mixedVulgar[1], 10);
    const frac = VULGAR_FRACTIONS[mixedVulgar[2]] || 0;
    return whole + frac;
  }

  // Mixed number with standard slash e.g. "1 1/2" or "2  3/4"
  const mixedSlash = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedSlash) {
    const whole = parseInt(mixedSlash[1], 10);
    const num = parseInt(mixedSlash[2], 10);
    const den = parseInt(mixedSlash[3], 10);
    if (den !== 0) {
      return whole + num / den;
    }
  }

  // Simple fraction e.g. "1/2" or "3/4"
  const simpleSlash = trimmed.match(/^(\d+)\/(\d+)$/);
  if (simpleSlash) {
    const num = parseInt(simpleSlash[1], 10);
    const den = parseInt(simpleSlash[2], 10);
    if (den !== 0) {
      return num / den;
    }
  }

  // Composite with Hebrew 'וחצי' or 'ורבע' e.g. "1 וחצי", "2 ורבע"
  const numHebrewFrac = trimmed.match(/^(\d+)\s*ו?(חצי|רבע|שליש)$/);
  if (numHebrewFrac) {
    const whole = parseInt(numHebrewFrac[1], 10);
    const fracWord = numHebrewFrac[2];
    const fracVal = fracWord === 'חצי' ? 0.5 : fracWord === 'רבע' ? 0.25 : 1 / 3;
    return whole + fracVal;
  }

  // Standard float or integer
  const parsed = parseFloat(trimmed);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Formats a quantity nicely as a clean fraction or decimal
 */
export function formatQuantity(num: number): string {
  if (num <= 0) return '0';

  // Check if near whole number
  const roundedWhole = Math.round(num);
  if (Math.abs(num - roundedWhole) < 0.015) {
    return roundedWhole.toString();
  }

  const whole = Math.floor(num);
  const frac = num - whole;

  // Fraction approximations
  const fractions: Array<{ val: number; text: string }> = [
    { val: 0.125, text: '1/8' },
    { val: 0.25, text: '1/4' },
    { val: 0.333, text: '1/3' },
    { val: 0.5, text: '1/2' },
    { val: 0.666, text: '2/3' },
    { val: 0.75, text: '3/4' },
    { val: 0.875, text: '7/8' },
  ];

  for (const f of fractions) {
    if (Math.abs(frac - f.val) < 0.035) {
      return whole > 0 ? `${whole} ${f.text}` : f.text;
    }
  }

  // Otherwise format with 1 or 2 decimals
  const formatted = num.toFixed(2).replace(/\.?0+$/, '');
  return formatted;
}

/**
 * Wraps text in Unicode Directional Isolation markers (\u2068...\u2069)
 * for safe RTL rendering without punctuation flipping.
 */
export function bidiIsolate(text: string): string {
  return `\u2068${text}\u2069`;
}

/**
 * Parses and scales an individual ingredient line.
 * Rule 1: FIRST-MATCH SCOPE only. Only scales the first quantity found.
 * Rule 2: Composite Fractions & Mixed Numbers (e.g., "1 1/2", "2 1/4").
 * Rule 3: Hebrew Fraction Words ("חצי", "רבע", "שליש").
 * Rule 4: BiDi isolation on output string.
 */
export function scaleIngredientLine(
  line: string,
  multiplier: number,
  manualOverride?: string
): ScaledIngredient {
  const originalText = line.trim();

  if (manualOverride !== undefined && manualOverride.trim() !== '') {
    return {
      originalText,
      scaledText: manualOverride,
      cleanScaledText: manualOverride,
      isScaled: true,
      isOverridden: true,
    };
  }

  if (multiplier === 1 || !originalText) {
    return {
      originalText,
      scaledText: originalText,
      cleanScaledText: originalText,
      isScaled: false,
      isOverridden: false,
    };
  }

  // Check Hebrew fraction phrases first at start or after optional dash/bullet
  const cleanLine = originalText.replace(/^[-•*–—]\s*/, '');
  const prefixMatch = originalText.match(/^([-•*–—]\s*)/);
  const prefix = prefixMatch ? prefixMatch[1] : '';

  // 1. Try Hebrew fraction word at the beginning of the ingredient
  for (const item of HEBREW_FRACTION_MAP) {
    const match = cleanLine.match(item.regex);
    if (match) {
      const originalQuantity = item.value;
      const scaledQuantity = originalQuantity * multiplier;
      const formatted = formatQuantity(scaledQuantity);
      const rest = cleanLine.slice(match[0].length).trim();
      
      const numberDisplay = formatted;
      const scaledText = `${prefix}${bidiIsolate(formatted)} ${rest}`.trim();
      const cleanScaledText = `${prefix}${formatted} ${rest}`.trim();

      return {
        originalText,
        scaledText,
        cleanScaledText,
        originalQuantity,
        scaledQuantity,
        isScaled: true,
        isOverridden: false,
        unitAndRest: rest,
        numberDisplay,
      };
    }
  }

  // 2. Regex for First-Match scope:
  // Matches:
  // - Mixed numbers: "1 1/2", "2  3/4"
  // - Number with Hebrew fraction: "1 וחצי", "2 ורבע"
  // - Vulgar fractions with/without whole: "1½", "½"
  // - Simple fractions: "1/2", "3/4"
  // - Decimals / integers: "200", "1.5", "3"
  const firstQuantityRegex = /(?:(\d+\s*ו?(?:חצי|רבע|שליש))|(\d+\s+\d+\/\d+)|(\d+\s*[½⅓¼¾⅔⅛⅜⅝⅞])|(\d+\/\d+)|([½⅓¼¾⅔⅛⅜⅝⅞])|(\d+(?:\.\d+)?))/;

  const match = cleanLine.match(firstQuantityRegex);
  if (!match || match.index === undefined) {
    // No quantity found (e.g. "מלח ופלפל לפי הטעם")
    return {
      originalText,
      scaledText: originalText,
      cleanScaledText: originalText,
      isScaled: false,
      isOverridden: false,
    };
  }

  const rawQuantityStr = match[0];
  const originalQuantity = parseNumericFraction(rawQuantityStr);

  if (originalQuantity === null || isNaN(originalQuantity)) {
    return {
      originalText,
      scaledText: originalText,
      cleanScaledText: originalText,
      isScaled: false,
      isOverridden: false,
    };
  }

  const scaledQuantity = originalQuantity * multiplier;
  const formatted = formatQuantity(scaledQuantity);

  const before = cleanLine.slice(0, match.index);
  const after = cleanLine.slice(match.index + rawQuantityStr.length);

  // Check if unit directly follows without space, e.g. "200g" -> "400g"
  const hasDirectUnit = /^[a-zA-Zגמ״״]+/.test(after);
  const separator = hasDirectUnit || after.startsWith(' ') || after === '' ? '' : ' ';

  const scaledText = `${prefix}${before}${bidiIsolate(formatted)}${separator}${after}`.trim();
  const cleanScaledText = `${prefix}${before}${formatted}${separator}${after}`.trim();

  return {
    originalText,
    scaledText,
    cleanScaledText,
    originalQuantity,
    scaledQuantity,
    isScaled: true,
    isOverridden: false,
    unitAndRest: after.trim(),
    numberDisplay: formatted,
  };
}

/**
 * Scales an array of ingredients with given multiplier and manual overrides
 */
export function scaleIngredientsList(
  ingredients: string[],
  multiplier: number,
  overrides?: Record<number, string>
): ScaledIngredient[] {
  return ingredients.map((item, index) =>
    scaleIngredientLine(item, multiplier, overrides?.[index])
  );
}
