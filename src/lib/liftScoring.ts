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

  // No clear lead - use median as the definitive tiebreaker
  // The median represents the user's statistical center, regardless of modes
  return median;
};
