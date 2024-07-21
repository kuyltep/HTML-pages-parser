import { fetchPageData } from "./fetchPageData.js";
import { generateZoneTree } from "./generateZoneTree.js";
import { generateColumnTree } from "./generateColumnTree.js";
import { JSDOM } from "jsdom";
import jquery from "jquery";
import * as fs from "fs";

async function main() {
  const url =
    "https://dailyhodl.com/2024/07/20/solana-based-altcoin-thats-exploded-over-7200-year-to-date-flashing-bullish-signal-according-to-top-trader/";
  try {
    const html = await fetchPageData(url);
    const { window } = new JSDOM(html);
    const $ = jquery(window);
    const zones = await generateZoneTree($);
    // const columns = await generateColumnTree(zones, $);
    console.log(zones);
  } catch (error) {
    console.error(error);
  }
}

main();
