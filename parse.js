import axios from "axios";
import * as cheerio from "cheerio";
import jquery from "jquery";
import { JSDOM } from "jsdom";
import * as fs from "fs";

class Zone {
  constructor(type, text = "", left, right, children = []) {
    this.type = type;
    this.text = text;
    this.children = children;
    this.left = left;
    this.right = right;
  }

  addChild(zone) {
    this.children.push(zone);
  }
}

const fetchPageData = async (url) => {
  const response = await axios.get(url);
  return response.data;
};

const isVisible = (element) => {
  const style = element.attr("style");
  const classList = element.attr("class")
    ? element.attr("class").split(" ")
    : [];
  if (style) {
    const displayNone = style.includes("display: none");
    const visibilityHidden = style.includes("visibility: hidden");
    if (displayNone || visibilityHidden) {
      return false;
    }
  }
  if (classList.length) {
    if (classList.includes("hidden")) {
      return false;
    }
  }
  return true;
};

const isBlockElement = (tag) => {
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
    "tr",
    "td",
  ];
  return blockElements.includes(tag);
};

const removeUselessTags = (cher) => {
  const uselessTags = [
    "script",
    "style",
    "meta",
    "footer",
    "nav",
    "link",
    "head",
    "header",
    "noscript",
  ];
  uselessTags.forEach((tag) => {
    cher(tag).remove();
  });
};

const buildZones = (cher, element) => {
  const visible = isVisible(element);
  if (!visible) {
    return null;
  }
  const { window } = new JSDOM(element.html());
  const $ = jquery(window);

  const tag = element[0].tagName;

  const elem = $(`${tag}`).get(0);
  if (elem) {
    const rect = elem.getBoundingClientRect();
    const width = rect.width;
    const leftOffset = rect.left;
  }

  const text = element.text().trim();
  const type = isBlockElement(tag) ? "block" : "inline";
  const zone = new Zone(type, text, left, right);

  element.children().each((i, child) => {
    const childElement = cher(child);
    const childZone = buildZones(cher, childElement);
    if (childZone) {
      zone.addChild(childZone);
    }
  });

  return zone;
};

const splitInlineZones = (zone) => {
  if (zone.type === "inline" && zone.text.includes("\n")) {
    const parts = zone.text
      .split("\n")
      .map((part) => part.trim())
      .filter((part) => part);
    return parts.map((part) => new Zone("inline", part, zone.left, zone.right));
  }

  zone.children = zone.children.flatMap((child) => splitInlineZones(child));
  return [zone];
};

function groupZonesIntoColumns(zones, tolerance) {
  const columns = [];

  zones.forEach((zone) => {
    let added = false;
    for (let column of columns) {
      if (
        Math.abs(zone.left - column.left) <= tolerance &&
        Math.abs(zone.right - column.right) <= tolerance
      ) {
        column.addChild(zone);
        added = true;
        break;
      }
    }
    if (!added) {
      columns.push(new Zone("column", "", zone.left, zone.right, [zone]));
    }
  });

  return columns;
}

function simplifyColumns(columns, tolerance) {
  columns.forEach((column) => {
    column.children = column.children.flatMap((child) => {
      if (
        Math.abs(column.left - child.left) <= tolerance &&
        Math.abs(column.right - child.right) <= tolerance
      ) {
        return child.children;
      }
      return [child];
    });
  });

  return columns;
}

async function createColumnsFromUrl(url) {
  const html = await fetchPageData(url);
  const cher = cheerio.load(html);
  removeUselessTags(cher);
  const body = cher("body");

  let zones = buildZones(cher, body);
  zones = splitInlineZones(zones);

  const tolerance = 0.1 * (zones[0].right - zones[0].left);
  let columns = groupZonesIntoColumns(zones, tolerance);
  columns = simplifyColumns(columns, tolerance);

  return columns;
}

(async () => {
  const url =
    "https://www.forbes.com/advisor/investing/cryptocurrency/best-crypto-wallets"; // Замените на нужный URL
  const columns = await createColumnsFromUrl(url);
  console.log(JSON.stringify(columns, null, 2));
})();
