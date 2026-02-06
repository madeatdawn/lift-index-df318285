import { UserAnswer } from "@/types/quiz";

interface AnswerEntry {
  questionId: string;
  value: number;
}

/**
 * Check if a questionId matches a specific question prefix
 * Handles dynamic IDs like "q8_1770343191027"
 */
const isQuestion = (questionId: string, prefix: string): boolean =>
  questionId === prefix || questionId.startsWith(`${prefix}_`);

/**
 * Check if a specific question has a specific value
 */
const hasAnswerInQuestion = (
  answers: AnswerEntry[],
  questionPrefix: string,
  requiredValue: number
): boolean => {
  return answers.some(
    (a) => isQuestion(a.questionId, questionPrefix) && a.value === requiredValue
  );
};

/**
 * Get the answer value for a specific question
 */
const getAnswerForQuestion = (
  answers: AnswerEntry[],
  questionPrefix: string
): number | undefined => {
  const answer = answers.find((a) => isQuestion(a.questionId, questionPrefix));
  return answer?.value;
};

/**
 * Count how many answers fall into each stage (1-5)
 */
const countByStage = (answers: AnswerEntry[]): Record<number, number> => {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  answers.forEach((a) => {
    if (a.value >= 1 && a.value <= 5) {
      counts[a.value]++;
    }
  });
  return counts;
};

/**
 * Check domain requirements for Shining (D = 4)
 * Requires D in:
 * - Q2 (results consistency)
 * - Q6 OR Q8 (visibility/engagement)
 * - Q5 OR Q7 (limits/friction)
 */
const meetsShiningDomains = (answers: AnswerEntry[]): boolean => {
  const hasQ2 = hasAnswerInQuestion(answers, "q2", 4);
  const hasQ6orQ8 =
    hasAnswerInQuestion(answers, "q6", 4) ||
    hasAnswerInQuestion(answers, "q8", 4);
  const hasQ5orQ7 =
    hasAnswerInQuestion(answers, "q5", 4) ||
    hasAnswerInQuestion(answers, "q7", 4);

  return hasQ2 && hasQ6orQ8 && hasQ5orQ7;
};

/**
 * Check domain requirements for Significance (E = 5)
 * Requires E in at least 2 of: Q3, Q4, Q9
 */
const meetsSignificanceDomains = (answers: AnswerEntry[]): boolean => {
  let domainCount = 0;
  if (hasAnswerInQuestion(answers, "q3", 5)) domainCount++;
  if (hasAnswerInQuestion(answers, "q4", 5)) domainCount++;
  if (hasAnswerInQuestion(answers, "q9", 5)) domainCount++;
  return domainCount >= 2;
};

/**
 * Check if a stage meets its minimum thresholds (without recursion)
 */
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

/**
 * Apply tie-breaking rules when multiple stages have equal counts
 * 1. Use Q3 (Where progress lives) as primary tie-breaker
 * 2. Use Q5 (Limits on growth) as secondary tie-breaker
 * 3. Check candidates from highest to lowest, return first that meets thresholds
 * 4. Default to lower stage (ground down, not up)
 */
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

  // If no non-Seeking stages qualify, return the mode (stage with most answers)
  if (nonSeekingQualifiers.length === 0) {
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

/**
 * Validate a provisional stage against minimum thresholds
 * and downgrade if requirements are not met
 */
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
    if (counts[5] < 3) {
      return validateAndDowngrade(4, counts, answers);
    }
    if (!meetsSignificanceDomains(answers)) {
      return validateAndDowngrade(4, counts, answers);
    }
    return 5;
  }

  // Stage 4: Shining
  if (stage === 4) {
    if (counts[4] < 3) {
      return validateAndDowngrade(3, counts, answers);
    }
    if (!meetsShiningDomains(answers)) {
      return validateAndDowngrade(3, counts, answers);
    }
    return 4;
  }

  // Stage 3: Steadfast
  if (stage === 3) {
    if (counts[3] < 3) {
      return validateAndDowngrade(2, counts, answers);
    }
    // Too many A answers (>2) blocks Steadfast
    if (counts[1] > 2) {
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
      // No Seeking answers - return the mode (stage with most answers)
      return findModeStage();
    }
    return 2;
  }

  // Stage 1: Seeking - return if it has answers, otherwise return the mode
  if (counts[1] > 0) {
    return 1;
  }
  return findModeStage();
};

/**
 * Calculate the LIFT Index score based on the user's answers
 * Returns a number 1-5 representing the stage:
 * 1 = Seeking, 2 = Striving, 3 = Steadfast, 4 = Shining, 5 = Significance
 */
export const calculateLiftScore = (userAnswers: UserAnswer[]): number => {
  // Build answer map from user answers
  const answers: AnswerEntry[] = userAnswers
    .map((a) => ({
      questionId: a.questionId,
      value: a.value,
    }))
    .filter((a) => a.value >= 1 && a.value <= 5);

  if (answers.length === 0) {
    return 1; // Default to Seeking if no valid answers
  }

  // Count answers per stage
  const counts = countByStage(answers);

  // Find highest count(s)
  const maxCount = Math.max(...Object.values(counts));
  const candidates = Object.entries(counts)
    .filter(([_, count]) => count === maxCount)
    .map(([stage]) => Number(stage));

  // Determine provisional stage
  let provisional: number;
  if (candidates.length > 1) {
    provisional = applyTieBreaker(candidates, answers, counts);
  } else {
    provisional = candidates[0];
  }

  // Apply threshold validation with downgrades
  const finalStage = validateAndDowngrade(provisional, counts, answers);

  return finalStage;
};
