import fs from "fs";
import {
  Episode,
  getCareveoutsForPage,
  getEpisodeUrls,
  createBrowserWithPages,
  processUrlsInParallel
} from "./utils";

// Configuration
const CONCURRENT_PAGES = 5; // Number of browser pages to use in parallel
const EPISODES_PAGE_URL = "https://www.acquired.fm/episodes";
const CARVE_OUTS_FILE = "public/carve-outs.json";

// Main function to update carve-outs
const updateCarveOuts = async () => {
  console.log("Starting update process...");

  // Load existing episodes
  const file = fs.readFileSync(CARVE_OUTS_FILE, "utf8");
  let episodes: Episode[] = JSON.parse(file);

  // Create browser with multiple pages for parallel processing
  const { browser, pages } = await createBrowserWithPages(CONCURRENT_PAGES);

  try {
    // Find the most recent episode we have
    let mostRecentEpisode = null;
    if (episodes.length > 0) {
      // Sort episodes by date (newest first)
      const sortedEpisodes = [...episodes].sort((a, b) => {
        // Convert date strings to Date objects for comparison
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });

      mostRecentEpisode = sortedEpisodes[0];
      console.log(`Most recent episode in database: "${mostRecentEpisode.title}" (${mostRecentEpisode.date})`);
    }

    // Get latest episode URLs from the website (first page only)
    console.log("Fetching latest episodes from website...");
    const latestEpisodeUrls = await getEpisodeUrls(pages[0], EPISODES_PAGE_URL);

    if (latestEpisodeUrls.length === 0) {
      console.log("No episodes found on website.");
      return episodes;
    }

    // If we don't have any episodes yet, process all of them
    if (!mostRecentEpisode) {
      console.log("No existing episodes found. Processing all episodes.");
      const newEpisodeUrls = latestEpisodeUrls;

      if (newEpisodeUrls.length === 0) {
        console.log("No new episodes found.");
        return episodes;
      }
    } else {
      // Process the first episode to check its date
      console.log("Checking most recent episode from website...");
      const latestWebEpisode = await getCareveoutsForPage(pages[0], latestEpisodeUrls[0]);

      // Compare dates to see if we need to update
      const latestWebDate = new Date(latestWebEpisode.date);
      const mostRecentDate = new Date(mostRecentEpisode.date);

      if (latestWebDate <= mostRecentDate) {
        console.log("Database is already up to date. No new episodes to process.");
        return episodes;
      }
    }

    // Get existing episode URLs for filtering
    const existingUrls = new Set(episodes.map(episode => episode.url).filter(Boolean));

    // Find new episodes that aren't in our database yet
    const newEpisodeUrls = latestEpisodeUrls.filter(url => !existingUrls.has(url));

    if (newEpisodeUrls.length === 0) {
      console.log("No new episodes found.");
      return episodes;
    }

    console.log(`Found ${newEpisodeUrls.length} new episodes. Processing...`);

    // Process new episodes in parallel
    const processEpisode = async (page, url) => {
      console.log(`Processing episode: ${url}`);
      const episode = await getCareveoutsForPage(page, url);
      return episode;
    };

    const newEpisodes = await processUrlsInParallel(
      newEpisodeUrls,
      pages,
      processEpisode
    );

    // Filter out episodes with no carve-outs and add the rest to our database
    const validNewEpisodes = newEpisodes.filter(episode => {
      if (episode.carveOuts.length === 0) {
        console.log(`No carveouts found for episode: ${episode.title}`);
        return false;
      }
      return true;
    });

    console.log(`Adding ${validNewEpisodes.length} new episodes with carve-outs.`);
    episodes = [...episodes, ...validNewEpisodes];

    return episodes;
  } finally {
    // Always close the browser
    await browser.close();
  }
};

// Run the update process
const main = async () => {
  try {
    const updatedEpisodes = await updateCarveOuts();

    // Write updated episodes to file
    fs.writeFileSync(CARVE_OUTS_FILE, JSON.stringify(updatedEpisodes, null, 2));
    console.log("Update completed successfully!");
  } catch (error) {
    console.error("Error updating carve-outs:", error);
    process.exit(1);
  }
};

// Execute the main function
await main();
