import puppeteer from "puppeteer";
import fs from "fs";

const browser = await puppeteer.launch();
const page = await browser.newPage();

const getCareveoutsForPage = async (url: string) => {
  await page.goto(url);

  const title = await page.$eval("h1", (el) => el.textContent?.trim());

  const metadata = await page.evaluate(() => {
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const data = JSON.parse(script.textContent || "");
        if (data["@type"] === "PodcastEpisode") {
          return {
            episodeNumber: data.episodeNumber,
            seasonNumber: data.partOfSeason?.seasonNumber,
            datePublished: data.datePublished,
          };
        }
      } catch {}
    }
    return null;
  });

  const episode = metadata
    ? `Season ${metadata.seasonNumber}, Episode ${metadata.episodeNumber}`
    : "";

  const date = metadata?.datePublished
    ? new Date(metadata.datePublished).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const carveOuts = await page.evaluate(() => {
    const items: { name: string; link: string | null; carver?: string }[] = [];
    const headings = document.querySelectorAll("strong, h1, h2, h3, h4, h5, h6");
    for (const heading of headings) {
      if (!heading.textContent?.toLowerCase().includes("carve")) continue;

      let searchFrom = heading.tagName === "STRONG" ? heading.parentElement : heading;
      let nextElement = searchFrom?.nextElementSibling;
      while (nextElement && nextElement.tagName !== "UL") {
        nextElement = nextElement.nextElementSibling;
      }

      if (nextElement && nextElement.tagName === "UL") {
        nextElement.querySelectorAll("li").forEach((li) => {
          const textParts = li.innerText.split(":").map((part) => part.trim());
          const linkElement = li.querySelector("a");

          const name = textParts.length > 1 ? textParts[1] : textParts[0];

          const item: { name: string; link: string | null; carver?: string } = {
            name,
            link: linkElement ? linkElement.href : null,
          };

          if (textParts.length > 1) {
            item.carver = textParts[0];
          }

          items.push(item);
        });
      }
    }
    return items;
  });

  return { title, episode, date, carveOuts, url };
};

// Phase 1: Collect all episode URLs from all pages
const allEpisodeUrls: string[] = [];
let currentUrl: string | null = "https://www.acquired.fm/episodes";

while (currentUrl) {
  console.log(`Fetching episode list from ${currentUrl}`);
  await page.goto(currentUrl);

  const { episodeUrls, nextPageUrl } = await page.evaluate(() => {
    const urls: string[] = [];
    document.querySelectorAll(".playlist-block-item").forEach((el) => {
      const link = el.querySelector("a[href]") as HTMLAnchorElement;
      if (link) {
        urls.push(link.href);
      }
    });

    let nextUrl: string | null = null;
    document.querySelectorAll("a").forEach((link) => {
      if (link.textContent?.trim().toLowerCase() === "next") {
        nextUrl = link.href;
      }
    });

    return { episodeUrls: urls, nextPageUrl: nextUrl };
  });

  allEpisodeUrls.push(...episodeUrls);
  currentUrl = nextPageUrl;
}

// Reverse to get oldest first
allEpisodeUrls.reverse();

// Phase 2: Get carve-outs for each episode
const episodes = [];

for (const url of allEpisodeUrls) {
  console.log(`Getting carveouts for episode ${url}`);
  const carveOuts = await getCareveoutsForPage(url);
  if (carveOuts.carveOuts.length === 0) {
    console.log(`No carveouts found for episode ${url}`);
  } else {
    episodes.push(carveOuts);
  }
}

// write to careve-outs.json
fs.writeFileSync("public/carve-outs.json", JSON.stringify(episodes, null, 2));

await browser.close();
