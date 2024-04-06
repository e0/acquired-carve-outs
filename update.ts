import puppeteer from "puppeteer";
import fs from "fs";

const file = fs.readFileSync("public/carve-outs.json", "utf8");
let episodes = JSON.parse(file);

const browser = await puppeteer.launch();
const page = await browser.newPage();

const getCareveoutsForPage = async (url: string) => {
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

const episodesPageUrl = `https://www.acquired.fm/episodes`;
const allEpisodeUrls = episodes.map((episode) => episode.url);
const episodeUrls = await getEpisodeUrls(episodesPageUrl);
const newEpisodeUrls = episodeUrls.filter(
  (url) => !allEpisodeUrls.includes(url),
);

// for each new episode, get the carveouts
for (const url of newEpisodeUrls) {
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
