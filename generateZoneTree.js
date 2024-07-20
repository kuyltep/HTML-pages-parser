import { JSDOM } from "jsdom";
import jquery from "jquery";
import { handleLineBreaks } from "./handleLineBreaks.js";

export async function generateZoneTree(html) {
  const { window } = new JSDOM(html);
  const $ = jquery(window);

  const body = $("body");
  let zones = [];

  function createZones(element) {
    const children = $(element).children();
    if (children.length === 0) {
      return;
    }

    children.each((index, child) => {
      const tagName = $(child).prop("tagName").toLowerCase();
      if (
        [
          "div",
          "p",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "ul",
          "ol",
          "li",
          "table",
          "tr",
          "td",
        ].includes(tagName)
      ) {
        zones.push(child);
        createZones(child);
      } else {
        const inlineZone = [];
        $(child)
          .contents()
          .each((i, inlineChild) => {
            const inlineTagName = $(inlineChild).prop("tagName")
              ? $(inlineChild).prop("tagName").toLowerCase()
              : "";
            if (
              ["span", "a", "strong", "em", "b", "i", "u", "#text"].includes(
                inlineTagName
              )
            ) {
              inlineZone.push(inlineChild);
            }
          });
        if (inlineZone.length > 0) {
          zones.push(inlineZone);
        }
      }
    });
  }

  createZones(body);

  zones = handleLineBreaks(zones, $);

  return zones;
}
