

# Honor the Mode: Return Stage With Highest Count When No Stage Fully Qualifies

## Problem Analysis

For `[3,4,3,2,1,4,2,1,3]` with counts (1=2, 2=2, 3=3, 4=2):
- Stage 3 has the clear **mode** (highest count = 3)
- Current logic correctly returns Stage 3 in this case

However, the concern is about edge cases where:
1. The mode-holder fails its threshold validation (e.g., Steadfast blocked by too many A answers)
2. The cascade goes all the way down to Seeking even when there's no Seeking answers

**Example edge case**: `[3,3,3,1,1,1,4,4,4]` (counts: 1=3, 3=3, 4=3)
- Three-way tie between stages 1, 3, and 4
- Stage 4 (Shining) fails domain requirements
- Stage 3 (Steadfast) blocked because 3 A-answers > 2
- Falls to Seeking by default

The user wants: **When multiple stages tie or when the mode-holder fails, honor the stage with the highest answer count among stages that have answers** rather than defaulting to Seeking.

## Solution

Enhance `validateAndDowngrade` to track the "best fallback" - the stage with the most answers that the user actually selected. When a stage fails validation and we can't cascade further, return this best fallback instead of hardcoded Stage 1.

## Code Changes

### File: `src/lib/liftScoring.ts`

**1. Add helper to find stage with most answers**:

```typescript
/**
 * Find the stage with the most answers (the mode)
 * Used as ultimate fallback when cascade fails
 */
const findModeStage = (counts: Record<number, number>): number => {
  let maxCount = 0;
  let modeStage = 1;
  
  for (let stage = 1; stage <= 5; stage++) {
    if (counts[stage] > maxCount) {
      maxCount = counts[stage];
      modeStage = stage;
    }
  }
  
  return modeStage;
};
```

**2. Update `validateAndDowngrade` to use mode-aware fallback**:

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
    return 1; // Ultimate fallback
  };

  // Helper: find stage with highest count (the mode)
  const findModeStage = (): number => {
    let maxCount = 0;
    let modeStage = 1;
    for (let s = 1; s <= 5; s++) {
      if (counts[s] > maxCount) {
        maxCount = counts[s];
        modeStage = s;
      }
    }
    return modeStage;
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
      // Check if Seeking has answers
      if (counts[1] > 0) {
        return 1;
      }
      // No Seeking answers - return the mode (stage with most answers)
      return findModeStage();
    }
    return 2;
  }

  // Stage 1: Seeking
  if (counts[1] > 0) {
    return 1;
  }
  // No Seeking answers - return the mode
  return findModeStage();
};
```

**3. Update `applyTieBreaker` terminal fallback**:

```typescript
// If no non-Seeking stages qualify, return the mode
if (nonSeekingQualifiers.length === 0) {
  // Find stage with most answers (the mode)
  let maxCount = 0;
  let modeStage = 1;
  for (let stage = 1; stage <= 5; stage++) {
    if (counts[stage] > maxCount) {
      maxCount = counts[stage];
      modeStage = stage;
    }
  }
  return modeStage;
}
```

## Expected Results

| Answers | Counts | Issue | Result |
|---------|--------|-------|--------|
| `[3,4,3,2,1,4,2,1,3]` | 1=2, 2=2, 3=3, 4=2 | None | **Steadfast (3)** - Mode is 3, passes all checks |
| `[3,3,3,1,1,1,4,4,4]` | 1=3, 3=3, 4=3 | Stage 3 blocked (3 A's), Stage 4 fails domains | **Steadfast (3)** - It's the mode (tied), honored |
| `[4,4,4,5,5,5,3,3,3]` | 3=3, 4=3, 5=3 | No stage 1 or 2 answers | **Steadfast (3)** - Lowest stage with answers |

## Key Principle

When all threshold-based cascade fails:
1. **Never return a stage with 0 answers**
2. **Honor the mode** - the stage the user answered most frequently
3. **Ground down to lowest stage with answers** when modes tie

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/liftScoring.ts` | Add `findModeStage` helper and update `validateAndDowngrade` and `applyTieBreaker` to use mode-aware fallback |

