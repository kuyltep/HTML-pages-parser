import removeElementsByClassName from "./modules/removeElementsByClassName";

export default async function processPage(page, url) {
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

  return bodyZone;
}
