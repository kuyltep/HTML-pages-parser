const generateColumnTree = require("./src/modules/generateColumnTree.js");
const findMainContentColumn = require("./src/modules/findMainContentColumn.js");
const createTextFromColumn = require("./src/modules/createTextFromColumn.js");
const createBrowser = require("./src/modules/puppBrowser.js");
const proxyChain = require("proxy-chain");

let page;
let browser;
let newProxy;
/**
 * Передаем данные для proxy
 *
 * @param {string} url - page url
 * @param {string} host - host proxy
 * @param {string | number} port - port proxy
 * @param {string} username - username proxy
 * @param {string} password - password proxy
 */
async function fetchDataFromPage(url, host, port, username, password) {
  try {
    const data = await createBrowser(host, port, username, password);
    page = data[0];
    browser = data[1];
    newProxy = data[2];
    const domainsWithCloudflare = ["beincrypto.com", "cointelegraph.com"];
    let isUrlWithCloudflare = domainsWithCloudflare.some((domain) => {
      return url.includes(domain);
    });

    const withoutNavigation = [
      "coindesk.com",
      "cointelegraph.com",
      "beincrypto.com",
      "dailyhodl.com",
    ];

    await page.goto(`${url}`, {
      waitUntil: "domcontentloaded",
      timeout: 80000,
    });

    const isWithoutNavigation = withoutNavigation.some((domain) => {
      return url.includes(domain);
    });

    // if (!isWithoutNavigation) {
    //   await page.waitForNavigation({
    //     waitUntil: "domcontentloaded",
    //     timeout: 80000,
    //   });
    // }

    const body = await page.$("body");
    const bodyZone = await body.evaluate(() => {
      function removeELementsByClassName(child) {
        let isRemoved = false;
        const removedClassNames = [
          "popularRail",
          "_widget",
          "widget_",
          "faq",
          "footer",
          "uplp-list",
          "nav",
          "copyright",
          "header",
          "related",
          "want-to-know",
          "brief",
          "social",
          "tags",
          "self-stretch",
          "Cookie",
          "overflow-hidden",
          "slider",
          "join",
          "twitter",
          "linkbox",
          "sign",
          "aside",
          "post-blocks",
          "author",
          "advertisement",
          "related",
          "promo",
          "promo",
          "subscribe",
          "newsletter",
          "recommend",
          "found",
          "btn",
          "button",
          "modal",
          "disclaimer",
          "disclosure",
        ];
        removedClassNames.forEach((substring) => {
          const className = child.className.baseVal || child.className;
          if (
            (typeof className === "string" &&
              className.includes(substring) &&
              !child.tagName.toLowerCase().includes("h")) ||
            (child.id && child.id.includes("google-cache-hdr"))
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
          const fontSize = parseFloat(style.fontSize);
          if (style.position === "sticky" || fontSize <= 12) {
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
          "menu",
          "iframe",
          "source",
          "picture",
          "meta",
          "link",
          "base",
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
      console.log(text);
      return text;
    } else {
      return "Error in read data from page";
    }
  } catch (error) {
    console.log(error);
    return;
  } finally {
    await browser.close();
    if (newProxy) {
      await proxyChain.closeAnonymizedProxy(newProxy, true);
    }
  }
}

module.exports.fetchDataFromPage = fetchDataFromPage;
