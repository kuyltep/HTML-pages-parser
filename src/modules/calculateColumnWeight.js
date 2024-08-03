const calculateZoneWeight = require("./calculateZoneWeight.js");
function calculateColumnWeight(column) {
  if (column.zones.length === 0) {
    return column.text.split(" ").length;
  }

  let weight = 0;
  column.zones.forEach((zone) => {
    weight += calculateZoneWeight(zone);
  });

  return weight;
}
module.exports = calculateColumnWeight;
