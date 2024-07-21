import puppeteer from "puppeteer";

async function fetchPageData(url) {
  const browser = await puppeteer.launch();
  console.log("launch");
  const page = await browser.newPage();
  console.log("page");
  await page.goto(url, { timeout: 0, waitUntil: "domcontentloaded" });
  console.log("goto");

  const bodyZone = await page.evaluate(() => {
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
          zones.push({
            type: "block",
            tag: tagName,
            text: textContent,
            rect: rect,
            children: generateZoneTree(child),
          });
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
      text: "", // Не добавляем текст из элемента body
      rect: getRect(document.body),
      children: generateZoneTree(document.body),
    };
  });

  console.log(JSON.stringify(bodyZone, null, 2));
  await browser.close();
}

fetchPageData(
  "https://dailyhodl.com/2024/07/20/one-low-cap-altcoin-on-the-verge-of-a-big-breakout-says-analyst-michael-van-de-poppe-here-are-his-targets/"
);
