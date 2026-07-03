# questions-waiting audit
## Verdict
ISSUES-FOUND
## Findings
### [high] [CONFIRMED] Partner answers become queryable before analysis completes
File: supabase/migrations/20251110051815_init_human_alignment.sql:271

What happens: The response RLS policy allows participants to read partner responses once both users have `submitted_at` for the round, with no requirement that analysis exists or that status has advanced past `analyzing`. The helper also fetches full partner responses with only `.not('submitted_at', 'is', null)` at `app/lib/db-helpers.ts:149`. Waiting only passes a boolean to the client at `app/alignment/[id]/waiting/page.tsx:56`, so the waiting UI does not render the answers, but the data is still selectable by a participant before analysis completes.

User-visible effect: A technical user can query the partner's answers after both submit but before the analysis is finished. That violates the stricter two-party requirement that answers must not be visible until both submit and analysis completes.

Fix sketch: Tighten response visibility to require either an existing `alignment_analyses` row for that alignment/round or an alignment status of `resolving`/`complete`. Keep waiting status checks on a narrow boolean/query/RPC that never returns answer JSON. Use a SECURITY DEFINER helper if the RLS check would otherwise recurse.

### [high] [CONFIRMED] Concurrent analysis handoff can error one party
File: app/alignment/[id]/analysis/page.tsx:228

What happens: Any analysis page request with no saved analysis and at least two submitted responses calls `triggerServerAnalysis`. Both parties can be routed to `/analysis` at nearly the same time: the second submitter is pushed there immediately from waiting when `initialPartnerSubmitted` is true at `app/alignment/[id]/waiting/waiting-client.tsx:38`, while the first submitter is pushed by polling when two submitted responses exist at `app/alignment/[id]/waiting/waiting-client.tsx:78`. The API has an atomic status lock at `app/api/alignment/analyze/route.ts:157`, so duplicate AI token spend is mostly prevented, but the losing request gets a 409 while no analysis exists at `app/api/alignment/analyze/route.ts:149` or `app/api/alignment/analyze/route.ts:181`. The server page treats any non-OK analyze response as fatal at `app/alignment/[id]/analysis/page.tsx:539`.

User-visible effect: One party can see an error boundary or flicker during the handoff while the other party's analysis request is still running. This is not a double-token bug in the common race, but it is a real concurrent-navigation failure.

Fix sketch: Make `/api/alignment/analyze` idempotent for `analyzing`: return `202`/`200` with `inProgress: true` instead of throwing while the lock holder works. Make the analysis page handle that state by polling/refreshing for the saved analysis. Longer term, trigger analysis from a single server mutation/job when the second response is submitted.

### [medium] [CONFIRMED] Active status routes submitted users back to questions
File: app/alignment/[id]/page.tsx:40

What happens: The phase router maps every `active` alignment to `/questions`. But after a user submits, `QuestionnaireClient` sets status to `active` and pushes `/waiting` at `app/alignment/[id]/questions/questionnaire-client.tsx:312`. The waiting page only renders if the current user has submitted at `app/alignment/[id]/waiting/page.tsx:47`, while the questions page has no status or submitted-response guard before rendering the client at `app/alignment/[id]/questions/page.tsx:94`.

User-visible effect: A submitted user who opens `/alignment/:id` from a dashboard/link gets routed back to the questionnaire instead of waiting. That can look like a loop or flicker, and it also lets submitted answers be edited after submission.

Fix sketch: For `active`, route based on the current user's `user_response.submitted_at`: submitted users go to `/waiting`, unsubmitted users go to `/questions`. Add the same guard to `/questions` itself and either freeze submitted responses or require an explicit "revise submission" flow.

### [medium] [CONFIRMED] Fast submit can bounce waiting back to questions with stale or missing answers
File: app/alignment/[id]/questions/questionnaire-client.tsx:139

What happens: Answers are saved by a 1500 ms debounced effect. Submit does not flush the latest answers; it only updates `submitted_at` on an existing `alignment_responses` row at `app/alignment/[id]/questions/questionnaire-client.tsx:301`. If the row does not exist yet, or the final keystrokes have not been autosaved, submit can push to waiting at `app/alignment/[id]/questions/questionnaire-client.tsx:319` while the server waiting guard still sees no submitted user response and redirects back to questions at `app/alignment/[id]/waiting/page.tsx:50`.

User-visible effect: A user who answers the last question and immediately submits can see a waiting-page flash followed by a return to questions, or the analysis can run against stale answers.

Fix sketch: On submit, write the full response payload and `submitted_at` in one upsert, preferably through a server route that validates participation and required answers. Disable navigation until that write returns the submitted row.

### [medium] [CONFIRMED] Questionnaire autosave can repeatedly save and flicker its status indicator
File: app/alignment/[id]/questions/questionnaire-client.tsx:62

What happens: `QuestionnaireClient` creates a Supabase client during render. `saveAnswers` depends on that client at `app/alignment/[id]/questions/questionnaire-client.tsx:136`, and the debounce effect depends on `saveAnswers` at `app/alignment/[id]/questions/questionnaire-client.tsx:147`. Because the client/callback identity can change on each render, unrelated state updates can reset the save timer. The save itself updates `saveStatus` at `app/alignment/[id]/questions/questionnaire-client.tsx:99` and `app/alignment/[id]/questions/questionnaire-client.tsx:130`, and the UI always renders the changing save badge at `app/alignment/[id]/questions/questionnaire-client.tsx:386`.

