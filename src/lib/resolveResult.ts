import { ResultLevel } from "@/types/quiz";

/**
 * Hardcoded, last-resort redirect URLs by integer score (1-5).
 * Only used if the database has no matching result OR its redirectUrl is invalid.
 * These five level IDs are the fixed contract — admins can edit text/URLs but
 * cannot delete or rename levels without breaking redirects.
 */
export const SAFE_REDIRECTS_BY_SCORE: Record<number, string> = {
  1: "https://elanoura.com/seeking",
  2: "https://elanoura.com/striving",
  3: "https://elanoura.com/steadfast",
  4: "https://elanoura.com/shining",
  5: "https://elanoura.com/significance",
};

export const EXPECTED_RESULT_IDS = [
  "seeking",
  "striving",
  "steadfast",
  "shining",
  "significance",
] as const;

export const isSafeAbsoluteUrl = (url: string | undefined | null): url is string => {
  if (!url || typeof url !== "string") return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

/**
 * Resolve a result entry from a numeric score using the data-driven score bands
 * (minScore/maxScore) defined per result. Falls back to the closest band if the
 * score falls in a gap, and finally to null if there are no results at all.
 *
 * This is the ONLY way the app should map a score to a result — never use
 * hardcoded id maps, because they drift when admin edits change ids/labels.
 */
export const resolveResultByScore = (
  score: number,
  results: ResultLevel[]
): ResultLevel | null => {
  if (!Array.isArray(results) || results.length === 0) return null;

  const inBand = results.find(
    (r) => score >= Number(r.minScore) && score <= Number(r.maxScore)
  );
  if (inBand) return inBand;

  // Gap fallback: pick the result whose band edge is closest to the score.
  return (
    [...results].sort((a, b) => {
      const da = Math.min(
        Math.abs(score - Number(a.minScore)),
        Math.abs(score - Number(a.maxScore))
      );
      const db = Math.min(
        Math.abs(score - Number(b.minScore)),
        Math.abs(score - Number(b.maxScore))
      );
      return da - db;
    })[0] || null
  );
};

export interface RedirectResolution {
  url: string;
  result: ResultLevel | null;
  usedFallback: boolean;
}

/**
 * Resolve the final, guaranteed-valid redirect URL for a quiz score.
 * Order: data-driven result.redirectUrl → safe per-score default → elanoura.com.
 */
export const resolveRedirectForScore = (
  score: number,
  results: ResultLevel[]
): RedirectResolution => {
  const result = resolveResultByScore(score, results);
  if (result && isSafeAbsoluteUrl(result.redirectUrl)) {
    return { url: result.redirectUrl, result, usedFallback: false };
  }
  const rounded = Math.round(score);
  const fallback =
    SAFE_REDIRECTS_BY_SCORE[rounded] || "https://elanoura.com";
  return { url: fallback, result, usedFallback: true };
};

export interface QuizDataValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a full quizData payload before persisting it. Rejects anything that
 * would silently break the redirect contract: missing levels, invalid URLs,
 * out-of-range option values, gaps/overlaps in score bands.
 */
export const validateQuizDataForSave = (data: unknown): QuizDataValidationResult => {
  const errors: string[] = [];
  const d = data as { questions?: unknown[]; results?: unknown[] } | null;

  if (!d || typeof d !== "object") {
    return { valid: false, errors: ["quizData must be an object"] };
  }

  const questions = Array.isArray(d.questions) ? d.questions : [];
  const results = Array.isArray(d.results) ? d.results : [];

  if (questions.length === 0) errors.push("At least one question is required");

  questions.forEach((q: any, qi: number) => {
    if (!q?.id || typeof q.id !== "string") errors.push(`Question ${qi + 1}: missing id`);
    if (!q?.question || typeof q.question !== "string") {
      errors.push(`Question ${qi + 1}: missing text`);
    }
    if (!Array.isArray(q?.options) || q.options.length === 0) {
      errors.push(`Question ${qi + 1}: must have at least one option`);
      return;
    }
    q.options.forEach((opt: any, oi: number) => {
      const v = Number(opt?.value);
      if (!Number.isFinite(v) || v < 1 || v > 5) {
        errors.push(
          `Question ${qi + 1} option ${oi + 1}: value must be 1-5 (got ${opt?.value})`
        );
      }
      if (!opt?.id || typeof opt.id !== "string") {
        errors.push(`Question ${qi + 1} option ${oi + 1}: missing id`);
      }
      if (!opt?.text || typeof opt.text !== "string") {
        errors.push(`Question ${qi + 1} option ${oi + 1}: missing text`);
      }
    });
  });

  // Results contract: exactly the 5 expected ids must exist.
  const ids = new Set(results.map((r: any) => r?.id));
  for (const expected of EXPECTED_RESULT_IDS) {
    if (!ids.has(expected)) errors.push(`Missing required result level: "${expected}"`);
  }

  results.forEach((r: any, ri: number) => {
    const min = Number(r?.minScore);
    const max = Number(r?.maxScore);
    if (!Number.isFinite(min) || min < 1 || min > 5) {
      errors.push(`Result ${ri + 1} (${r?.id}): minScore must be 1-5`);
    }
    if (!Number.isFinite(max) || max < 1 || max > 5) {
      errors.push(`Result ${ri + 1} (${r?.id}): maxScore must be 1-5`);
    }
    if (Number.isFinite(min) && Number.isFinite(max) && min > max) {
      errors.push(`Result ${ri + 1} (${r?.id}): minScore > maxScore`);
    }
    if (!isSafeAbsoluteUrl(r?.redirectUrl)) {
      errors.push(
        `Result ${ri + 1} (${r?.id}): redirectUrl must be a valid http(s) URL`
      );
    }
  });

  // Coverage check: every integer score 1..5 must resolve to a band.
  for (const score of [1, 2, 3, 4, 5]) {
    const hit = results.some(
      (r: any) => score >= Number(r?.minScore) && score <= Number(r?.maxScore)
    );
    if (!hit) errors.push(`No result level covers score ${score}`);
  }

  return { valid: errors.length === 0, errors };
};
