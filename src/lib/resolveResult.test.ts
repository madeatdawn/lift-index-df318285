import { describe, it, expect } from "vitest";
import {
  resolveResultByScore,
  resolveRedirectForScore,
  validateQuizDataForSave,
  isSafeAbsoluteUrl,
  SAFE_REDIRECTS_BY_SCORE,
  isUsableQuizData,
} from "./resolveResult";
import { initialQuizData } from "@/data/quizData";

describe("resolveResultByScore", () => {
  it("maps every integer score 1-5 to the matching level id", () => {
    const map: Record<number, string> = {
      1: "seeking",
      2: "striving",
      3: "steadfast",
      4: "shining",
      5: "significance",
    };
    for (const s of [1, 2, 3, 4, 5]) {
      const r = resolveResultByScore(s, initialQuizData.results);
      expect(r?.id, `score ${s}`).toBe(map[s]);
    }
  });

  it("falls back to closest band when score is in a gap", () => {
    // Bands have a tiny gap at 1.55 (between 1.5 and 1.6). It should pick one.
    const r = resolveResultByScore(1.55, initialQuizData.results);
    expect(r).not.toBeNull();
  });

  it("returns null for empty results", () => {
    expect(resolveResultByScore(3, [])).toBeNull();
  });
});

describe("resolveRedirectForScore", () => {
  it("uses configured URL when valid", () => {
    const out = resolveRedirectForScore(3, initialQuizData.results);
    expect(out.url).toBe("https://elanoura.com/steadfast");
    expect(out.usedFallback).toBe(false);
  });

  it("uses safe per-score fallback when redirectUrl is invalid", () => {
    const broken = initialQuizData.results.map((r) =>
      r.id === "shining" ? { ...r, redirectUrl: "not-a-url" } : r
    );
    const out = resolveRedirectForScore(4, broken);
    expect(out.url).toBe(SAFE_REDIRECTS_BY_SCORE[4]);
    expect(out.usedFallback).toBe(true);
  });

  it("never returns a non-http(s) URL", () => {
    for (const s of [1, 2, 3, 4, 5]) {
      const out = resolveRedirectForScore(s, []);
      expect(isSafeAbsoluteUrl(out.url)).toBe(true);
    }
  });
});

describe("validateQuizDataForSave", () => {
  it("accepts the bundled initial quiz data", () => {
    const r = validateQuizDataForSave(initialQuizData);
    expect(r.errors).toEqual([]);
    expect(r.valid).toBe(true);
  });

  it("rejects missing result levels", () => {
    const bad = {
      ...initialQuizData,
      results: initialQuizData.results.filter((r) => r.id !== "shining"),
    };
    const r = validateQuizDataForSave(bad);
    expect(r.valid).toBe(false);
    expect(r.errors.join("\n")).toMatch(/shining/);
  });

  it("rejects invalid redirect URLs", () => {
    const bad = {
      ...initialQuizData,
      results: initialQuizData.results.map((r) =>
        r.id === "seeking" ? { ...r, redirectUrl: "javascript:alert(1)" } : r
      ),
    };
    const r = validateQuizDataForSave(bad);
    expect(r.valid).toBe(false);
    expect(r.errors.join("\n")).toMatch(/redirectUrl/);
  });

  it("rejects option values outside 1-5", () => {
    const bad = JSON.parse(JSON.stringify(initialQuizData));
    bad.questions[0].options[0].value = 9;
    const r = validateQuizDataForSave(bad);
    expect(r.valid).toBe(false);
    expect(r.errors.join("\n")).toMatch(/value must be 1-5/);
  });

  it("rejects uncovered integer scores", () => {
    const bad = {
      ...initialQuizData,
      results: initialQuizData.results.map((r) =>
        r.id === "steadfast" ? { ...r, minScore: 2.9, maxScore: 3.1 } : r
      ),
    };
    // Now 2.6-2.89 and 3.11-3.5 are uncovered, but integers 1..5 still hit a band.
    // Force a real gap at integer 3 instead:
    const reallyBad = {
      ...initialQuizData,
      results: initialQuizData.results.map((r) =>
        r.id === "steadfast" ? { ...r, minScore: 3.4, maxScore: 3.5 } : r
      ),
    };
    const r = validateQuizDataForSave(reallyBad);
    expect(r.valid).toBe(false);
    expect(r.errors.join("\n")).toMatch(/score 3/);
  });
});

describe("isUsableQuizData", () => {
  it("rejects a partial live response with no results", () => {
    expect(isUsableQuizData({ questions: initialQuizData.questions, results: [] })).toBe(false);
  });

  it("rejects a stale cached response with broken redirects", () => {
    const stale = {
      ...initialQuizData,
      results: initialQuizData.results.map((result) => ({ ...result, redirectUrl: "" })),
    };
    expect(isUsableQuizData(stale)).toBe(false);
  });
});
