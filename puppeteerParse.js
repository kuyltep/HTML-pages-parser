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
