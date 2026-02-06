

# Fix: Ensure Values are Properly Parsed as Numbers

## Problem Diagnosis

For input `[3,4,3,2,1,4,2,1,3]` with counts `{1:2, 2:2, 3:3, 4:2}`:
- Stage 3 has the mode (3 answers)
- Stage 3 passes all threshold checks
- **Should return 3, but returns 1**

After tracing the logic, the code appears correct. The issue is likely that **answer values are being treated as strings** instead of numbers, causing the filtering and counting to fail.

## Root Cause

In `calculateLiftScore`:
```typescript
const answers: AnswerEntry[] = userAnswers
  .map((a) => ({
    questionId: a.questionId,
    value: a.value,  // ← May be a string like "3" instead of number 3
  }))
  .filter((a) => a.value >= 1 && a.value <= 5);
```

If `a.value` is `"3"` (string), the comparison `"3" >= 1` works due to type coercion, but `countByStage` would create keys like `counts["3"]` instead of `counts[3]`.

## Solution

Explicitly convert `value` to a number in `calculateLiftScore`:

```typescript
const answers: AnswerEntry[] = userAnswers
  .map((a) => ({
    questionId: a.questionId,
    value: Number(a.value),  // ← Ensure numeric type
  }))
  .filter((a) => !isNaN(a.value) && a.value >= 1 && a.value <= 5);
```

## File to Modify

| File | Change |
|------|--------|
| `src/lib/liftScoring.ts` | Add `Number()` conversion in `calculateLiftScore` to ensure values are numeric |

## Code Change

### `src/lib/liftScoring.ts` (lines 247-258)

**Before:**
```typescript
export const calculateLiftScore = (userAnswers: UserAnswer[]): number => {
  // Build answer map from user answers
  const answers: AnswerEntry[] = userAnswers
    .map((a) => ({
      questionId: a.questionId,
      value: a.value,
    }))
    .filter((a) => a.value >= 1 && a.value <= 5);
```

**After:**
```typescript
export const calculateLiftScore = (userAnswers: UserAnswer[]): number => {
  // Build answer map from user answers
  const answers: AnswerEntry[] = userAnswers
    .map((a) => ({
      questionId: a.questionId,
      value: Number(a.value),  // Ensure numeric type
    }))
    .filter((a) => !isNaN(a.value) && a.value >= 1 && a.value <= 5);
```

## Expected Result

After this fix, `[3,4,3,2,1,4,2,1,3]` will correctly return **Steadfast (3)** instead of Seeking (1).

