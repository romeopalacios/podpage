# Uncovered Legacy — Premium Production Build

This is a static multi-page redesign for Uncovered Legacy.

## Included
- Home, About, Episodes, Reviews, Contact, and individual episode views
- Curtis Burke photo supplied for this project
- About copy supplied for this project, preserved verbatim
- Nine listener reviews from the current site
- Six-season archive with official Apple Podcasts episode titles, dates, descriptions, artwork, and listening URLs loaded at runtime
- Local individual episode pages (`episode.html?id=...`)
- Responsive navigation, search, season filters, and mobile layout

## Important deployment behavior
The episode archive uses Apple's public JSONP lookup endpoint. An internet connection is required for episode cards and individual episode pages. This avoids stale duplicated episode metadata and keeps artwork and links aligned with Apple Podcasts.

The newsletter and contact buttons point to the podcast's official working Podpage routes because their server-side form handling and spam protection cannot be reproduced in static HTML without credentials.

## Preview
Open the folder in VS Code and use Live Server on `index.html`.

## Deployment
The folder can be hosted on GitHub Pages, Netlify, Cloudflare Pages, or another static host. Keep the directory structure intact.
