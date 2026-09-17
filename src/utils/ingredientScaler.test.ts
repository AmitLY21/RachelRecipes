import assert from 'node:assert';
import test from 'node:test';
import { scaleIngredientLine } from './ingredientScaler.ts';

test('First-match scope: only first quantity scales (oven temperature untouched)', () => {
  const result = scaleIngredientLine('1 1/2 כוסות קמח, לאפות ב-180 מעלות', 2);
  assert.strictEqual(result.isScaled, true);
  assert.strictEqual(result.originalQuantity, 1.5);
  assert.strictEqual(result.scaledQuantity, 3);
  assert.strictEqual(result.cleanScaledText, '3 כוסות קמח, לאפות ב-180 מעלות');
  assert.ok(result.scaledText.includes('180 מעלות'), 'Temperature 180 should stay unchanged');
  assert.ok(result.scaledText.includes('\u20683\u2069'), 'Should contain bidi isolated 3');
});

test('Hebrew fraction words: "חצי כפית מלח"', () => {
  const result2x = scaleIngredientLine('חצי כפית מלח', 2);
  assert.strictEqual(result2x.originalQuantity, 0.5);
  assert.strictEqual(result2x.scaledQuantity, 1);
  assert.strictEqual(result2x.cleanScaledText, '1 כפית מלח');

  const result3x = scaleIngredientLine('חצי כפית מלח', 3);
  assert.strictEqual(result3x.originalQuantity, 0.5);
  assert.strictEqual(result3x.scaledQuantity, 1.5);
  assert.strictEqual(result3x.cleanScaledText, '1 1/2 כפית מלח');
});

test('Hebrew fraction words: "רבע כוס שמן"', () => {
  const result = scaleIngredientLine('רבע כוס שמן', 2);
  assert.strictEqual(result.originalQuantity, 0.25);
  assert.strictEqual(result.scaledQuantity, 0.5);
  assert.strictEqual(result.cleanScaledText, '1/2 כוס שמן');
});

test('Hebrew fraction words: "שליש כוס סוכר"', () => {
  const result = scaleIngredientLine('שליש כוס סוכר', 3);
  assert.strictEqual(result.scaledQuantity, 1);
  assert.strictEqual(result.cleanScaledText, '1 כוס סוכר');
});

test('Hebrew composite: "1 וחצי כוסות סוכר"', () => {
  const result = scaleIngredientLine('1 וחצי כוסות סוכר', 2);
  assert.strictEqual(result.originalQuantity, 1.5);
  assert.strictEqual(result.scaledQuantity, 3);
  assert.strictEqual(result.cleanScaledText, '3 כוסות סוכר');
});

test('Grams and units: "200g קמח"', () => {
  const result = scaleIngredientLine('200g קמח', 0.5);
  assert.strictEqual(result.originalQuantity, 200);
  assert.strictEqual(result.scaledQuantity, 100);
  assert.strictEqual(result.cleanScaledText, '100g קמח');
});

test('Composite slash fraction: "2 1/4 כוסות חלב"', () => {
  const result = scaleIngredientLine('2 1/4 כוסות חלב', 2);
  assert.strictEqual(result.originalQuantity, 2.25);
  assert.strictEqual(result.scaledQuantity, 4.5);
  assert.strictEqual(result.cleanScaledText, '4 1/2 כוסות חלב');
});

test('Vulgar fractions: "½ כוס שמן"', () => {
  const result = scaleIngredientLine('½ כוס שמן', 2);
  assert.strictEqual(result.originalQuantity, 0.5);
  assert.strictEqual(result.scaledQuantity, 1);
  assert.strictEqual(result.cleanScaledText, '1 כוס שמן');
});

test('Line without numbers: "קמצוץ פלפל שחור לפי הטעם"', () => {
  const result = scaleIngredientLine('קמצוץ פלפל שחור לפי הטעם', 2);
  assert.strictEqual(result.isScaled, false);
  assert.strictEqual(result.cleanScaledText, 'קמצוץ פלפל שחור לפי הטעם');
});

test('Manual override takes precedence over auto-scaling', () => {
  const result = scaleIngredientLine('1 כוס סוכר', 3, 'השתמשתי בסילאן במקום');
  assert.strictEqual(result.isOverridden, true);
  assert.strictEqual(result.cleanScaledText, 'השתמשתי בסילאן במקום');
});
