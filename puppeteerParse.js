import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import * as fs from "fs";

puppeteer.use(StealthPlugin());

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
      uniqueTexts.add(zone.text);
    }
    if (zone.children.length) {
      zone.children.forEach((child) => {
        if (child.text.length) {
          uniqueTexts.add(child.text);
        }
      });
    }
  });

  uniqueTexts.forEach((value) => {
    text += `${value}\n`;
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
  const browser = await puppeteer.launch({
    defaultViewport: false,
    args: ["--window-size=425,700"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 425, height: 700 });
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  );
  await page.goto(url, { timeout: 0, waitUntil: "domcontentloaded" });

  const bodyZone = await page.evaluate(() => {
    const tagsToRemove = [
      "script",
      "svg",
      "button",
      "style",
      "iframe",
      "noscript",
      "head",
      "nav",
      "footer",
      "header",
      "figure",
      "form",
      "video",
      "canvas",
      "figcaption",
      "aside",
      "recommend",
      "articles",
      "banner",
      "menu",
    ];
    tagsToRemove.forEach((tag) => {
      const elements = document.querySelectorAll(tag);
      elements.forEach((element) => element.remove());
    });

    function cleanText(text) {
      return text.replace(/\s+/g, " ").trim();
    }

    function getRect(element) {
      if (!element) {
        throw new Error("Element is null or undefined");
      }

      const rect = element.getBoundingClientRect();

      return {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        right: rect.left + rect.width,
        bottom: rect.top + rect.height,
      };
    }

    function isBlockElement(tagName) {
      const blockElements = [
        "address",
        "article",
        "aside",
        "blockquote",
        "dd",
        "div",
        "dl",
        "dt",
        "fieldset",
        "figure",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "header",
        "li",
        "main",
        "ol",
        "output",
        "p",
        "pre",
        "section",
        "table",
        "tfoot",
        "ul",
        "audio",
      ];

      return blockElements.includes(tagName);
    }

    function generateZoneTree(element) {
      const zones = [];

      Array.from(element.children).forEach((child) => {
        let isRemoved = false;

        const removedClassNames = [
          "_widget",
          "faq",
          "footer",
          "uplp-list",
          "navbar",
          "hidden",
          "header",
          "sidebar",
          "related",
          "want-to-know",
          "sponsor",
          "brief",
          "social",
          "tags",
          "self-stretch",
          "slider",
          "join",
          "aside",
          "post-blocks",
          "author",
        ];
        removedClassNames.forEach((substring) => {
          const className = child.className.baseVal || child.className;
          if (
            typeof className === "string" &&
            className.includes(substring) &&
            !child.tagName.toLowerCase().includes("h")
          ) {
            isRemoved = true;
          }
        });

        if (isRemoved) {
          return;
        }

        const display = getComputedStyle(child).display;
        const tagName = child.tagName.toLowerCase();
        const textContent = cleanText(child.textContent);

        const isBlock =
          display === "block" || (display === "" && isBlockElement(tagName));
        const isInline =
          display === "inline" || (display === "" && !isBlockElement(tagName));
        const emptyTagNames = ["div", "article", "section", "main"];
        if (isBlock && textContent) {
          const rect = getRect(child);
          if (rect.height > 0) {
            zones.push({
              type: "block",
              tag: tagName,
              text: emptyTagNames.includes(tagName) ? "" : textContent,
              rect: rect,
              children:
                tagName === "p" || tagName === "li"
                  ? []
                  : generateZoneTree(child),
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
  const text = createTextFromColumn(mainColumn);
  // fs.writeFileSync("./html.txt", JSON.stringify(columns, null, 2));
  fs.writeFileSync("./html.txt", text);
  await browser.close();
}

fetchPageData(
  "https://www.nerdwallet.com/article/investing/best-bitcoin-cryptocurrency-wallet/"
);
