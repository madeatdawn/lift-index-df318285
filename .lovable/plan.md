

## Make Admin Panel Fully Flexible

### What changes

#### 1. Editable option scores (currently locked)
In the Questions tab, the score value input for each option is currently `disabled`. This will be changed to an editable number input so you can set any score value per option.

#### 2. Add and remove options per question
Each question will get an "Add Option" button and each option will get a delete button, so you're not locked into exactly 5 options. A minimum of 2 options per question will be enforced.

#### 3. Add and remove result levels
The Results tab will get an "Add Result" button at the top and a delete button on each result card, matching the pattern already used for questions. A minimum of 1 result will be enforced.

---

### Technical details

**File: `src/pages/Admin.tsx`**

- **Option score editing**: Change the option value `Input` from `disabled` to editable, and add an `updateOptionValue` handler that sets `options[oIndex].value` to the parsed number.
- **Add/remove options**: Add an `addOption` function that appends a new option with an auto-generated ID (next letter or indexed) and default value. Add a `removeOption` function with a minimum-2 guard. Render a delete button next to each option and an "Add Option" button below the options list.
- **Add/remove results**: Add an `addResult` function that creates a new result with sensible defaults (empty name, 0-0 score range, empty description/URL). Add a `removeResult` function with a minimum-1 guard. Render a delete button on each result card and an "Add Result" button in the Results tab header.

No backend or database changes are needed -- the existing edge function and database schema already support variable numbers of options and results.

