

# Smart Fallback: Only Fall to Stages With Answers

## Problem

Currently, the fallback logic always defaults to Seeking (1) when no other stage qualifies. This doesn't make sense when someone has zero Seeking answers.

**Example**: Answers `[3,3,3,4,4,4,5,5,5]`
- Counts: 1=0, 2=0, 3=3, 4=3, 5=3
- If Significance/Shining fail domain checks and Steadfast gets blocked...
- Current: Falls to Seeking (they have 0 Seeking answers!)
- Expected: Falls to Steadfast (the lowest stage with actual answers)

## Solution

Pass `counts` to the fallback logic and only consider stages that have at least one answer.

## Code Changes

### File: `src/lib/liftScoring.ts`

**1. Update `applyTieBreaker`** - Find lowest stage with answers instead of hardcoded 1:

```typescript
// If no non-Seeking stages qualify, return lowest stage with answers
if (nonSeekingQualifiers.length === 0) {
  // Find lowest stage that has at least one answer
  for (let stage = 1; stage <= 5; stage++) {
    if (counts[stage] > 0) {
      return stage;
    }
  }
  return 1; // Ultimate fallback if somehow no answers
}
```

**2. Update `validateAndDowngrade`** - Add counts-aware fallback logic:

```typescript
const validateAndDowngrade = (
  stage: number,
  counts: Record<number, number>,
  answers: AnswerEntry[]
): number => {
  // Helper: find lowest stage with at least one answer
  const findLowestWithAnswers = (): number => {
    for (let s = 1; s <= 5; s++) {
      if (counts[s] > 0) return s;
    }
    return 1;
  };

  // Stage 5: Significance
  if (stage === 5) {
    if (counts[5] < 3 || !meetsSignificanceDomains(answers)) {
      return validateAndDowngrade(4, counts, answers);
    }
    return 5;
  }

  // Stage 4: Shining
  if (stage === 4) {
    if (counts[4] < 3 || !meetsShiningDomains(answers)) {
      return validateAndDowngrade(3, counts, answers);
    }
    return 4;
  }

  // Stage 3: Steadfast
  if (stage === 3) {
    if (counts[3] < 3 || counts[1] > 2) {
      return validateAndDowngrade(2, counts, answers);
    }
    return 3;
  }

  // Stage 2: Striving
  if (stage === 2) {
    if (counts[2] < 3) {
      // Only fall to Seeking if there are Seeking answers
      if (counts[1] > 0) {
        return 1;
      }
      // Otherwise return lowest stage with answers
      return findLowestWithAnswers();
    }
    return 2;
  }

  // Stage 1: Seeking - return if it has answers, otherwise find lowest with answers
  if (counts[1] > 0) {
    return 1;
  }
  return findLowestWithAnswers();
};
```

## Expected Results

| Answers | Counts | Before | After | Why |
|---------|--------|--------|-------|-----|
| `[3,3,3,4,4,4,5,5,5]` | 1=0, 2=0, 3=3, 4=3, 5=3 | Could fall to Seeking | **Steadfast** | Lowest with answers is 3 |
| `[2,2,3,3,3,4,4,4,5]` | 1=0, 2=2, 3=3, 4=3, 5=1 | Could fall to Seeking | **Striving** | Lowest with answers is 2 |
| `[1,2,3,4,5,3,3,3,3]` | 1=1, 2=1, 3=5, 4=1, 5=1 | Seeking | **Seeking** | Still works when 1s exist |

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/liftScoring.ts` | Update `applyTieBreaker` and `validateAndDowngrade` to use counts-aware fallback |

