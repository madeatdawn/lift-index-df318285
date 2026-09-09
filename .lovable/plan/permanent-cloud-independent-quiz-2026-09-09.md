# Permanent Cloud-independent quiz

## Goal
The public assessment must start, score, and redirect correctly even when Lovable Cloud is starting, unavailable, or times out.

## Changes
- Make the bundled quiz and five redirect destinations the authoritative public runtime data.
- Stop replacing an in-progress public quiz with late Cloud responses.
- Restrict Cloud reads and saves to the admin experience; public visitors will never wait on Cloud.
- Keep completion logging best-effort so a logging outage can never block the result redirect.
- Add outage regression tests that simulate failed and indefinitely pending Cloud requests and prove the quiz still starts and resolves every result.

## Technical details
- Split public runtime state from admin synchronization in the quiz context.
- Resolve redirects from immutable bundled destinations by score, rather than remotely editable values.
- Preserve existing admin editing and Cloud persistence, but apply saved changes locally only after a successful save.
- Add a redirect navigation seam for deterministic browser tests without changing visible behavior.

## Verification
- Run the complete test suite.
- Test the quiz in the browser while Cloud is still starting.
- Confirm all five scores produce valid destinations and no Cloud request can delay navigation.
