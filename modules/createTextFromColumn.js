export default function createTextFromColumn(column) {
  const uniqueTexts = new Set();
  let text = "";
  column.zones.forEach((zone) => {
    if (zone.text.length) {
      uniqueTexts.add(zone.text);
    }
    if (zone.children.length) {
      zone.children.forEach((child) => {
        if (child.text.length) {
          uniqueTexts.add(child.text);
        }
      });
    }
  });

  uniqueTexts.forEach((value) => {
    text += `${value}\n`;
  });

  return text;
}
