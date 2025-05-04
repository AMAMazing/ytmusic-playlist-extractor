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