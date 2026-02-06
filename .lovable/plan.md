

# Robust Mode-First Scoring with Median Fallback

## Problem Diagnosis

For `[4,5,2,1,3,4,5,3,2]` (9 answers):
- Counts: `{1:1, 2:2, 3:2, 4:2, 5:2}`
- No stage has a clear lead (max is 2)
- Current algorithm cascades through threshold checks, all fail, defaults to **Seeking (1)**

The current algorithm is overly complex with domain requirements, cascade logic, and threshold validation that was designed for a different scoring model. It needs to be **replaced entirely** with a simpler, more robust approach.

---

## New Algorithm: Mode-First with Median Fallback

```text
1. Extract valid answer values (1-5 only)

2. Count frequencies for each level
   Example: { 1: 1, 2: 2, 3: 2, 4: 2, 5: 2 }

3. Calculate scaled dominance threshold:
   minDominance = max(3, ceil(n × 0.34))
   → 9 questions: max(3, ceil(3.06)) = 3

4. Find mode(s) - stages with highest count:
   modes = [2, 3, 4, 5] (all have count 2)
   maxFreq = 2

5. Check for clear lead:
   - modes.length === 1 (single mode)
   - maxFreq >= minDominance (meets threshold)
   - maxFreq > secondMax (strictly beats runner-up)

6. Determine score:
   - Clear lead → Use that mode
   - No clear lead → Calculate median of all answers
     - If median is among the modes → Use median
     - Otherwise → Use lowest mode (support-first/ground-down)

7. Edge case: No valid answers → Default to 0 (navigate to quiz start)
```

---

## Test Cases

| Answers | Counts | minDom | Modes | Clear Lead? | Median | Result |
|---------|--------|--------|-------|-------------|--------|--------|
| `[4,5,2,1,3,4,5,3,2]` | 1:1, 2:2, 3:2, 4:2, 5:2 | 3 | 2,3,4,5 | No | 3 | **Steadfast (3)** |
| `[3,4,3,2,1,4,2,1,3]` | 1:2, 2:2, 3:3, 4:2 | 3 | 3 | Yes (3≥3, beats 2) | - | **Steadfast (3)** |
| `[2,2,2,2,2,4,4,4,3,3,3]` | 2:5, 3:3, 4:3 | 4 | 2 | Yes (5>3, 5≥4) | - | **Striving (2)** |
| `[3,3,3,3,4,4,4,4,2,2,5]` | 2:2, 3:4, 4:4, 5:1 | 4 | 3,4 | No (tie) | 3 | **Steadfast (3)** |
| `[4,4,4,4,4,2,2,3,3,3,5]` | 2:2, 3:3, 4:5, 5:1 | 4 | 4 | Yes (5>3, 5≥4) | - | **Shining (4)** |
| `[5,5,5,5,5,4,4,4,3]` | 3:1, 4:3, 5:5 | 4 | 5 | Yes (5>3, 5≥4) | - | **Significance (5)** |

---

## Files to Modify

### 1. `src/lib/liftScoring.ts` (Complete Rewrite)

Replace the entire file with a clean, simple implementation:

```typescript
import { UserAnswer } from "@/types/quiz";

/**
 * Calculate the LIFT Index score using mode-first algorithm with median fallback
 * Returns 1-5 representing: Seeking, Striving, Steadfast, Shining, Significance
 * Returns 0 if no valid answers (edge case)
 */
export const calculateLiftScore = (userAnswers: UserAnswer[]): number => {
  // Extract valid numeric values (1-5 only)
  const values = userAnswers
    .map((a) => Number(a.value))
    .filter((v) => !isNaN(v) && v >= 1 && v <= 5);

  if (values.length === 0) {
    return 0; // No valid answers - will redirect to quiz start
  }

  // Count frequencies for each stage
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  values.forEach((v) => counts[v]++);

  // Find max frequency and all modes (stages with max count)
  const maxFreq = Math.max(...Object.values(counts));
  const modes = [1, 2, 3, 4, 5].filter((stage) => counts[stage] === maxFreq);

  // Calculate scaled dominance threshold (~34% of answers, minimum 3)
  const minDominance = Math.max(3, Math.ceil(values.length * 0.34));

  // Find second-highest frequency for "clear lead" check
  const frequencies = Object.values(counts).sort((a, b) => b - a);
  const secondMax = frequencies[1] || 0;

  // Check for clear lead: single mode, meets threshold, strictly beats runner-up
  const hasClearLead =
    modes.length === 1 && maxFreq >= minDominance && maxFreq > secondMax;

  if (hasClearLead) {
    return modes[0]; // Single dominant stage
  }

  // No clear lead - use median as tiebreaker
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
      : sorted[mid];

  // If median is among the modes, use it (grounded choice)
  if (modes.includes(median)) {
    return median;
  }

  // Fallback: use lowest mode (support-first / ground-down principle)
  return Math.min(...modes);
};
```

### 2. `src/pages/Quiz.tsx` (Handle score=0 edge case)

Update `handleQuizComplete` to handle the edge case where score is 0:

```typescript
const handleQuizComplete = (answersSnapshot: UserAnswer[]) => {
  setIsRedirecting(true);

  setTimeout(() => {
    const score = calculateLiftScore(answersSnapshot);
    
    // Edge case: no valid answers
    if (score === 0) {
      setIsRedirecting(false);
      resetAnswers();
      setCurrentQuestionIndex(0);
      setStarted(false);
      return;
    }
    
    const levelId = LEVEL_MAP[score];
    const result = quizData.results.find((r) => r.id === levelId);

    if (result?.redirectUrl && result.redirectUrl.startsWith("https://")) {
      resetAnswers();
      window.location.href = result.redirectUrl;
    } else {
      resetAnswers();
      window.location.href = "https://elanoura.com";
    }
  }, 100);
};
```

---

## Why This Approach Works Better

| Issue | Old Algorithm | New Algorithm |
|-------|--------------|---------------|
| Complex threshold requirements | Required 3+ answers AND domain-specific questions | Simple: just needs clear frequency lead |
| Defaulting to Seeking | Cascaded down when thresholds failed | Never defaults - uses median or lowest mode |
| Domain requirements (Q2, Q3, Q5, etc.) | Required specific high-level questions | **Removed** - all questions weighted equally |
| Tie handling | Complex Q3/Q5 tiebreakers | Uses statistical median (center of distribution) |
| Edge cases | Many paths to Seeking | Ground-down to lowest mode with answers |

---

## Key Principles

1. **Mode-first**: When one stage clearly dominates (34%+ and beats runner-up), use it
2. **Median fallback**: When tied, use the statistical center of the user's answers
3. **Ground-down**: When all else fails, use the lowest tied mode (conservative)
4. **Never default to Seeking**: The result must reflect what the user actually answered

---

## Removed Complexity

The following are **removed** from the old algorithm:
- `meetsShiningDomains()` - domain-specific requirements
- `meetsSignificanceDomains()` - domain-specific requirements  
- `validateAndDowngrade()` - cascade logic
- `applyTieBreaker()` - Q3/Q5 tiebreaker logic
- `meetsThreshold()` - stage-specific threshold checks

This results in a **much simpler** ~40 line file vs the current ~280 lines.

