
# LIFT Index Scoring Logic Implementation

## Problem

The current scoring algorithm uses a simple mode-based approach that doesn't match the LIFT Index requirements:
- No minimum thresholds per stage
- No domain-specific requirements for Shining/Significance
- No tie-breaking rules using specific questions
- No protection against upward skew

## New Scoring Rules Summary

| Stage | Letter | Value | Minimum Threshold | Domain Requirements |
|-------|--------|-------|-------------------|---------------------|
| Seeking | A | 1 | None | Default fallback |
| Striving | B | 2 | 3 B answers | None |
| Steadfast | C | 3 | 3 C answers AND ≤2 A answers | None |
| Shining | D | 4 | 3 D answers AND D in each: Q2, (Q6 or Q8), (Q5 or Q7) | Results + Visibility + Friction |
| Significance | E | 5 | 3 E answers AND E in ≥2 of: Q3, Q4, Q9 | Progress + Financial + Next |

## Implementation Changes

### 1. Update Local Quiz Data

Update `src/data/quizData.ts` to match the 9 database questions (for fallback consistency).

### 2. Rewrite calculateScore Function

Replace the current mode-based algorithm in `src/contexts/QuizContext.tsx` with the LIFT Index logic:

```text
Step 1: Count answers per stage (A=1, B=2, C=3, D=4, E=5)
Step 2: Determine provisional stage (highest count)
Step 3: Apply minimum thresholds (with domain checks for D/E)
Step 4: Apply tie-breaking rules if needed
Step 5: Return final stage as number (1-5)
```

### 3. New Helper Functions

Create scoring utilities to keep the code organized:

```typescript
// Track which questions have which answer values
interface AnswerMap {
  questionId: string;
  value: number;
}

// Count answers per stage
function countByStage(answers: AnswerMap[]): Record<number, number>

// Check if specific question has specific value
function hasAnswerInQuestion(answers: AnswerMap[], questionId: string, value: number): boolean

// Check domain requirements for Shining (D)
function meetsShiningDomains(answers: AnswerMap[]): boolean {
  // Requires D in:
  // - Q2 (results consistency)
  // - Q6 OR Q8 (visibility/engagement)
  // - Q5 OR Q7 (limits/friction)
}

// Check domain requirements for Significance (E)
function meetsSignificanceDomains(answers: AnswerMap[]): boolean {
  // Requires E in at least 2 of: Q3, Q4, Q9
}

// Apply all threshold rules with downgrade logic
function applyThresholds(provisional: number, counts: Record<number, number>, answers: AnswerMap[]): number
```

### 4. Tie-Breaking Logic

When two stages are tied:
1. Choose lower stage, unless higher meets all thresholds
2. Use Q3 as primary tie-breaker
3. Use Q5 as secondary tie-breaker
4. Default to lower stage

## Detailed Algorithm

```text
function calculateScore(userAnswers):
  
  // Build answer map: [{ questionId: 'q1', value: 3 }, ...]
  answers = userAnswers.map(a => ({ questionId: a.questionId, value: a.value }))
  
  // Count per stage
  counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for each answer:
    counts[answer.value]++
  
  // Find highest count(s)
  maxCount = max(counts.values)
  candidates = stages where counts[stage] == maxCount
  
  // Handle ties with tie-breaker
  if candidates.length > 1:
    provisional = applyTieBreaker(candidates, answers)
  else:
    provisional = candidates[0]
  
  // Apply threshold validation (with downgrades)
  final = validateAndDowngrade(provisional, counts, answers)
  
  return final


function validateAndDowngrade(stage, counts, answers):
  
  // Check from top down, downgrade if thresholds not met
  
  if stage == 5 (Significance):
    if counts[5] < 3:
      return validateAndDowngrade(4, counts, answers)
    if not meetsSignificanceDomains(answers):
      return validateAndDowngrade(4, counts, answers)
    return 5
    
  if stage == 4 (Shining):
    if counts[4] < 3:
      return validateAndDowngrade(3, counts, answers)
    if not meetsShiningDomains(answers):
      return validateAndDowngrade(3, counts, answers)
    return 4
    
  if stage == 3 (Steadfast):
    if counts[3] < 3:
      return validateAndDowngrade(2, counts, answers)
    if counts[1] > 2:  // Too many A answers
      return validateAndDowngrade(2, counts, answers)
    return 3
    
  if stage == 2 (Striving):
    if counts[2] < 3:
      return 1  // Downgrade to Seeking
    return 2
    
  // Stage 1 (Seeking) - no minimum
  return 1


function meetsShiningDomains(answers):
  hasQ2 = hasAnswerInQuestion(answers, 'q2', 4)
  hasQ6orQ8 = hasAnswerInQuestion(answers, 'q6', 4) OR 
              hasAnswerInQuestion(answers, startsWith('q8'), 4)
  hasQ5orQ7 = hasAnswerInQuestion(answers, 'q5', 4) OR 
              hasAnswerInQuestion(answers, 'q7', 4)
  return hasQ2 AND hasQ6orQ8 AND hasQ5orQ7


function meetsSignificanceDomains(answers):
  domains = 0
  if hasAnswerInQuestion(answers, 'q3', 5): domains++
  if hasAnswerInQuestion(answers, 'q4', 5): domains++
  if hasAnswerInQuestion(answers, startsWith('q9'), 5): domains++
  return domains >= 2


function applyTieBreaker(candidates, answers):
  // Primary: Q3 (Where progress lives)
  q3Value = getAnswerForQuestion(answers, 'q3')
  if q3Value in candidates:
    return q3Value
  
  // Secondary: Q5 (Limits on growth)
  q5Value = getAnswerForQuestion(answers, 'q5')
  if q5Value in candidates:
    return q5Value
  
  // Default: lower stage (ground down, not up)
  return min(candidates)
```

## Question ID Handling

The database uses dynamic question IDs like `q8_1770343191027`. The code needs to handle this by checking if the question ID starts with the expected prefix:

```typescript
const isQuestion = (questionId: string, prefix: string) => 
  questionId === prefix || questionId.startsWith(`${prefix}_`);
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/contexts/QuizContext.tsx` | Complete rewrite of `calculateScore()` with new LIFT Index logic |
| `src/data/quizData.ts` | Update to match 9 database questions (for local fallback) |

## Testing Considerations

After implementation, test these scenarios:

1. **All A answers** → Seeking (1)
2. **Mixed A/B** (2 A, 2 B) → Seeking (B doesn't meet threshold)
3. **3 B answers** → Striving (2)
4. **3 C but 3 A** → Striving (too many A's)
5. **3 D but missing domain** → Steadfast (domain check fails)
6. **3 D with all domains** → Shining (4)
7. **3 E but only 1 domain question** → Shining (domain check fails)
8. **3 E with 2+ domain questions** → Significance (5)
9. **Tie between C and D** → Use Q3 tie-breaker, then Q5, then lower

## Technical Notes

- Q9 is desire-based and should NOT drive stage assignment, but it CAN be used as a Significance domain qualifier
- The scoring function returns a number 1-5 which maps to level IDs via `LEVEL_MAP` in Quiz.tsx
- Guardrails ensure users cannot reach Significance without demonstrating durability across multiple dimensions
