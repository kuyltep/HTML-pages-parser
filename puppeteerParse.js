import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import * as fs from "fs";
import removeElementsByClassName from "./modules/removeElementsByClassName";

puppeteer.use(StealthPlugin());

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
        let isRemoved = removeElementsByClassName(child);

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
  await browser.close();
  console.log(JSON.stringify(text, null, 2));
  return JSON.stringify(text, null, 2);
}

fetchPageData(
  "https://cryptocloud.plus/en/blog/the-best-cryptocurrency-wallets"
);
