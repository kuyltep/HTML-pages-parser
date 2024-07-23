import generateColumnTree from "./modules/generateColumnTree.mjs";
import findMainContentColumn from "./modules/findMainContentColumn.mjs";
import createTextFromColumn from "./modules/createTextFromColumn.mjs";
import { launchBrowser } from "./modules/browser.mjs";

export async function fetchPageData(url) {
  const { browser, page } = await launchBrowser();

  await page.goto(url, { timeout: 0, waitUntil: "domcontentloaded" });

  const bodyZone = await page.evaluate(() => {
    function removeELementsByClassName(child) {
      let isRemoved = false;
      const removedClassNames = [
        "_widget",
        "faq",
        "footer",
        "uplp-list",
        "nav",
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
      return isRemoved;
    }

    function removeFixedPositionElements(element) {
      const elements = element.querySelectorAll("*");
      elements.forEach((el) => {
        const style = window.getComputedStyle(el);
        if (style.position === "fixed" || style.position === "sticky") {
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
  "https://www.coindesk.com/markets/2024/07/23/bitcoin-nears-66k-as-mt-gox-moves-130m-to-bitstamp/"
);
