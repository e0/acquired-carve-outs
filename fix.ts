import fs from "fs";

const file = fs.readFileSync("public/carve-outs.json", "utf8");
let episodes = JSON.parse(file);
let i = episodes.findIndex(
  (episode) => episode.title === "Special: 2016 Review and 2017 Predictions",
);

episodes[i].carveOuts = [
  {
    name: "[Book] On Writing Well",
    link: "https://www.amazon.com/Writing-Well-30th-Anniversary-Nonfiction-ebook/dp/B0090RVGW0/ref=mt_kindle?_encoding=UTF8&me=",
    carver: "Ben",
  },
  {
    name: "[Book] The Creative Habit",
    link: "https://www.amazon.com/Creative-Habit-Learn-Use-Life/dp/0743235274/ref=sr_1_1?ie=UTF8&qid=1483120593&sr=8-1&keywords=the+creative+habit",
    carver: "David",
  },
  {
    name: "[Book] The Asimov Robot/Empire/Foundation series",
    link: "http://scifi.stackexchange.com/questions/2335/what-order-should-asimovs-foundation-series-be-read-in",
    carver: "David",
  },
  {
    name: "[Article] Wait But Why: Religion for the Nonreligious",
    link: "http://waitbutwhy.com/2014/10/religion-for-the-nonreligious.html",
    carver: "Ben",
  },
  {
    name: "[Article] The New York Times: The Perfect Weapon: How Russian Cyberpower Invaded the U.S.",
    link: "http://www.nytimes.com/2016/12/13/us/politics/russia-hack-election-dnc.html?_r=3",
    carver: "David",
  },
  {
    name: "[Podcast] The Ezra Klein Show",
    link: "https://itunes.apple.com/us/podcast/the-ezra-klein-show/id1081584611?mt=2",
    carver: "Both",
  },
  {
    name: "[Music] Justin Bieber",
    link: "https://en.wikipedia.org/wiki/Justin_Bieber",
    carver: "Ben",
  },
  {
    name: "[Music] Stevie Nicks",
    link: "https://en.wikipedia.org/wiki/Stevie_Nicks",
    carver: "David",
  },
  {
    name: "[TV/Movies] Westworld",
    link: "http://www.imdb.com/title/tt0475784/",
    carver: "Ben",
  },
  {
    name: "[TV/Movies] Rogue One",
    link: "http://www.imdb.com/title/tt3748528/",
    carver: "David",
  },
  {
    name: "[Apps] ReachNow",
    link: "http://reachnow.com/",
    carver: "Ben",
  },
  {
    name: "[Apps] Amazon Music",
    link: "https://www.amazon.com/gp/feature.html?docId=1001316131",
    carver: "David",
  },
];

fs.writeFileSync("public/carve-outs.json", JSON.stringify(episodes, null, 2));
