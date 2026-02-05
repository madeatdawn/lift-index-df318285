

# Robust Mode-First Scoring with Scaled Dominance

## Summary

Replace the current mean-based scoring with a robust **mode-first algorithm** that scales the "clear lead" threshold based on quiz length. This prevents "false high" results from aspirational outliers and better reflects the user's current operating stage.

---

## Key Algorithm Changes

### Current Behavior
- Calculates the **average (mean)** of all answer values
- Matches the decimal average to result levels using `minScore`/`maxScore` ranges

### New Behavior  
- Uses **mode** (most frequent value) when there's a clear dominant pattern
- Scales the dominance threshold based on quiz length (~34% of answers required)
- Falls back to **median** when no clear lead exists
- Uses **support-first** fallback (lowest mode) when median isn't among tied modes
- Maps directly to level IDs instead of relying on score ranges

---

## Algorithm Specification

```text
1. Extract valid answer values (1-5 only)

2. Count frequencies for each level
   Example: { 1: 0, 2: 3, 3: 4, 4: 4, 5: 0 }

3. Calculate thresholds:
   - minDominance = max(3, ceil(n × 0.34))
     → 7 questions: minDominance = 3
     → 11 questions: minDominance = 4

4. Determine if there's a clear lead:
   - modes.length === 1 (single most-frequent value)
   - maxFreq >= minDominance (meets threshold)
   - maxFreq > secondMax (strictly beats runner-up)

5. Score determination:
   - Clear lead → Use that mode
   - No clear lead + median in modes → Use median
   - Otherwise → Use lowest mode (support-first)

6. Handle edge case: score = 0 → redirect to quiz start
```

---

## Direct Result Mapping

| Score | Level ID | Name |
|-------|----------|------|
| 1 | seeking | Seeking |
| 2 | striving | Striving |
| 3 | steadfast | Steadfast |
| 4 | shining | Shining |
| 5 | significance | Significance |

---

## Sanity Tests (11 questions)

| Answers | Counts | minDom | Clear Lead? | Result |
|---------|--------|--------|-------------|--------|
| [2,2,2,2,2,4,4,4,3,3,3] | 2:5, 3:3, 4:3 | 4 | Yes (5>3) | **Striving (2)** |
| [3,3,3,3,4,4,4,4,2,2,5] | 3:4, 4:4 | 4 | No (tie) | **Steadfast (3)** via median |
| [1,1,2,2,4,4,5,5,5,3,3] | 5:3, others:2 | 4 | No (3<4) | **Steadfast (3)** via median |
| [4,4,4,4,4,2,2,3,3,3,5] | 4:5, 3:3 | 4 | Yes (5>3) | **Shining (4)** |

---

## Files to Modify

### 1. `src/contexts/QuizContext.tsx`

Replace the `calculateScore` function (lines 79-83) with the new robust algorithm that:
- Filters for valid values (1-5)
- Counts frequencies and finds modes
- Calculates scaled dominance threshold
- Checks for clear lead vs. runner-up
- Falls back to median or lowest mode

### 2. `src/pages/Results.tsx`

Update result matching (lines 11-15) to:
- Use direct ID mapping instead of score ranges
- Handle score = 0 edge case by navigating back to quiz
- Match result by `id` field (e.g., `striving`, `steadfast`)

---

## Why This Works Better

| Problem | Old (Mean) | New (Mode + Scaled Threshold) |
|---------|-----------|-------------------------------|
| Aspirational outliers pull score up | Very sensitive | Ignored unless dominant (~34%+) |
| 3 out of 11 "wins" as mode | N/A | Now requires 4+ to be clear lead |
| Mixed answers default to middle | Always | Only when genuinely split |
| 7-question vs 11-question parity | Same sensitivity | Scales proportionally |

---

## Complexity Assessment

**Low complexity** - Two files modified:
1. `QuizContext.tsx` - Replace one function (~30 lines)
2. `Results.tsx` - Update matching logic (~10 lines)

No database changes needed. The `minScore`/`maxScore` fields remain for backwards compatibility but won't be used for routing.

