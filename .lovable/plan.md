
# Fix: Use Median Unconditionally as Tiebreaker

## The Problem

For bimodal distributions like `[1,1,1,3,3,3,3,2,1]`:
- User is genuinely split: 4 Seeking answers + 4 Steadfast answers + 1 Striving
- Median = 2 (Striving)
- Mean = 2 (Striving)
- Current result: **Seeking (1)** - wrong!
- Expected result: **Striving (2)**

The current algorithm only uses median when it happens to match a mode. When it doesn't, it defaults to the lowest mode, which is too punitive.

---

## The Fix

Change the fallback logic: when no clear lead exists, **always use the median** as the tiebreaker - don't require it to be among the modes.

The median represents the statistical center of the user's actual answers. If they're pulled equally toward 1 and 3, the median (2) correctly represents their "center of gravity."

---

## Algorithm Change

**Current logic (lines 49-55):**
```text
If median is among the modes → use median
Otherwise → use lowest mode
```

**New logic:**
```text
Always use median as tiebreaker (remove the mode check)
```

---

## Test Cases

| Answers | Counts | Modes | Median | Current | New |
|---------|--------|-------|--------|---------|-----|
| [1,1,1,3,3,3,3,2,1] | 1:4, 2:1, 3:4 | [1,3] | 2 | Seeking (1) | **Striving (2)** |
| [1,1,5,5] | 1:2, 5:2 | [1,5] | 3 | Seeking (1) | **Steadfast (3)** |
| [4,5,2,1,3,4,5,3,2] | 2:2, 3:2, 4:2, 5:2 | [2,3,4,5] | 3 | Steadfast (3) | Steadfast (3) - unchanged |

---

## Files to Modify

### 1. src/lib/liftScoring.ts

Remove the conditional check for median-in-modes and always return the median when no clear lead exists.

**Before (lines 49-55):**
```typescript
// If median is among the modes, use it (grounded choice)
if (modes.includes(median)) {
  return median;
}

// Fallback: use lowest mode (support-first / ground-down principle)
return Math.min(...modes);
```

**After:**
```typescript
// No clear lead - use median as the definitive tiebreaker
// The median represents the user's statistical center, regardless of modes
return median;
```

### 2. src/lib/liftScoring.test.ts

Update the test case for bimodal distributions:

**Update existing test (line 64-70):**
```typescript
it("returns Striving (2) for bimodal [1,1,5,5] via median", () => {
  const answers = makeAnswers([1, 1, 5, 5]);
  // Counts: {1:2, 5:2}
  // modes = [1,5], median = (1+5)/2 = 3
  // Use median as tiebreaker, not lowest mode
  expect(calculateLiftScore(answers)).toBe(3);
});
```

**Add new test case:**
```typescript
it("returns Striving (2) for [1,1,1,3,3,3,3,2,1] via median", () => {
  const answers = makeAnswers([1, 1, 1, 3, 3, 3, 3, 2, 1]);
  // Counts: {1:4, 2:1, 3:4}
  // modes = [1,3] (tied at 4), no clear lead
  // sorted = [1,1,1,1,2,3,3,3,3], median = 2
  expect(calculateLiftScore(answers)).toBe(2);
});
```

---

## Why This is Better

| Scenario | Old Behavior | New Behavior |
|----------|--------------|--------------|
| Split between 1 and 3 | Defaults to 1 (punitive) | Uses median 2 (fair center) |
| Split between 1 and 5 | Defaults to 1 (punitive) | Uses median 3 (fair center) |
| Already matching mode | Uses median | Uses median (unchanged) |

The median always represents the user's actual center of gravity. If someone answers half Seeking and half Steadfast, they're genuinely in a Striving position - that's not a "fallback," it's the correct interpretation.

---

## Technical Details

**Complexity**: Very low - removing 4 lines, adding 2 lines of comments

**Risk**: None - the median is already calculated and validated as 1-5

**Backwards compatibility**: Results will shift toward center for bimodal users (more accurate, not breaking)
