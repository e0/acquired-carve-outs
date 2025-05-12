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
const MAX_PAGES = 18; // Total number of pages to scrape
const CARVE_OUTS_FILE = "public/carve-outs.json";

// Main function to seed the database with all episodes
const seedCarveOuts = async () => {
  console.log("Starting seed process...");

  // Create browser with multiple pages for parallel processing
  const { browser, pages } = await createBrowserWithPages(CONCURRENT_PAGES);

  try {
    const allEpisodes: Episode[] = [];

    // Process each page of episodes
    for (let currentPage = MAX_PAGES; currentPage > 0; currentPage--) {
      const episodesPageUrl = `https://www.acquired.fm/episodes?85af0199_page=${currentPage}`;
      console.log(`Processing page ${currentPage} of ${MAX_PAGES}...`);

      // Get episode URLs from the current page
      const episodeUrls = await getEpisodeUrls(pages[0], episodesPageUrl);

      if (episodeUrls.length === 0) {
        console.log(`No episodes found on page ${currentPage}. Skipping.`);
        continue;
      }

      console.log(`Found ${episodeUrls.length} episodes on page ${currentPage}. Processing...`);

      // Process episodes in parallel
      const processEpisode = async (page, url) => {
        console.log(`Processing episode: ${url}`);
        const episode = await getCareveoutsForPage(page, url);
        return episode;
      };

      const pageEpisodes = await processUrlsInParallel(
        episodeUrls,
        pages,
        processEpisode
      );

      // Filter out episodes with no carve-outs
      const validEpisodes = pageEpisodes.filter(episode => {
        if (episode.carveOuts.length === 0) {
          console.log(`No carveouts found for episode: ${episode.title}`);
          return false;
        }
        return true;
      });

      console.log(`Adding ${validEpisodes.length} episodes with carve-outs from page ${currentPage}.`);
      allEpisodes.push(...validEpisodes);
    }

    return allEpisodes;
  } finally {
    // Always close the browser
    await browser.close();
  }
};

// Run the seed process
const main = async () => {
  try {
    const episodes = await seedCarveOuts();

    // Write episodes to file
    fs.writeFileSync(CARVE_OUTS_FILE, JSON.stringify(episodes, null, 2));
    console.log(`Seed completed successfully! Saved ${episodes.length} episodes.`);
  } catch (error) {
    console.error("Error seeding carve-outs:", error);
    process.exit(1);
  }
};

// Execute the main function
await main();
