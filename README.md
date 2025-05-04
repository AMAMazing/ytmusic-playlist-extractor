# YouTube Music Playlist Extractor

A simple JavaScript snippet to run in your browser's developer console to extract the list of song titles and artist names from the currently visible YouTube Music playlist page.

## Description

This script scrapes the currently loaded HTML of a YouTube Music playlist page to find the elements containing song titles and artist names. It then outputs a formatted list directly into the developer console.

**Disclaimer:** This script relies on the specific HTML structure and CSS class names used by YouTube Music. **Google frequently updates YouTube Music's design, which will likely break this script without warning.** 

## How to Use

1.  Navigate to the YouTube Music playlist page you want to extract in your web browser.
2.  **IMPORTANT:** Scroll down the playlist page **until all the songs you want to capture have loaded and are visible** on the screen. The script can only see what's currently rendered in the HTML.
3.  Open your browser's Developer Console:
    *   Press `F12`.
    *   Or, right-click on the page, select "Inspect" or "Inspect Element", and navigate to the "Console" tab.
4.  Copy the entire JavaScript code from the [`extract-playlist.js`](./extract-playlist.js) file in this repository.
5.  Paste the copied code into the console prompt (usually starts with `>`).
6.  Press `Enter`.
7.  The script will output the list of "Song Title - Artist Name" into the console. You can copy this text directly from the console output.

## Limitations

*   **Requires Manual Scrolling:** You must scroll to load all desired tracks first.
*   **Fragile:** Will break when YouTube Music updates its website layout. Requires manual updating of selectors in the script (`trackSelector`, `titleSelector`, `artistLinkSelector`, `directArtistTextSelector`, etc.).
*   **Accuracy:** May occasionally misidentify artists or titles for unusual track types (e.g., non-music videos, podcasts, complex collaborations, auto-generated channels) or if artist/album names contain special characters like '•'. Check the console output for warnings about tracks where the artist couldn't be reliably determined.
*   **Client-Side Only:** Runs only in your browser, doesn't interact with any APIs or save files automatically.

## Full Code

```js
(function() {
  // Selector for each song row
  const trackSelector = 'ytmusic-responsive-list-item-renderer';
  // Selector for the song title
  const titleSelector = '.title .yt-formatted-string';

  // --- ARTIST SELECTORS ---
  // 1. Primary: Links within the secondary column (for artists like "Tyla" in your first example)
  const artistLinkSelector = '.secondary-flex-columns a.yt-simple-endpoint';
  // 2. Fallback: The *first* yt-formatted-string directly under the secondary column
  //    (for artists like "MK & Dom Dolla" in your second example, or structure like "Artist • Album")
  const directArtistTextSelector = '.secondary-flex-columns > yt-formatted-string:nth-child(1)';
  // --- END ARTIST SELECTORS ---

  // Get all song row elements
  const trackElements = document.querySelectorAll(trackSelector);

  if (trackElements.length === 0) {
    console.log("No song elements found. Ensure the playlist is loaded, you've scrolled down, and you're on the correct page. Selectors might be outdated if YT Music updated its layout.");
    return;
  }

  const songList = [];
  const failedTracks = []; // Keep track of tracks where artist extraction might have failed

  trackElements.forEach((track, index) => {
    const titleElement = track.querySelector(titleSelector);
    const title = titleElement ? titleElement.textContent.trim() : `Unknown Title ${index + 1}`;

    let artist = null; // Start with null

    // --- Attempt 1: Find linked artists ---
    const artistLinks = track.querySelectorAll(artistLinkSelector);
    let foundLinks = false;
    if (artistLinks.length > 0) {
      const artistNames = Array.from(artistLinks)
                              .map(link => link.textContent.trim())
                              .filter(name => name); // Filter out empty strings
      if (artistNames.length > 0) {
          artist = artistNames.join(', ');
          foundLinks = true;
      }
    }

    // --- Attempt 2: If no links found, find direct text artist ---
    if (!foundLinks) {
      const directArtistElement = track.querySelector(directArtistTextSelector);
      if (directArtistElement) {
        const potentialArtistText = directArtistElement.textContent.trim();
        if (potentialArtistText) {
          // Often the structure is "Artist • Album • Year" or just "Artist"
          // Split by '•' and take the first part as the most likely artist name.
          artist = potentialArtistText.split('•')[0].trim();

          // Basic sanity check: if the result is just the title or looks like a year, it's probably not the artist.
          if (artist === title || /^\d{4}$/.test(artist)) {
             failedTracks.push({ index: index + 1, title: title, reason: `Direct text fallback matched title or year ('${artist}')` });
             artist = null; // Reset artist so it falls through to unknown
          } else if (potentialArtistText.includes("auto-generated")) {
             failedTracks.push({ index: index + 1, title: title, reason: "Direct text indicates auto-generated topic channel." });
             artist = null; // Often these aren't clearly attributed
          }
        }
      }
    }

    // --- Final Fallback ---
    if (!artist || artist.length === 0) {
        artist = `Unknown Artist ${index + 1}`;
        // Avoid double logging if already added to failedTracks
        if (!failedTracks.some(f => f.index === index + 1)) {
            failedTracks.push({ index: index + 1, title: title, reason: "Could not find artist via links or direct text." });
        }
    }

    songList.push(`${title} - ${artist}`);
  });

  // --- Output ---
  console.log("--- Playlist Songs ---");
  console.log(songList.join('\n'));
  console.log(`\n--- Found ${songList.length} songs ---`);

  if (failedTracks.length > 0) {
      console.warn(`\n--- Could not reliably determine artist for ${failedTracks.length} tracks: ---`);
      failedTracks.forEach(fail => {
          console.warn(`  Track ${fail.index}: "${fail.title}" (Reason: ${fail.reason})`);
      });
      console.warn("This might happen for non-music videos, topic channels, specific collaborations, or layout variations.");
  }

  // Optional: Output as a table
  /*
  console.log("\n--- Playlist Table ---");
  console.table(songList.map((line, idx) => {
      const parts = line.split(' - ');
      const songTitle = parts[0];
      const artistName = parts.slice(1).join(' - '); // Handle artists with ' - ' in their name
      return { Index: idx + 1, Title: songTitle, Artist: artistName };
  }));
  */

})();
```

## License

MIT License
