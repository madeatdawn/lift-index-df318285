
# Fix Tie-Breaking: Treat Seeking as Fallback, Not Competitor

## Problem

Seeking (stage 1) has no minimum threshold - it always "qualifies." This makes it unfairly compete in tie-breaking via Q3/Q5. When Q3=1 (Seeking answer), it wins the tie even when Striving legitimately qualifies.

**Example**: `[1,1,1,1,2,3,2,2,2]`
- Counts: 1=4, 2=4 (tie)
- Striving has 4 answers (meets threshold of 3)
- But Q3=1, so current code picks Seeking
- Should be Striving

## Solution

Treat Seeking as a **fallback only**, not a tie-breaker participant:

1. Find which candidates meet their thresholds
2. Separate Seeking from non-Seeking qualifiers
3. If any non-Seeking stages qualify, choose among those
4. Only use Q3/Q5 tie-breakers among stages 2-5
5. Seeking is only returned if no other stage qualifies

## Code Change

### File: `src/lib/liftScoring.ts`

Replace the `applyTieBreaker` function (lines 91-117):

```typescript
const applyTieBreaker = (
  candidates: number[],
  answers: AnswerEntry[],
  counts: Record<number, number>
): number => {
  // Find candidates that meet their thresholds
  const qualifyingCandidates = candidates.filter((stage) =>
    meetsThreshold(stage, counts, answers)
  );

  // Separate Seeking (fallback) from real contenders
  const nonSeekingQualifiers = qualifyingCandidates.filter((s) => s > 1);

  // If no non-Seeking stages qualify, return Seeking
  if (nonSeekingQualifiers.length === 0) {
    return 1;
  }

  // If exactly one non-Seeking stage qualifies, return it
  if (nonSeekingQualifiers.length === 1) {
    return nonSeekingQualifiers[0];
  }

  // Multiple non-Seeking stages qualify - use Q3/Q5 among them only
  const q3Value = getAnswerForQuestion(answers, "q3");
  if (q3Value !== undefined && nonSeekingQualifiers.includes(q3Value)) {
    return q3Value;
  }

  const q5Value = getAnswerForQuestion(answers, "q5");
  if (q5Value !== undefined && nonSeekingQualifiers.includes(q5Value)) {
    return q5Value;
  }

  // Return highest qualifying non-Seeking candidate
  return Math.max(...nonSeekingQualifiers);
};
```

## Expected Results

| Test | Counts | Before | After | Why |
|------|--------|--------|-------|-----|
| `[1,1,1,1,2,3,2,2,2]` | 1=4, 2=4 | Seeking | **Striving** | Striving qualifies (4>=3), Seeking excluded from competition |
| `[1,1,1,2,2,2,3,3,3]` | 1=3, 2=3, 3=3 | Seeking | **Striving** | Steadfast blocked (3 A's), Striving qualifies, Seeking excluded |
| `[2,2,2,3,3,3,4,4,4]` | 2=3, 3=3, 4=3 | Striving | **Steadfast** | Shining fails domains, Striving/Steadfast both qualify, highest wins |
| `[1,1,1,1,1,2,2,2,2]` | 1=5, 2=4 | Seeking | **Seeking** | Seeking has more answers, wins outright (no tie) |

## Logic Flow

```text
applyTieBreaker([1, 2], answers, counts):
  
  qualifyingCandidates = [1, 2]  // Both meet thresholds
  nonSeekingQualifiers = [2]     // Filter out Seeking
  
  Only one non-Seeking qualifies!
  → Return 2 (Striving)
```

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/liftScoring.ts` | Update `applyTieBreaker` to treat Seeking as fallback only |
