# HakuNeko Custom Development and Maintenance Guide

This document records how this fork is organized, which custom changes it contains, how the installed macOS launcher uses it, and how to update, test, build, verify, and troubleshoot it in the future.

## Current setup

| Purpose | Location or value |
| --- | --- |
| Local fork | `~/Developer/haruneko` |
| Personal GitHub fork | `git@github.com:SamuelDovgin/haruneko.git` |
| Upstream repository | `https://github.com/manga-download/haruneko.git` |
| Upstream-tracking branch | `master` |
| Custom development branch | `personal` |
| Custom macOS launcher | `~/Applications/HakuNeko Custom.app` |
| Launcher support files | `~/Library/Application Support/HakuNeko Custom` |
| Generated frontend | `~/Developer/haruneko/web/build` |
| Local frontend URL | `http://127.0.0.1:51234/` |

The Git remotes are intentionally configured as follows:

```text
origin    git@github.com:SamuelDovgin/haruneko.git
upstream  https://github.com/manga-download/haruneko.git
```

`master` is kept close to upstream. All personal changes belong on `personal`. This makes it possible to merge future upstream work without losing local connector or UI changes.

## Custom changes

The initial customization series was migrated to `personal` as six commits:

| Commit | Purpose |
| --- | --- |
| `2f3f11f1` | Add the nHentai Yaoi connector and its end-to-end test |
| `6925c075` | Implement the E-Hentai gallery connector |
| `f43d54c0` | Cover paginated E-Hentai galleries |
| `757beda7` | Preserve MangaGo's visible chapter ordering |
| `ebfee6e9` | Restore MangaGo URL paste support behind Cloudflare |
| `97e3274d` | Pin `esrap` so the current production build succeeds |

The hashes are useful for inspection and recovery. If the branch is ever rebased, use the commit subjects and file history because the hashes will change.

### nHentai Yaoi

Important files:

- `web/src/engine/websites/NHentaiYaoi.ts`
- `web/src/engine/websites/NHentaiYaoi_e2e.ts`
- `web/src/engine/websites/_index.ts`

The connector must remain exported through `_index.ts`; otherwise it can exist in the source tree without appearing in HakuNeko.

### E-Hentai

Important files:

- `web/src/engine/websites/legacy/EHentai.ts`
- `web/src/engine/websites/EHentai_e2e.ts`

The custom work handles direct gallery loading and paginated gallery coverage. When upstream changes the legacy connector, compare both the implementation and the end-to-end cases before resolving a merge conflict.

### MangaGo

Important files:

- `web/src/engine/websites/MangaGo.ts`
- `web/src/engine/websites/MangaGo.DRM.ts`
- `web/src/engine/websites/MangaGo_e2e.ts`

MangaGo changed in a way that caused ordinary metadata fetching to encounter Cloudflare or challenge content. The repair has three key pieces:

1. `ValidateMangaURL` explicitly accepts canonical MangaGo title URLs under `/read-manga/.../`.
2. `FetchManga` uses `FetchWindowScript` so title metadata is read through HakuNeko's browser-backed fetch path instead of relying on a basic HTTP response.
3. The title extraction has three fallbacks: the visible `<h1>`, the Open Graph title, and a cleaned `document.title`.

The chapter list returned by MangaGo is newest-first. `FetchChapters` prefixes every chapter name with an inverse list position such as `0028.000_`. This preserves the exact visible order for numbered chapters, notices, extras, and side stories in both the UI and downloaded folder names.

The canonical live verification URL is:

```text
https://www.mangago.me/read-manga/mr_a_s_farm/
```

The completed live test selected the `MangaGo` connector and returned:

```text
Mr.A's Farm (Yaoi)
0028.000_Special. : Special Episode 2 (The End)
0027.000_Special. : Special Episode 1
0026.000_Ch.24.5 : Creator's Note
Items: 28/28
```

If MangaGo breaks again, first inspect whether the URL pattern, title selectors, DRM chapter endpoint, or Cloudflare behavior changed. Preserve the browser-backed metadata path unless direct fetching is proven reliable again.

## Production-build pin

The current upstream dependency set can resolve `esrap` to `2.3.3`. That version generated output that Rolldown could not parse for legacy event-forwarding directives in Carbon Svelte components. Typical errors named:

