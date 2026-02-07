

# Fix Mobile Start Screen Layout

## Issues Identified

1. **Logo overlaps title**: The logo uses `absolute top-[30px]` positioning, which sits on top of the card content since the card is centered in the viewport.
2. **Excessive padding**: The card uses `p-12` (3rem / 48px) on all sides, which eats into the limited mobile width and makes text hard to read.

## Changes

### `src/pages/Quiz.tsx` (Start screen section, ~lines 228-280)

1. **Move logo out of absolute positioning on mobile**: Change the logo from `absolute` to being part of the normal document flow above the card, so it sits above the title instead of overlapping it. Add a margin-bottom to space it from the card content.

2. **Reduce card padding on mobile**: Change `p-12` to `p-6 md:p-12` so mobile gets 1.5rem padding while desktop keeps the current 3rem.

3. **Reduce title size on mobile**: Change `text-5xl` to `text-3xl md:text-5xl` for the heading so it fits better on small screens.

### Technical Details

- Logo: Replace `absolute top-[30px] left-1/2 -translate-x-1/2 z-10` with a flex-column layout that places the logo above the card in normal flow, with `mb-8` spacing.
- Card padding: `p-12` becomes `p-6 md:p-12`
- Title: `text-5xl` becomes `text-3xl md:text-5xl`
- The page container's `padding: 1.5rem` from `containers.css` is fine and stays unchanged.

