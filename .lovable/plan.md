

# Log Quiz Completions to Google Sheets

## How It Works

When someone completes the quiz, the app will send their answers and result to a Google Sheet via a free Google Apps Script webhook. Each completion becomes a new row.

### Your Google Sheet Layout

| Timestamp | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 | Result |
|-----------|----|----|----|----|----|----|----|----|----|----|
| 2026-02-07 14:30 | 4 | 5 | 2 | 1 | 3 | 4 | 5 | 3 | 2 | Steadfast |

---

## Setup Steps (one-time, ~5 minutes)

You'll need to create a free Google Apps Script webhook that accepts data and writes it to your sheet:

1. Create a new Google Sheet
2. Go to **Extensions > Apps Script**
3. Paste a small script (I'll provide it) that receives data and appends rows
4. Click **Deploy > New deployment > Web app** (set access to "Anyone")
5. Copy the webhook URL and paste it into your app's admin settings or as a configuration

---

## Technical Implementation

### 1. New Edge Function: `log-quiz-completion`

A backend function that receives the quiz answers and result, then forwards them to the Google Apps Script webhook URL. This keeps the webhook URL server-side and handles errors gracefully without blocking the user's redirect.

**Input**: `{ answers: number[], result: string, timestamp: string }`
**Output**: `{ success: boolean }`

The function will:
- Accept the answers array (values 1-5) and result name
- POST to the Google Apps Script webhook URL
- Return success/failure (non-blocking to the user)

### 2. Store the Webhook URL as a Secret

The Google Apps Script webhook URL will be stored as a backend secret (`GOOGLE_SHEETS_WEBHOOK_URL`) so it's not exposed in frontend code.

### 3. Update `src/pages/Quiz.tsx`

In the `handleQuizComplete` function (around line 106), after calculating the score and before redirecting, fire off the logging call:

```text
1. Calculate score and determine result (existing)
2. NEW: Call edge function with answers + result (fire-and-forget, non-blocking)
3. Redirect to result URL (existing)
```

The logging is fire-and-forget -- it won't delay the redirect or show errors to the user.

### 4. Google Apps Script (provided for you to paste)

I'll provide a ready-to-use script that:
- Receives POST requests with quiz data
- Appends a row with timestamp + 9 answer values + result name
- Returns success response

---

## Files to Create/Modify

| File | Change |
|------|--------|
| `supabase/functions/log-quiz-completion/index.ts` | **New** -- Edge function to forward data to Google Sheets |
| `supabase/config.toml` | Add function config with `verify_jwt = false` (public endpoint) |
| `src/pages/Quiz.tsx` | Add fire-and-forget call to log completion before redirect |

