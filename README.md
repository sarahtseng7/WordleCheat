# Word Guess Helper — Web Version

A plain HTML/CSS/JavaScript port of the Java Swing app. No build step,
no npm, no framework — just static files, so it can be published
anywhere that serves static files.

## Why not React?

React needs a build step (or an in-browser compiler, which is slow and
not production-appropriate) before it's just files a static host can
serve. Since the whole point here is "easily publishable," plain HTML/
CSS/JS gets you there with zero tooling — drag the folder onto a host
and it works. If you later want to bring this into a React app (e.g.
to combine it with other pages), the logic in `wordFilter.js` and
`imageCrop.js` has no DOM/React dependencies and can be dropped
into React components largely as-is; only `app.js` (the direct DOM
manipulation) would need rewriting as JSX.

## File structure

```
index.html              - page shell
styles.css           - all styling (pale blue background, pale
                            green rounded panel, Wordle-style box colors)
wordFilter.js         - word-filtering algorithm (port of
                            WordFilterEngine.java)
imageCrop.js          - crops an image to a centered slice via
                            <canvas>, with graceful fallback if the
                            image is missing (port of the Java
                            loadMiddleSlice()/getSubimage() logic)
app.js                - builds the menu/game screens, wires up
                            clicks, re-filters on demand
wordle-words.js     - the 5-letter word list (from wordle.csv),
                            embedded as a JS array so the page works
                            even opened directly as a local file
jeff-words.js       - the 12-letter word list (from jeff.csv),
                            same treatment
images/                  - OPTIONAL. See below.
```

## Optional images

Exactly like the desktop app, every title/button image is optional —
if a file is missing, the UI falls back to a plain text button/title
automatically. If you want the images from your desktop version, drop
them into an `images/` folder next to `index.html`, using these exact
names:

```
images/title.gif          - main menu title (shown uncropped)
images/wordle.gif         - Wordle button on the main menu (cropped to middle 1/3 width)
images/jeff.gif           - Jeff Goldblum button on the main menu (cropped to middle 1/3 width)
images/wordle_title.png   - Wordle game-screen title (cropped to middle 2/3 width, 1/2 height)
images/jeff_title.png     - Jeff Goldblum game-screen title (cropped to full width, middle 1/2 height)
images/back.png           - Back button (cropped to middle 1/6 width, 1/2 height)
images/update.png         - Update Results button (same crop)
images/reset.png          - Reset All Boxes button (same crop)
```

The crop fractions match whatever was last set in the Java version.
If you change them there, update the matching fraction arguments in
`app.js` (look for `cropImage(...)` / `wFrac`, `hFrac` values).

## Running locally

No server required for the current setup, since the word lists are
embedded as JS (not fetched) — just double-click `index.html`, or
open it in a browser directly.

If you prefer running through a local server (recommended once you
add images, since some browsers restrict `file://` access oddly for
other assets):

```
# from this folder
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploying

Any static host works, since there's no backend and no build step:

- **GitHub Pages**: push this folder to a repo, enable Pages on the
  `main` branch (or a `gh-pages` branch), done.
- **Vercel**: import the repository or deploy this folder with the Vercel CLI.
  Select the **Other** framework preset, leave the build command blank,
  and set the output directory to `.`. The root directory must be the
  folder containing `index.html`. Commit and push the fixes to trigger
  a new deployment when using a connected repository.
- **Netlify**: upload the folder or connect the repository; no build
  command is needed, and the publish directory is this folder.
- **Any other static host** (S3 + CloudFront, Cloudflare Pages,
  Surge, etc.): upload these files as-is.

## Notes / known differences from the Java version

- Browsers don't display animated GIFs on a `<canvas>` the same way
  Java's `ImageIO` doesn't either — both will show only the first
  frame once cropped. Static `.png` art will look identical either
  way.
- The "Possible words" list caps at showing the first 500 matches
  (same cap the Java version used) to keep the DOM light for very
  broad queries (e.g. before any letters are marked).
