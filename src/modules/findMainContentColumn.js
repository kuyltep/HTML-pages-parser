const calculateColumnWeight = require("./calculateColumnWeight.js");
function findMainContentColumn(columns) {
  let maxWeight = 0;
  let mainColumn = null;

  columns.forEach((column) => {
    const weight = calculateColumnWeight(column);
    if (weight > maxWeight) {
      maxWeight = weight;
      mainColumn = column;
    }
  });

  return mainColumn;
}

module.exports = findMainContentColumn;
