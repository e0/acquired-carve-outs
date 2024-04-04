import puppeteer from "puppeteer";
import fs from "fs";

const browser = await puppeteer.launch();
const page = await browser.newPage();

const getCareveoutsForPage = async (url: string) => {
  await page.goto(url);

  const titleH1 = await page.$eval("h1", (el) => el.textContent);

  const carveOuts = await page.evaluate(() => {
    const items = [];
    // Find all <strong> tags, then find the next sibling <ul> for each and extract its <li> elements
    document.querySelectorAll("strong").forEach((strong) => {
      if (strong.textContent.toLowerCase().includes("carve")) {
        // Assuming the <ul> is directly following the <p> that contains the <strong> tag
        let nextElement = strong.parentElement.nextElementSibling;
        // Ensure the next element is a <ul> before proceeding
        if (nextElement && nextElement.tagName === "UL") {
          nextElement.querySelectorAll("li").forEach((li) => {
            // Extract name and link
            const textParts = li.innerText
              .split(":")
              .map((part) => part.trim());
            const linkElement = li.querySelector("a");
            const item = {
              name: textParts[0],
              item: textParts[1],
              link: linkElement ? linkElement.href : null,
            };
            items.push(item);
          });
        }
      }
    });
    return items;
  });

  return { title: titleH1, carveOuts };
};

const episodes = [];

let currentPage = 18;

while (currentPage > 0) {
  const episodesPageUrl = `https://www.acquired.fm/episodes?85af0199_page=${currentPage}`;

  const getEpisodeUrls = async (url: string) => {
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

  // for each episode, get the carveouts
  const episodeUrls = await getEpisodeUrls(episodesPageUrl);
  for (const url of episodeUrls) {
    console.log(`Getting carveouts for episode ${url}`);
    const carveOuts = await getCareveoutsForPage(url);
    if (carveOuts.carveOuts.length === 0) {
      console.log(`No carveouts found for episode ${url}`);
    } else {
      episodes.push(carveOuts);
    }
  }

  currentPage -= 1;
}

// write to careve-outs.json
fs.writeFileSync("carve-outs.json", JSON.stringify(episodes, null, 2));

await browser.close();

