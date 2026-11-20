# Prajakta Panda – portfolio

A single-page portfolio for GitHub Pages. No build step: plain HTML and CSS.

## Live site

https://prajakta-05.github.io/portfolio/

To switch Pages on: repository **Settings → Pages**, Source "Deploy from a branch", branch `main`, folder `/ (root)`, Save.

Note: search engines only read `robots.txt` at a domain's root. For full SEO, rename this repository to `Prajakta-05.github.io` (the site then lives at `https://prajakta-05.github.io/`) and replace `https://prajakta-05.github.io/portfolio/` with that address in `index.html`, `robots.txt`, `sitemap.xml` and `llms.txt`.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The site, with Person, ScholarlyArticle and FAQPage structured data (JSON-LD) |
| `llms.txt` | Plain-text profile for AI assistants and agents |
| `robots.txt` | Allows search engines and AI crawlers, points to the sitemap |
| `sitemap.xml` | Tells search engines which pages exist |
| `assets/prajakta-panda.jpg` | Profile photo |
| `assets/og-image.png` | Preview image shown when the link is shared |

## After it's live

1. Add the site to **Google Search Console** (verify with the HTML-tag method), then submit `sitemap.xml`.
2. Do the same in **Bing Webmaster Tools** (it can import from Google Search Console).
3. Add the site URL to your LinkedIn profile (Contact info → Website) so both link to each other.
4. Create a **Google Scholar** profile and an **ORCID iD**, then add both URLs to the `sameAs` list in `index.html`. These are the strongest signals for a knowledge panel.

## Updating

Edit the text in `index.html` directly on GitHub (pencil icon), commit, and the site updates. When you add a publication, also add it to the JSON-LD block at the top of `index.html` and to `llms.txt`, and change `lastmod` in `sitemap.xml`.