User-visible effect: With any answers present, the questionnaire can churn network saves and visibly cycle "Saving..." / "Draft saved" / "Auto-save on" even when the user is not actively typing. I do not see code proof of focus loss, but the status and render churn are confirmed.

Fix sketch: Memoize or ref the Supabase client, make autosave depend on a dirty answer snapshot rather than a per-render callback, and clear the "saved" timeout on unmount. Keep the badge stable unless a real save is in flight.

### [low] [CONFIRMED] Waiting has multiple navigation paths and no guard for in-flight poll completion
File: app/alignment/[id]/waiting/waiting-client.tsx:65

What happens: Waiting can navigate to analysis from three places: initial partner-submitted state at `app/alignment/[id]/waiting/waiting-client.tsx:38`, realtime status updates at `app/alignment/[id]/waiting/waiting-client.tsx:45`, and polling at `app/alignment/[id]/waiting/waiting-client.tsx:65`. The interval and initial timeout are cleaned up on effect cleanup at `app/alignment/[id]/waiting/waiting-client.tsx:103`, but the async `poll` function has no mounted/aborted guard before `setPartnerSubmitted` and `router.push` at `app/alignment/[id]/waiting/waiting-client.tsx:78`.

User-visible effect: Duplicate `router.push('/analysis')` calls are possible. If the user leaves waiting while a poll is in flight, the completed poll can still navigate them back to analysis. By itself this does not call the analyze API, but it contributes to the concurrent analysis-page race above.

Fix sketch: Add a single `navigateOnceRef`, use `router.replace`, gate async poll completion with a mounted/abort flag, and consider disabling polling while realtime is connected or only polling for the exact missing signal.

## Flow trace
1. Clarity starts on `/alignment/:id/clarity` only while status is `draft`; the clarity page redirects non-draft statuses at `app/alignment/[id]/clarity/page.tsx:55`.
2. Continuing from clarity calls `saveProgress`, optionally adds a selected partner, posts to `/api/alignment/generate-questions`, and pushes `/questions` at `app/alignment/[id]/clarity/ClarityForm.tsx:349`.
3. `/api/alignment/generate-questions` inserts a generated template and, if the alignment is still `draft`, updates status to `active` at `app/api/alignment/generate-questions/route.ts:177`.
4. The questions page loads only the current user's existing response into `existingAnswers` at `app/alignment/[id]/questions/page.tsx:72` and renders `QuestionnaireClient` without a status/submission guard at `app/alignment/[id]/questions/page.tsx:94`.
5. Party A answers questions. Autosave upserts A's response after a 1500 ms debounce at `app/alignment/[id]/questions/questionnaire-client.tsx:139`.
6. Party A submits. The client validates required questions, updates A's existing response row with `submitted_at` at `app/alignment/[id]/questions/questionnaire-client.tsx:300`, updates alignment status to `active` at `app/alignment/[id]/questions/questionnaire-client.tsx:312`, and pushes `/waiting` at `app/alignment/[id]/questions/questionnaire-client.tsx:318`.
7. Party A's waiting server page allows the page because status is `active` and A has `user_response.submitted_at` at `app/alignment/[id]/waiting/page.tsx:47`. `initialPartnerSubmitted` is false if B has not submitted at `app/alignment/[id]/waiting/page.tsx:55`.
8. Party A's waiting client subscribes to alignment updates at `app/alignment/[id]/waiting/waiting-client.tsx:59` and starts a 3-second initial poll plus 10-second interval at `app/alignment/[id]/waiting/waiting-client.tsx:99`.
9. Party B reaches questions while status is `active` through the phase router at `app/alignment/[id]/page.tsx:40`, answers, autosaves, submits, updates their own `submitted_at`, sets status to `active` again, and pushes `/waiting` by the same submit code.
10. Party B's waiting server page sees A as `partner_response` if A has submitted at `app/alignment/[id]/waiting/page.tsx:55`. The waiting client initializes `partnerSubmitted` true and immediately pushes `/analysis` at `app/alignment/[id]/waiting/waiting-client.tsx:38`.
11. Party A reaches `/analysis` either when polling sees two submitted responses at `app/alignment/[id]/waiting/waiting-client.tsx:78` or after an alignment status update to `analyzing`/`resolving` comes through realtime at `app/alignment/[id]/waiting/waiting-client.tsx:45`.
12. The first `/analysis` server render with no saved analysis counts submitted responses at `app/alignment/[id]/analysis/page.tsx:216` and calls `/api/alignment/analyze` at `app/alignment/[id]/analysis/page.tsx:228`.
13. `/api/alignment/analyze` accepts only `active` or `resolving`, then atomically updates status to `analyzing` to lock the run at `app/api/alignment/analyze/route.ts:132` and `app/api/alignment/analyze/route.ts:157`.
14. The analyze API fetches both submitted responses at `app/api/alignment/analyze/route.ts:189`, runs AI at `app/api/alignment/analyze/route.ts:235`, saves analysis at `app/api/alignment/analyze/route.ts:238`, and transitions status to `resolving` at `app/api/alignment/analyze/route.ts:295`.
15. Any concurrent `/analysis` render before the saved analysis exists can call the same analyze API and receive a 409 from the in-progress/status lock path at `app/api/alignment/analyze/route.ts:149` or `app/api/alignment/analyze/route.ts:181`; the analysis page throws on that non-OK response at `app/alignment/[id]/analysis/page.tsx:539`.
