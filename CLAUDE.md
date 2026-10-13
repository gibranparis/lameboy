# CLAUDE.md

Standing rules for working in this repo.

- **One PR per task.** Do all the work for a task on one branch and open a single PR.
- **Run `npm run build` before every PR.** Don't open a PR on a failing build.
- **Keep Vercel deploys to a minimum.** The Vercel plan allows 100 deployments a day, and every push to a PR branch (and every merge to `main`) builds one. Validate locally first (`npm run build`, a browser check), push each PR once, and fold follow-up tweaks into that one push or the next task's, never a string of small pushes. Never push just to re-run a build; if Vercel is rate-limited, redeploy the same commit from Vercel once the limit resets.
- **Merge when green.** Once `npm run build` passes and CI is green, merge the PR yourself — no need to wait for the owner to say "merge it".
- **Never put secrets in code or chat.** API keys and tokens live in environment variables (`.env.local`, Vercel project settings). Don't commit them, paste them into code, or echo them back.
- **Keep the checkout's rainbow input overlay and autofill sync.** Every checkout input in `src/components/CheckoutFlow.jsx` uses the `Input`/`Select` components (rainbow overlay, `lb-field` class), has `name`/`id`/`autoComplete`, is listed in `FIELD_NAMES`, and is covered by the form's `onInput`, `onAnimationStart` (`onAutoFillStart`) and `syncFromForm` handlers. New checkout fields must do the same.
