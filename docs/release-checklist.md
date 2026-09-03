# Release checklist — reimagined `neurotrocity.com`

Run these in order. Steps 1 and 3 (build/test) can be re-run any time; steps 2 and 4–7 are
one-directional and involve the live domain — do not skip ahead.

## 1. Pre-merge local verification (already run 2026-09-03, on branch `reimagine`)

```
$ npm run build
```
Output: build succeeded — `2 page(s) built in 3.45s` (`index.html`, `rewire/landing/index.html`,
plus the two `/og/*.png` static endpoints and `sitemap.xml`).

```
$ test -s dist/.well-known/apple-app-site-association && \
    python3 -c "import json;d=json.load(open('dist/.well-known/apple-app-site-association'));print(d['applinks']['details'][0]['appIDs'])"
```
Output: `['9VY7RCG6Y4.com.robbrown.dispoint']` — matches expected. AASA file present in `dist/`.

```
$ test -f dist/.nojekyll && echo present
```
Output: `present`.

```
$ cat dist/CNAME
```
Output: `neurotrocity.com` — matches expected.

```
$ grep -c '<loc>' dist/sitemap.xml
```
Output: `25`. (Note: the plan brief cites 24 as the expected count; the live sitemap generator
actually emits 25 URLs — see `dist/sitemap.xml` for the full list, which includes `/`,
`/rewire/landing/`, `/rewire/contact/`, `/rewire/sample/`, both `/contact/*` pages, both product
landing pages, all six `/rewire/sample/<slug>/` demo pages, and the DoseTrack/DisPoint
support/contact/privacy/terms/policy pages. 25 is the correct current count — treat 24 as stale,
not a regression.)

```
$ npm run test
```
Output: `Test Files 8 passed (8)`, `Tests 40 passed (40)`.

```
$ npm run test:e2e
```
Output: `64 passed`, `1 failed` on first run —
`tests/e2e/rewire.spec.ts:17 "exactly one demo iframe is live, matching the front card"` timed
out waiting for the deck's iframe to mount. Re-running that single test in isolation
(`npx playwright test tests/e2e/rewire.spec.ts -g "exactly one demo iframe"`) passed cleanly.
This is a known timing flake in the full suite, not a regression — re-run the full e2e suite once
more before merging and confirm it goes green; if it doesn't, treat it as a real bug, not a retry
target.

**Verdict: build, AASA, `.nojekyll`, `CNAME`, sitemap, and unit tests are all clean. Re-run
`npm run test:e2e` once more and confirm 65/65 before proceeding to step 2.**

## 2. Switch GitHub Pages source to Actions — before the merge

1. Go to the repo on GitHub → **Settings → Pages**.
2. Under **Build and deployment → Source**, change **Deploy from a branch** to
   **GitHub Actions**.
3. Do this *before* merging `reimagine` into `master`. The new workflow lives at
   `.github/workflows/deploy.yml` and publishes only on push to `master`; if Pages is still set to
   "Deploy from a branch" when you merge, GitHub Pages keeps serving whatever the old branch-based
   build last published, and the new site silently does not go live.

## 3. Merge and push

```
git checkout master
git pull --rebase           # repo is shared across workspaces — master moves underneath you
git merge --no-ff reimagine
git push
```

Then open the **Actions** tab and watch the `deploy.yml` run. It fails the build (and does not
publish) if the AASA file is missing from `dist/` — if it fails there, do not investigate live;
fix `public/.nojekyll` / `public/.well-known/` locally, re-verify with step 1, and push a fix
commit before retrying.

**A green Actions run does not guarantee neurotrocity.com actually updated** — Pages deploys have
been flaky before. Do not treat the workflow going green as done; complete step 4 before telling
anyone the site is live.

## 4. Post-deploy live verification

Run only after the Actions run in step 3 shows green:

```bash
curl -sI https://neurotrocity.com/.well-known/apple-app-site-association | head -3
# expect: HTTP/2 200

curl -s https://neurotrocity.com/sitemap.xml | grep -c '<loc>'
# expect: 25 (see the note under step 1 — 24 was the stale figure)

curl -sI https://neurotrocity.com/og/home.png | grep -i content-type
# expect: content-type: image/png
```

Then, on an iPhone with DisPoint installed, open a link shaped like
`https://neurotrocity.com/dispoint/d/anything` and confirm the DisPoint app opens directly
(universal link / AASA working end to end) rather than opening in Safari.

If any of these fail, do not proceed to step 5 — the deploy did not actually land. Re-check the
Actions run, and re-run this step after a few minutes in case of CDN propagation delay before
concluding it's broken.

## 5. Resubmit the sitemap in Google Search Console

1. Go to Search Console → the `neurotrocity.com` property → **Sitemaps**.
2. Resubmit `https://neurotrocity.com/sitemap.xml`.
3. Under **URL Inspection**, request indexing for `https://neurotrocity.com/rewire/landing/`
   specifically — it and the six demo model pages have never been indexed before this rebuild.

## 6. Social-card spot check

Share a link to `https://neurotrocity.com/` and `https://neurotrocity.com/rewire/landing/` in
iMessage, Slack, or LinkedIn (any one is enough) and confirm the OG card image and title/
description render correctly in the preview. This is the practical end-to-end check that
`/og/home.png` and `/og/rewire.png` are reachable and correctly sized (1200×630) from outside the
build environment.

## 7. Rollback plan

If anything in steps 4–6 turns up a real problem after the merge has already gone live:

```bash
git revert -m 1 <merge-sha>
git push
```

This re-publishes the previous site content through the same `deploy.yml` workflow (no need to
touch the Pages source setting again — it stays on "GitHub Actions" either way). Confirm the
revert deployed with the same step-4 curl checks before considering the rollback complete.
