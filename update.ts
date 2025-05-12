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
    // Get existing episode URLs
    const existingUrls = new Set(episodes.map(episode => episode.url).filter(Boolean));

    // Get latest episode URLs from the website
    const latestEpisodeUrls = await getEpisodeUrls(pages[0], EPISODES_PAGE_URL);

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