```text
carbon-components-svelte/src/ContentSwitcher/ContentSwitcher.svelte
carbon-components-svelte/src/DatePicker/DatePicker.svelte
Unexpected token
```

The connector code was not responsible. Static checks and tests passed while the production build failed. The minimal repair is the direct development dependency in `web/package.json`:

```json
"esrap": "2.3.0"
```

This lets the current Vite, Svelte, Carbon, React, and Vue versions remain unchanged. Do not remove the pin merely because `npm install` succeeds. Remove it only after confirming all of the following with a newer dependency set:

```zsh
npm install
npm run check
npm run test
npm --workspace=web run build
npm --workspace=app/electron run build
```

## Normal update workflow

The automated updater is stored outside the repository at:

```text
~/Library/Application Support/HakuNeko Custom/update-and-build.zsh
```

Run it with:

```zsh
"$HOME/Library/Application Support/HakuNeko Custom/update-and-build.zsh"
```

The script:

1. Refuses to proceed if the checkout has uncommitted changes.
2. Fetches `upstream`.
3. Fast-forwards local `master` to `upstream/master`.
4. Merges `master` into `personal`.
5. Installs dependencies.
6. Runs checks and tests.
7. Builds the web and Electron targets.
8. Pushes `personal` only after every preceding step succeeds.

The equivalent manual workflow is:

```zsh
cd "$HOME/Developer/haruneko"
git status --short
git fetch upstream
git switch master
git merge --ff-only upstream/master
git switch personal
git merge --no-edit master
npm install
npm run check
npm run test
npm --workspace=web run build
npm --workspace=app/electron run build
git push origin personal
```

If a merge conflict occurs, the update script stops before testing or pushing. Resolve only the conflicted files, then continue with:

```zsh
git status
git add <resolved-files>
git commit
npm run check
npm run test
npm --workspace=web run build
npm --workspace=app/electron run build
git push origin personal
```

Pay particular attention to conflicts in connector files, `web/src/engine/websites/_index.ts`, `web/package.json`, and frontend files with personal UI changes.

## Validation commands

Install dependencies:

```zsh
npm install
```

Run all static validation:

```zsh
npm run check
```

Run all unit tests:

```zsh
npm run test
```

Build the frontend used by `HakuNeko Custom.app`:

```zsh
npm --workspace=web run build
```

Build the Electron shell code:

```zsh
npm --workspace=app/electron run build
```

Run the Electron frontend smoke tests after both builds exist:

```zsh
npx vitest run --reporter=dot \
  --config=test/vitest.e2e.js \
  "Frontend" \
  --testNamePattern="SmokeTests"
```

At the time this guide was created, the final validation produced:

- Static checks: passed with zero Svelte warnings or errors.
- Unit tests: 2,139 passed and 5 skipped.
- Web production build: passed.
- Electron production build: passed.
- Electron smoke tests: 2 passed and 2 skipped.
- Production dependency audit: zero vulnerabilities with `npm audit --omit=dev`.
- Full dependency audit: one high-severity development advisory in upstream's `extract-zip@2.0.1`, with no available fix at that time.

Test totals will naturally change as upstream adds or removes tests.

## How the macOS custom app works

`~/Applications/HakuNeko Custom.app` is a small launcher, not a separate full Electron distribution. Its executable is:

```text
~/Applications/HakuNeko Custom.app/Contents/MacOS/HakuNeko Custom
```

The launcher performs this sequence:

1. Confirms the official `/Applications/HakuNeko.app` shell exists.
2. Confirms `~/Developer/haruneko/web/build/index.html` exists.
3. Closes another running HakuNeko instance because the official and custom frontends share an Electron profile.
4. Serves the fork's `web/build` directory on `127.0.0.1:51234`.
5. Starts the official Electron executable with `--origin=http://127.0.0.1:51234/`.
6. Stops the temporary local server when HakuNeko exits.

The official app is used only as the native shell and is not modified.

Launcher logs are stored at:

```text
~/Library/Application Support/HakuNeko Custom/server.log
~/Library/Application Support/HakuNeko Custom/app.log
```

Additional local notes are stored at:

```text
~/Library/Application Support/HakuNeko Custom/README.txt
```

