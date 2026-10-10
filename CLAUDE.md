# CLAUDE.md

Standing rules for working in this repo.

- **One PR per task.** Do all the work for a task on one branch and open a single PR.
- **Run `npm run build` before every PR.** Don't open a PR on a failing build.
- **Never merge without "merge it".** Open PRs and leave them unmerged until the owner says "merge it".
- **Never put secrets in code or chat.** API keys and tokens live in environment variables (`.env.local`, Vercel project settings). Don't commit them, paste them into code, or echo them back.
- **Keep the checkout's rainbow input overlay and autofill sync.** Every checkout input in `src/components/CheckoutFlow.jsx` uses the `Input`/`Select` components (rainbow overlay, `lb-field` class), has `name`/`id`/`autoComplete`, is listed in `FIELD_NAMES`, and is covered by the form's `onInput`, `onAnimationStart` (`onAutoFillStart`) and `syncFromForm` handlers. New checkout fields must do the same.
