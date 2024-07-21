import axios from "axios";
import cheerio from "cheerio";
import crypto from "crypto";
import { JSDOM } from "jsdom";
import jQuery from "jquery";
import * as fs from "fs";

async function fetchPageData(url) {
  const response = await axios.get(url);
  return response.data;
}

function cleanText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function isBlockElement(tagName) {
  const blockElements = [
    "div",
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "table",
    "section",
    "article",
    "aside",
  ];
  return blockElements.includes(tagName);
}

function removeUnwantedTags($) {
  const unwantedTags = [
    "script",
    "style",
    "meta",
    "link",
    "head",
    "title",
    "noscript",
    "img",
  ];
  unwantedTags.forEach((tag) => {
    $(tag).remove();
  });
}

function generateZoneTree($, element) {
  const zones = [];

  $(element)
    .children()
    .each((index, child) => {
      const display = $(child).css("display");
      const tagName = $(child).prop("tagName").toLowerCase();
      const textContent = cleanText($(child).text().trim());

      const isBlock =
        display === "block" || (display === "" && isBlockElement(tagName));
      const isInline =
        display === "inline" || (display === "" && !isBlockElement(tagName));

      if (isBlock && textContent) {
        const rect = $(child).length ? $(child).offset() : null;
        zones.push({
          type: "block",
          tag: tagName,
          text: tagName === "div" ? "" : textContent,
          rect: rect,
          children: generateZoneTree($, child),
        });
      } else if (isInline && textContent) {
        if (zones.length === 0 || zones[zones.length - 1].type !== "inline") {
          const rect = $(child).length ? $(child).offset() : null;
          zones.push({
            type: "inline",
            tag: tagName,
            text: textContent,
            rect: rect,
            children: [],
          });
        } else {
          zones[zones.length - 1].text += " " + textContent;
          zones[zones.length - 1].children.push(...generateZoneTree($, child));
        }
      }
    });
  return zones;
}

async function main() {
  const url =
    "https://dailyhodl.com/2024/07/20/one-low-cap-altcoin-on-the-verge-of-a-big-breakout-says-analyst-michael-van-de-poppe-here-are-his-targets/";
  try {
    const html = await fetchPageData(url);
    const dom = new JSDOM(html);
    const $ = jQuery(dom.window);

    removeUnwantedTags($);

    const bodyZone = {
      type: "block",
      tag: "body",
      text: "",
      rect: $("body").length ? $("body").offset() : null,
      children: generateZoneTree($, "body"),
    };
    // console.log(JSON.stringify(bodyZone, null, 2));
    fs.writeFileSync("./html.txt", JSON.stringify(bodyZone, null, 2));
  } catch (error) {
    console.error(error);
  }
}

main();
