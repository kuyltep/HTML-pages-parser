function createTextFromColumn(column) {
  const uniqueTexts = new Set();
  let text = "";
  const uselessText = [
    "read more about",
    "edited by",
    "generally intelligent newsletter",
    "total views",
    "total shares",
    "own this piece of crypto history",
    "collect this article as nft",
    "related: ",
    "magazine: ",
    "share ",
    "subscribe to ",
    "tags",
    "more from news",
    "permissionless",
    "upcoming events",
    "newsletter",
    "recent research",
    "breaking headlines across our core coverage categories",
    "use cookies",
    "read more:",
    "disclaimer",
    "generated image",
    "check price action",
    "follow us",
    "surf the daily",
    "wiki crypto",
    "cookie",
  ];
  function getTextFromChilds(child) {
    if (child.text.length) {
      const isUselessText = uselessText.some((uselessTextItem) => {
        return child.text.toLowerCase().includes(uselessTextItem);
      });
      if (!isUselessText) {
        const isBlock = isBlockElement(child.tag);
        if (isBlock) {
          uniqueTexts.add(`${child.text}\n\n`);
        } else {
          uniqueTexts.add(child.text);
        }
      }
    }
    if (child.children.length) {
      child.children.forEach((oneChild) => {
        getTextFromChilds(oneChild);
      });
    }
  }
  column.zones.forEach((zone) => {
    const isUselessText = uselessText.some((uselessTextItem) => {
      return zone.text.toLowerCase().includes(uselessTextItem);
    });
    if (!isUselessText) {
      if (zone.text.length) {
        const isBlock = isBlockElement(zone.tag);
        if (isBlock) {
          uniqueTexts.add(`${zone.text}\n\n`);
        } else {
          uniqueTexts.add(zone.text);
        }
      }
    }

    if (zone.children.length) {
      zone.children.forEach((child) => {
        getTextFromChilds(child);
      });
    }
  });

  uniqueTexts.forEach((value) => {
    text += `${value} `;
  });
  text = text.trim();
  if (text.startsWith("\n\n") && text.endsWith("\n\n")) {
    text = text.slice(4, text.length - 4);
  }
  return text;
}

function isBlockElement(tagName) {
  const blockElements = [
    "address",
    "article",
    "aside",
    "blockquote",
    "div",
    "fieldset",
    "figure",
    "ol",
    "output",
    "pre",
    "section",
    "table",
    "ul",
    "p",
  ];

  return blockElements.includes(tagName);
}
module.exports = createTextFromColumn;
