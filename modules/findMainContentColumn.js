import calculateColumnWeight from "./calculateColumnWeight";

export default function findMainContentColumn(columns) {
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
