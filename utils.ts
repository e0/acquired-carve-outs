import puppeteer from "puppeteer";
import { Browser, Page } from "puppeteer";

export type CarveOut = {
  name: string;
  link: string;
  carver?: string;
};

export type Episode = {
  title: string;
  episode: string;
  date: string;
  carveOuts: CarveOut[];
  url?: string;
};

/**
 * Extracts carve-outs data from a podcast episode page
 */
export const getCareveoutsForPage = async (page: Page, url: string): Promise<Episode> => {
  await page.goto(url);

  const title = await page.$eval("h1", (el) => el.textContent);
  const episode = await page.$eval(
    ".section-heading .heading-4",
    (el) => el.textContent,
  );
  const date = await page.$eval(
    ".section-heading .blog-date",
    (el) => el.textContent,
  );

  const carveOuts = await page.evaluate(() => {
    const items = [];
    document.querySelectorAll("strong").forEach((strong) => {
      if (strong.textContent.toLowerCase().includes("carve")) {
        let nextElement = strong.parentElement.nextElementSibling;
        if (nextElement && nextElement.tagName === "UL") {
          nextElement.querySelectorAll("li").forEach((li) => {
            const textParts = li.innerText
              .split(":")
              .map((part) => part.trim());
            const linkElement = li.querySelector("a");

            const name = textParts.length > 1 ? textParts[1] : textParts[0];

            const item = {
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
    });
    return items;
  });

  return { title, episode, date, carveOuts, url };
};

/**
 * Gets all episode URLs from a page
 */
export const getEpisodeUrls = async (page: Page, url: string): Promise<string[]> => {
  await page.goto(url);

  const urls = await page.evaluate(() => {
    const items = [];
    document.querySelectorAll(".collection-list > *").forEach((el) => {
      const url = el.querySelector("a").href;
      items.push(url);
    });
    return items.reverse();
  });

  return urls;
};

/**
 * Creates a new browser instance with multiple pages
 */
export const createBrowserWithPages = async (pageCount: number = 5): Promise<{
  browser: Browser;
  pages: Page[];
}> => {
  const browser = await puppeteer.launch({ 
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: "new"
  });
  
  const pages: Page[] = [];
  for (let i = 0; i < pageCount; i++) {
    pages.push(await browser.newPage());
  }
  
  return { browser, pages };
};

/**
 * Process multiple URLs in parallel using a pool of browser pages
 */
export const processUrlsInParallel = async <T>(
  urls: string[],
  pages: Page[],
  processor: (page: Page, url: string) => Promise<T>,
  batchSize: number = pages.length
): Promise<T[]> => {
  const results: T[] = [];
  
  // Process URLs in batches
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchPromises = batch.map((url, index) => {
      const page = pages[index % pages.length];
      return processor(page, url);
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
};
