
# Track Traffic Source & Log to Google Sheet

## What This Does

When someone visits the quiz — whether from an Instagram bio link, a TikTok link, a Gmail email, or anywhere else — the app will automatically detect where they came from and include that in the Google Sheet row alongside their answers and result.

### How Traffic Source Is Detected

Two signals will be captured on page load and stored throughout the quiz session:

1. **UTM parameters** — these are tags you (or a link tool) can add to quiz URLs, e.g. `?utm_source=instagram&utm_campaign=february`. If someone clicks a link with these tags, the source is exact.

2. **HTTP Referrer** — the browser automatically tells websites what page the user came from. So if someone clicks from Gmail, the referrer is `mail.google.com`. From Instagram's in-app browser it might be `instagram.com`, etc.

The app reads both on arrival, picks the best one (UTM wins over referrer), and holds onto it for the duration of the quiz.

### Google Sheet Column Layout (Updated)

| Timestamp | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 | Result | Source |
|-----------|----|----|----|----|----|----|----|----|----|----|--------|--------|
| 2026-02-20 10:00 | 4 | 5 | 2 | 1 | 3 | 4 | 5 | 3 | 2 | Steadfast | instagram |

---

## Files to Change

### 1. `src/pages/Quiz.tsx`

On component mount, read `document.referrer` and any UTM parameters from the URL (`window.location.search`). Store the detected source in a `useRef` so it persists across question renders without causing re-renders.

At quiz completion, include the `source` field in the payload sent to the backend function:

```text
{
  answers: [4, 5, 2, 1, 3, 4, 5, 3, 2],
  result: "Steadfast",
  timestamp: "2026-02-20T10:00:00.000Z",
  source: "instagram"         ← new field
}
```

Source detection logic (priority order):
1. `utm_source` query param → use as-is (e.g. `instagram`, `tiktok`, `newsletter`)
2. `document.referrer` hostname → simplified (e.g. `mail.google.com` → `gmail`, `t.co` → `twitter/x`, `l.instagram.com` → `instagram`)
3. No referrer + no UTM → `"direct"`

### 2. `supabase/functions/log-quiz-completion/index.ts`

Accept the optional `source` field from the request body and pass it through to the Google Sheets webhook:

```text
{ answers, result, timestamp, source }  →  forwarded to webhook as-is
```

### 3. Google Apps Script (you update manually)

The Apps Script in your Google Sheet needs one extra field appended to the row. You'll paste a small update:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = JSON.parse(e.postData.contents);
  
  var row = [
    data.timestamp,
    ...data.answers,
    data.result,
    data.source || "unknown"   // ← add this
  ];
  
  sheet.appendRow(row);
  
  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

You'll also want to add a "Source" header to column L in the sheet manually.

---

## Technical Notes

- The source is captured once when the page loads and stored in a `useRef` — it won't be lost even as the user navigates through questions.
- UTM parameters are only read from the initial URL when the page first loads (not from the current URL during the quiz, which doesn't change).
- Common referrers will be mapped to friendly names: `mail.google.com` → `gmail`, `t.co` / `twitter.com` → `twitter`, `l.instagram.com` / `instagram.com` → `instagram`, `lnkd.in` → `linkedin`, `facebook.com` / `fb.com` → `facebook`, etc.
- If neither signal is present, the source is logged as `direct`.
- This is purely client-side and requires no new secrets or database tables.
