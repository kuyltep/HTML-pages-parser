import { fetchPageData } from "./fetchPageData.js";
import { generateZoneTree } from "./generateZoneTree.js";

async function main() {
  const url =
    "https://dailyhodl.com/2024/07/20/solana-based-altcoin-thats-exploded-over-7200-year-to-date-flashing-bullish-signal-according-to-top-trader/";
  try {
    const html = await fetchPageData(url);
    const zones = await generateZoneTree(html);
    console.log(zones);
  } catch (error) {
    console.error(error);
  }
}

main();
