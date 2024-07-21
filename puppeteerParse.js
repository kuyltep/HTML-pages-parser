import puppeteer from "puppeteer";
import * as fs from "fs";

function calculateColumnWeight(column) {
  if (column.zones.length === 0) {
    return column.text.split(" ").length;
  }

  let weight = 0;
  column.zones.forEach((zone) => {
    weight += calculateZoneWeight(zone);
  });

  return weight;
}

function calculateZoneWeight(zone) {
  if (zone.children.length === 0) {
    return zone.text.split(" ").length;
  }

  let weight = zone.text.split(" ").length;
  zone.children.forEach((child) => {
    weight += calculateZoneWeight(child);
  });
  return weight;
}

function findMainContentColumn(columns) {
  let maxWeight = 0;
  let mainColumn = null;

  columns.forEach((column) => {
    const weight = calculateColumnWeight(column);
    if (weight > maxWeight) {
      maxWeight = weight;
      mainColumn = column;
    }
  });

  return mainColumn;
}

function createTextFromColumn(column) {
  const uniqueTexts = new Set();
  let text = "";
  column.zones.forEach((zone) => {
    if (zone.text.length) {
      text += `${zone.text}\n`;
    }
    uniqueTexts.add(zone.text);
    if (zone.children.length) {
      zone.children.forEach((child) => {
        if (child.text.length) {
          uniqueTexts.add(child.text);
          text += `${child.text}\n`;
        }
      });
    }
  });
  return text;
}

function generateColumnTree(zones, tolerance = 0.1) {
  const columns = [];

  zones.forEach((zone) => {
    if (zone.type === "block") {
      const left = zone.rect.left;
      const right = zone.rect.right;
      const width = zone.rect.width;
      const toleranceValue = width * tolerance;

      let column = columns.find(
        (col) =>
          (Math.abs(col.rect.left - left) <= toleranceValue &&
            Math.abs(col.rect.right - right) <= toleranceValue) ||
          (Math.abs(col.rect.left - left) >= toleranceValue &&
            Math.abs(col.rect.right - right) >= toleranceValue)
      );

      if (!column) {
        column = {
          type: "column",
          rect: { left, right },
          zones: [],
        };
        columns.push(column);
      }

      column.zones.push(zone);

      if (zone.children && zone.children.length > 0) {
        const childColumns = generateColumnTree(zone.children, tolerance);
        childColumns.forEach((childColumn) => {
          let column = columns.find(
            (col) =>
              Math.abs(col.rect.left - childColumn.rect.left) <=
                toleranceValue &&
              Math.abs(col.rect.right - childColumn.rect.right) <=
                toleranceValue
          );

          if (!column) {
            column = {
              type: "column",
              rect: childColumn.rect,
              zones: [],
            };
            columns.push(column);
          }

          column.zones.push(...childColumn.zones);
        });
      }
    }
  });

  return columns;
}

async function fetchPageData(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url, { timeout: 0, waitUntil: "domcontentloaded" });

  const bodyZone = await page.evaluate(() => {
    const tagsToRemove = [
      "script",
      "style",
      "iframe",
      "noscript",
      "header",
      "head",
      "nav",
      "footer",
    ];
    tagsToRemove.forEach((tag) => {
      const elements = document.querySelectorAll(tag);
      elements.forEach((element) => element.remove());
    });

    function cleanText(text) {
      return text.replace(/\s+/g, " ").trim();
    }

    function getRect(element) {
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        right: rect.left + rect.width,
      };
    }

    function generateZoneTree(element) {
      const zones = [];

      Array.from(element.children).forEach((child) => {
        const display = getComputedStyle(child).display;
        const tagName = child.tagName.toLowerCase();
        const textContent = cleanText(child.textContent);

        const isBlock =
          display === "block" || (display === "" && isBlockElement(tagName));
        const isInline =
          display === "inline" || (display === "" && !isBlockElement(tagName));

        if (isBlock && textContent) {
          const rect = getRect(child);
          if (rect.height > 0) {
            zones.push({
              type: "block",
              tag: tagName,
              text: tagName === "div" ? "" : textContent,
              rect: rect,
              children: generateZoneTree(child),
            });
          }
        } else if (isInline && textContent) {
          if (zones.length === 0 || zones[zones.length - 1].type !== "inline") {
            const rect = getRect(child);
            zones.push({
              type: "inline",
              tag: tagName,
              text: textContent,
              rect: rect,
              children: [],
            });
          } else {
            zones[zones.length - 1].text += " " + textContent;
            zones[zones.length - 1].children.push(...generateZoneTree(child));
          }
        }
      });
      return zones;
    }

    return {
      type: "block",
      tag: "body",
      text: "",
      rect: getRect(document.body),
      children: generateZoneTree(document.body),
    };
  });

  const columns = generateColumnTree(bodyZone.children);
  const mainColumn = findMainContentColumn(columns);
  fs.writeFileSync("./html.txt", JSON.stringify(mainColumn, null, 2));
  // console.log(JSON.stringify(columns, null, 2));
  await browser.close();
}

fetchPageData(
  "https://dailyhodl.com/2024/07/20/one-low-cap-altcoin-on-the-verge-of-a-big-breakout-says-analyst-michael-van-de-poppe-here-are-his-targets/"
);
