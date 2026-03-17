

## Speed Up Quiz Loading and Redirect

### Current bottlenecks identified

1. **Initial load: 3 sequential database queries** -- `fetchQuizData` fires questions, options, and results queries one after another (each awaited sequentially). This adds up to ~600-900ms on cold loads.

2. **100ms artificial delay before scoring** -- `handleQuizComplete` wraps all logic in `setTimeout(() => { ... }, 100)` just to "show the loading state." This is unnecessary latency.

3. **Up to 3 second wait for Google Sheets logging before redirect** -- The redirect is blocked by `logWithTimeout` which waits up to 3s for the edge function to respond.

4. **No caching** -- Every page load re-fetches all quiz data from the database, even though it rarely changes.

### Changes

**`src/hooks/useQuizDatabase.tsx`**
- Run all 3 database queries in parallel using `Promise.all([questionsQuery, optionsQuery, resultsQuery])` instead of sequentially. Cuts load time by ~60%.

**`src/pages/Quiz.tsx`**
- Remove the `setTimeout(() => { ... }, 100)` wrapper in `handleQuizComplete` -- run scoring immediately.
- Fire-and-forget the Google Sheets logging: call `fetch()` but don't await it before redirecting. The browser will complete the request in the background. Remove the `Promise.race` / 3s timeout pattern entirely.

**`src/contexts/QuizContext.tsx`**
- Cache quiz data in `sessionStorage` so subsequent navigations (e.g. user hits back) don't re-fetch. On load: check sessionStorage first, use it immediately, then optionally refresh in background.
- Set `isLoading` properly during the initial fetch so the quiz doesn't flash a loading state unnecessarily.

### Summary of expected improvements
- Initial load: ~60% faster (parallel queries + sessionStorage cache)
- Quiz completion to redirect: near-instant (remove 100ms delay + fire-and-forget logging)

