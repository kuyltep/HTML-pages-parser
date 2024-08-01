import * as fs from "fs";

export default function createTextFromColumn(column) {
  const uniqueTexts = new Set();
  let text = "";
  column.zones.forEach((zone) => {
    if (zone.text.length) {
      const isBlock = isBlockElement(zone.tag);
      if (isBlock) {
        uniqueTexts.add(`${zone.text}\n\n`);
      } else {
        uniqueTexts.add(zone.text);
      }
    }
    if (zone.children.length) {
      zone.children.forEach((child) => {
        if (child.text.length) {
          const isBlock = isBlockElement(zone.tag);
          if (isBlock) {
            uniqueTexts.add(`${zone.text}\n\n`);
          } else {
            uniqueTexts.add(zone.text);
          }
        }
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
