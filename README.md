# Uncovered Legacy — Modern Premium Concept

Open `index.html` with VS Code Live Server.

## Important: Southern background
The hero is already wired to use:

`images/southern-background.jpg`

If that exact photo is not present, the site falls back to the included `southern-background.svg` so the layout still works.

To use Curtis's preferred Southern/Lowcountry photo:
1. Save the approved image as `southern-background.jpg`
2. Put it inside the `images` folder
3. Refresh Live Server

No CSS changes are required.

## Current assets
- Curtis Burke supplied profile image
- Uncovered Legacy podcast artwork
- Modern responsive homepage
- Season links and current homepage content structure
- Existing Uncovered Legacy links preserved

## Podcast publishing

The premium frontend owns the public Home, Episodes, About, Reviews, and Contact experience. It includes the complete six-season archive, local artwork, show notes, and direct RSS audio playback. Public navigation does not depend on the old Podpage website.

Podpage remains available only as Curtis's private publishing dashboard through the Host Login link. GitHub Actions checks the public podcast RSS feed every 15 minutes. When Podpage/podcast publishing changes the feed, the workflow updates `data/episodes.json`, commits it, and triggers the premium site's normal deployment automatically.

You can also run the sync manually; the script downloads the configured feed when no argument is supplied:

`ruby scripts/sync_podcast.rb`

For testing with a downloaded feed, pass its path:

`ruby scripts/sync_podcast.rb /path/to/podcast-rss.xml`
