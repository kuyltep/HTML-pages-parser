import generateColumnTree from "./modules/generateColumnTree.mjs";
import findMainContentColumn from "./modules/findMainContentColumn.mjs";
import createTextFromColumn from "./modules/createTextFromColumn.mjs";
import { launchBrowser } from "./modules/browser.mjs";
import axios from "axios";

export async function fetchPageData(url) {
  try {
    const { browser, page } = await launchBrowser();
    await page.setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
    );
    await page.setExtraHTTPHeaders({
      referer: "www.google.com",
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "max-age=0",
      "accept-encoding": "gzip, deflate, br",
    });
    await page.goto(url, { timeout: 30000, waitUntil: "domcontentloaded" });

    const body = await page.$("body");
    const bodyZone = await body.evaluate(() => {
      function removeELementsByClassName(child) {
        let isRemoved = false;
        const removedClassNames = [
          "_widget",
          "widget_",
          "faq",
          "footer",
          "uplp-list",
          "nav",
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
          "sign",
          "aside",
          "post-blocks",
          "author",
          "advertisement",
          "related",
          "promo",
          "advertisement",
          "promo",
          "subscribe",
          "newsletter",
          "found",
          "btn",
          "button",
          "hot",
          "share",
          "modal",
        ];
        removedClassNames.forEach((substring) => {
          const className = child.className.baseVal || child.className;
          if (
            typeof className === "string" &&
            className.includes(substring) &&
            !child.tagName.toLowerCase().includes("h")
          ) {
            isRemoved = true;
            console.log(child.className);
          }
        });
        return isRemoved;
      }

      function removeFixedPositionElements(element) {
        const elements = element.querySelectorAll("*");
        elements.forEach((el) => {
          const style = window.getComputedStyle(el);
          if (style.position === "sticky") {
            el.remove();
          }
        });
      }

      function removeUselessTags(document) {
        const tagsToRemove = [
          "script",
          "svg",
          "button",
          "style",
          "noscript",
          "head",
          "nav",
          "footer",
          "header",
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
      }

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

      removeUselessTags(document);

      function generateZoneTree(element) {
        const zones = [];
        removeFixedPositionElements(element);

        Array.from(element.children).forEach((child) => {
          let isRemoved = removeELementsByClassName(child);

          if (isRemoved) {
            return;
          }

          const display = getComputedStyle(child).display;
          const tagName = child.tagName.toLowerCase();
          const textContent = cleanText(child.textContent);

          const isBlock =
            display === "block" || (display === "" && isBlockElement(tagName));
          const isInline =
            display === "inline" ||
            (display === "" && !isBlockElement(tagName));
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
            if (
              zones.length === 0 ||
              zones[zones.length - 1].type !== "inline"
            ) {
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
    if (bodyZone.children.length) {
      const columns = generateColumnTree(bodyZone.children);
      const mainColumn = findMainContentColumn(columns);
      const text = createTextFromColumn(mainColumn);
      await browser.close();
      console.log(JSON.stringify(text, null, 2));
      return JSON.stringify(text, null, 2);
    } else {
      return "Error in read data from page";
    }
  } catch (error) {
    return error;
  }
}

const data = await fetchPageData(
  "https://beincrypto.com/why-is-the-crypto-market-down-today/"
);