If the app bundle's executable or resources are edited, its ad-hoc signature must be refreshed:

```zsh
codesign --force --deep --sign - "$HOME/Applications/HakuNeko Custom.app"
codesign --verify --deep --strict --verbose=2 "$HOME/Applications/HakuNeko Custom.app"
```

## Common troubleshooting

### The custom app says the web build is missing

Rebuild it:

```zsh
cd "$HOME/Developer/haruneko"
npm install
npm --workspace=web run build
```

Confirm the expected entry point exists:

```zsh
test -f "$HOME/Developer/haruneko/web/build/index.html" && echo "build exists"
```

### Port 51234 is already in use

Find the listener:

```zsh
lsof -nP -iTCP:51234 -sTCP:LISTEN
```

Quit the stale HakuNeko instance normally before starting the custom launcher again. The launcher intentionally refuses to take over an occupied port.

### The app appears to use an older build

Fully quit HakuNeko, rebuild, and relaunch `HakuNeko Custom.app`. The generated build directory uses a unique build identifier, but an already-running Electron renderer can continue displaying the previous assets until it is closed.

Check which generated assets the local server is serving:

```zsh
tail -50 "$HOME/Library/Application Support/HakuNeko Custom/server.log"
```

### A pasted MangaGo URL does nothing

Use the complete canonical URL including `https://www.` and the trailing slash. Then check:

1. The selected connector changes to `MangaGo`.
2. `MangaGo.ts` still contains `ValidateMangaURL` and browser-backed `FetchManga`.
3. The current page still exposes a usable visible heading, Open Graph title, or document title.
4. Cloudflare is not presenting a new challenge flow that the current browser window cannot complete.
5. The app is loading the fork's new build rather than an older renderer.

### The production build reports Carbon Svelte parse errors

Confirm the `esrap` pin is present and resolved:

```zsh
rg -n '"esrap"' web/package.json
npm ls esrap --all
```

The expected resolved version is `2.3.0`. If npm retained a stale dependency tree, regenerate it with the repository's clean-install script:

```zsh
npm run npm:clean-install
npm --workspace=web run build
```

### A connector disappears from the UI

Confirm its source file is exported by `web/src/engine/websites/_index.ts`, then rebuild the frontend. A connector class that is not registered in the index will not appear in the generated application.

## Recovery and rollback

The previous custom checkout was deliberately retained at:

```text
~/Library/Application Support/HakuNeko Custom/source
```

It is a rollback/reference copy and should not be treated as the active source. The active launcher points only to `~/Developer/haruneko/web/build`.

Useful history commands:

```zsh
cd "$HOME/Developer/haruneko"
git status
git log --oneline --decorate --graph -20
git show ebfee6e9
git diff master...personal
```

Before experimenting with a risky repair, create a named branch from the working `personal` state:

```zsh
git switch personal
git switch -c backup/personal-before-repair
git switch personal
```

Prefer a new corrective commit or `git revert <commit>` for shared history. Avoid destructive resets when the branch contains work that has not been independently backed up.

## Setting up the fork again on another machine

```zsh
mkdir -p "$HOME/Developer"
cd "$HOME/Developer"
git clone git@github.com:SamuelDovgin/haruneko.git
cd haruneko
git remote add upstream https://github.com/manga-download/haruneko.git
git fetch --all --prune
git switch personal
npm install
npm run check
npm run test
npm --workspace=web run build
npm --workspace=app/electron run build
```

The custom macOS launcher and its support scripts are local machine files, not currently part of this repository. They must be copied or recreated separately when moving to a new Mac. After recreating the launcher, confirm it points to `$HOME/Developer/haruneko/web/build`, then ad-hoc sign and verify the app bundle.

## Guidelines for future custom work

- Start from `personal`, not `master`.
- Keep each connector or UI change in a focused commit.
- Add or update tests when connector behavior changes.
- Preserve unrelated upstream changes while resolving conflicts.
- Run checks, tests, and both builds before pushing.
- Perform one live paste/load test for a repaired connector after automated validation.
- Keep site-specific selectors and URL patterns narrowly scoped.
- Document non-obvious dependency pins with the exact failure they prevent.
- Update this guide whenever the branch model, launcher path, custom connectors, or maintenance workflow changes.
