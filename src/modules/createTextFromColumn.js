function createTextFromColumn(column, textToRemove, url) {
  const uniqueTexts = new Set();
  let text = "";
  const especiallyDomains = ["theblock"];
  const isEspeciallyDomain = especiallyDomains.some((domain) => {
    return url.includes(domain);
  });
  const uselessText =
    textToRemove && Array.isArray(textToRemove)
      ? textToRemove
      : [
          "read more about",
          "learn more about",
          "edited by",
          "total views",
          "total shares",
          "related: ",
          "magazine: ",
          "subscribe to ",
          "subscribe now",
          "follow me",
          "join the",
          "read our",
          "i am a journalist",
          "upcoming events",
          "use cookies",
          "read more:",
          "generated image",
          "follow us",
          "click here",
          "click on",
          "surf the daily",
          "wiki crypto",
          "cookie",
          "published:",
          "share to",
          "privacy policy",
          "disclaimer",
          "top crypto platforms",
          "alphafold 3",
          "newsletter",
          "from ripple to the",
          "loading...",
          "read next:",
          "photo:",
          "about the author",
          "more articles",
          "know more",
          "trust project guidelines",
          "sign in",
        ];
  function getTextFromChilds(child) {
    if (child.text.length) {
      let isUselessText = false;
      if (!isEspeciallyDomain) {
        isUselessText = uselessText.some((uselessTextItem) => {
          return child.text.toLowerCase().includes(uselessTextItem);
        });
      }
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
    let isUselessText = false;
    if (!isEspeciallyDomain) {
      isUselessText = uselessText.some((uselessTextItem) => {
        return zone.text.toLowerCase().includes(uselessTextItem);
      });
    }
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

  [...uniqueTexts].forEach((value, index) => {
    if (index > 2) {
      text += `${value} `;
    }
  });
  text = text.trim();
  if (text.startsWith("\n\n") && text.endsWith("\n\n")) {
    text = text.slice(4, text.length - 4);
  }

  const especiallyDomainsTextToDelete = ["Disclaimer:"];
  if (isEspeciallyDomain) {
    let totalText = "";
    especiallyDomainsTextToDelete.forEach((textToDelete) => {
      const indexOfTextToDelete = text.lastIndexOf(textToDelete);
      totalText = text.slice(0, indexOfTextToDelete);
      text = totalText;
    });
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
