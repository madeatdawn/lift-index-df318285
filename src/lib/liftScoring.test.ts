import { describe, it, expect } from "vitest";
import { calculateLiftScore } from "./liftScoring";
import type { UserAnswer } from "@/types/quiz";

const makeAnswers = (values: number[]): UserAnswer[] =>
  values.map((value, i) => ({
    questionId: `q${i + 1}`,
    selectedOptionId: "a",
    value,
  }));

describe("calculateLiftScore", () => {
  it("returns Steadfast (3) for [4,5,2,1,3,4,5,3,2] via median fallback", () => {
    const answers = makeAnswers([4, 5, 2, 1, 3, 4, 5, 3, 2]);
    // Counts: {1:1, 2:2, 3:2, 4:2, 5:2}
    // All modes tie at 2 except 1
    // modes = [2,3,4,5]
    // median of sorted [1,2,2,3,3,4,4,5,5] = 3 (5th element, 0-indexed 4)
    expect(calculateLiftScore(answers)).toBe(3);
  });

  it("returns Steadfast (3) for [3,4,3,2,1,4,2,1,3] via clear lead", () => {
    const answers = makeAnswers([3, 4, 3, 2, 1, 4, 2, 1, 3]);
    // Counts: {1:2, 2:2, 3:3, 4:2, 5:0}
    // modes = [3] (count 3 >= minDominance 3, beats runner-up 2)
    expect(calculateLiftScore(answers)).toBe(3);
  });

  it("returns Striving (2) for [2,2,2,2,2,4,4,4,3,3,3]", () => {
    const answers = makeAnswers([2, 2, 2, 2, 2, 4, 4, 4, 3, 3, 3]);
    // Counts: {2:5, 3:3, 4:3}
    // minDominance = max(3, ceil(11*0.34)) = 4
    // modes = [2], maxFreq 5 >= 4, beats 3
    expect(calculateLiftScore(answers)).toBe(2);
  });

  it("returns Steadfast (3) for [3,3,3,3,4,4,4,4,2,2,5] via median", () => {
    const answers = makeAnswers([3, 3, 3, 3, 4, 4, 4, 4, 2, 2, 5]);
    // Counts: {2:2, 3:4, 4:4, 5:1}
    // modes = [3,4], no clear lead
    // median of sorted = 3 (middle of 11)
    expect(calculateLiftScore(answers)).toBe(3);
  });

  it("returns Shining (4) for [4,4,4,4,4,2,2,3,3,3,5]", () => {
    const answers = makeAnswers([4, 4, 4, 4, 4, 2, 2, 3, 3, 3, 5]);
    // Counts: {2:2, 3:3, 4:5, 5:1}
    // modes = [4], 5 >= 4, beats 3
    expect(calculateLiftScore(answers)).toBe(4);
  });

  it("returns Significance (5) for [5,5,5,5,5,4,4,4,3]", () => {
    const answers = makeAnswers([5, 5, 5, 5, 5, 4, 4, 4, 3]);
    // Counts: {3:1, 4:3, 5:5}
    // modes = [5], 5 >= 4, beats 3
    expect(calculateLiftScore(answers)).toBe(5);
  });

  it("returns 0 for empty answers", () => {
    expect(calculateLiftScore([])).toBe(0);
  });

  it("returns lowest mode when median not in modes", () => {
    // Edge case: all answers are 1 and 5 only
    const answers = makeAnswers([1, 1, 5, 5]);
    // Counts: {1:2, 5:2}
    // modes = [1,5], median = (1+5)/2 = 3 (not in modes)
    // Fallback to lowest mode = 1
    expect(calculateLiftScore(answers)).toBe(1);
  });
});
