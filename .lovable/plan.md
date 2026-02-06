

# Fix Striving Appearance in Tie-Breaking Logic

## Problem Identified

The current tie-breaking logic defaults to the **lowest** stage when Q3/Q5 don't resolve the tie. However, the LIFT Index rules state:

> "Choose the lower stage, **unless the higher stage meets all its minimum thresholds**."

This means when there's a tie, we should check higher candidates first to see if they qualify before defaulting down.

## Test Case Walkthrough

| Test | Counts | Current | Expected | Fix Needed |
|------|--------|---------|----------|------------|
| `[1,1,1,1,2,3,2,2,2]` | 1=4, 2=4 | Seeking | Striving | Striving has 4 answers (meets threshold) - should be allowed |
| `[1,1,1,2,2,2,3,3,3]` | 1=3, 2=3, 3=3 | Seeking | Striving | Q3 picks Steadfast, but 3 A's blocks it → should cascade to Striving |
| `[2,2,2,3,3,3,4,4,4]` | 2=3, 3=3, 4=3 | Striving | Steadfast | Q3 picks Steadfast, 0 A's, should pass! |

## Root Cause

The `applyTieBreaker` function picks based on Q3/Q5 values, but doesn't check if the picked stage meets thresholds. When Q3/Q5 aren't in candidates, it defaults to `Math.min()`.

The fix: When there's a tie, we should iterate from highest to lowest candidate and return the first one that passes validation.

## Solution

Modify the tie-breaking approach:

1. Sort tied candidates from **highest to lowest**
2. For each candidate, check if it meets its thresholds
3. Return the first one that passes
4. This naturally "grounds down" when higher stages don't qualify

## Code Changes

### File: `src/lib/liftScoring.ts`

**Update `applyTieBreaker` function** to check thresholds when resolving ties:

```typescript
const applyTieBreaker = (
  candidates: number[],
  answers: AnswerEntry[],
  counts: Record<number, number>
): number => {
  // Primary: Q3 (Where progress lives)
  const q3Value = getAnswerForQuestion(answers, "q3");
  if (q3Value !== undefined && candidates.includes(q3Value)) {
    return q3Value;
  }

  // Secondary: Q5 (Limits on growth)
  const q5Value = getAnswerForQuestion(answers, "q5");
  if (q5Value !== undefined && candidates.includes(q5Value)) {
    return q5Value;
  }

  // Check candidates from highest to lowest
  // Return highest that meets thresholds
  const sortedCandidates = [...candidates].sort((a, b) => b - a);
  
  for (const stage of sortedCandidates) {
    if (meetsThreshold(stage, counts, answers)) {
      return stage;
    }
  }

  // Default: lowest stage
  return Math.min(...candidates);
};
```

**Add helper function** to check thresholds without recursion:

```typescript
const meetsThreshold = (
  stage: number,
  counts: Record<number, number>,
  answers: AnswerEntry[]
): boolean => {
  switch (stage) {
    case 5:
      return counts[5] >= 3 && meetsSignificanceDomains(answers);
    case 4:
      return counts[4] >= 3 && meetsShiningDomains(answers);
    case 3:
      return counts[3] >= 3 && counts[1] <= 2;
    case 2:
      return counts[2] >= 3;
    default:
      return true; // Seeking always qualifies
  }
};
```

**Update the main function** to pass `counts` to tie-breaker:

```typescript
if (candidates.length > 1) {
  provisional = applyTieBreaker(candidates, answers, counts);
} else {
  provisional = candidates[0];
}
```

## Expected Results After Fix

| Test | Counts | Before | After |
|------|--------|--------|-------|
| `[1,1,1,1,2,3,2,2,2]` | 1=4, 2=4 | Seeking | **Striving** (4 B's meets threshold) |
| `[1,1,1,2,2,2,3,3,3]` | 1=3, 2=3, 3=3 | Seeking | **Striving** (Steadfast blocked by 3 A's, Striving has 3 B's) |
| `[1,1,1,3,3,3,3,2,1]` | 1=4, 3=4 | Seeking | **Steadfast** (has 4 C's, but 4 A's blocks → Striving only has 1 → **Seeking**) |
| `[2,2,2,3,3,3,4,4,4]` | 2=3, 3=3, 4=3 | Striving | **Steadfast** (has 3 C's, 0 A's, passes) |

## Note on Test Case 5

`[1,1,1,3,3,3,3,2,1]` with counts 1=4, 2=1, 3=4:
- Tie between Seeking (1) and Steadfast (3)
- Steadfast has 4 C's but also 4 A's → blocked (>2 A's rule)
- Striving only has 1 B → doesn't meet threshold
- Falls to Seeking

If you want this to be Striving, we would need to relax the Striving threshold or add a special rule. Currently the rules require 3 B answers for Striving.

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/liftScoring.ts` | Add `meetsThreshold` helper, update `applyTieBreaker` to check thresholds when defaulting |

